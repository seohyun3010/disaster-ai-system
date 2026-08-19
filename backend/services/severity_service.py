from __future__ import annotations

from datetime import datetime
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from models.case import Case
from models.severity_result import SeverityResult
from models.severities import Severity
from services.recovery_urgency_rules import (
    AI_GRADE_SCORES,
    HOUSEHOLD_ELIGIBLE_FACILITY_TYPES,
    URGENCY_RULE_VERSION,
    UrgencyComponents,
    calculate_scores,
    facility_livelihood_score,
    household_score,
)
from services.damage_grade_service import resolve_damage_grade
from schemas.severity import SeverityManualUpdateRequest


_COMPONENT_LABELS = {
    "ai_grade_score": "AI 피해등급 점수",
    "household_score": "가구원 수 점수",
    "facility_livelihood_score": "시설·이재민 긴급도 점수",
}


def derive_urgency_components(db: Session, case: Case) -> UrgencyComponents:
    resolved_grade = resolve_damage_grade(db, case.case_id)
    raw_damage_grade = resolved_grade.grade
    if not raw_damage_grade:
        raise HTTPException(
            status_code=409,
            detail="AI 피해등급이 없어 복구 긴급도를 계산할 수 없습니다.",
        )

    damage_grade = raw_damage_grade.strip().upper()
    if damage_grade not in AI_GRADE_SCORES:
        raise HTTPException(
            status_code=409,
            detail=f"지원하지 않는 피해등급입니다: {raw_damage_grade}",
        )

    facility_type = (case.facility_type or "").strip().upper()
    if not facility_type:
        raise HTTPException(
            status_code=409,
            detail="시설유형이 없어 복구 긴급도를 계산할 수 없습니다.",
        )

    household = (
        household_score(case.household_members)
        if facility_type in HOUSEHOLD_ELIGIBLE_FACILITY_TYPES
        else 0.0
    )
    return UrgencyComponents(
        ai_grade_score=AI_GRADE_SCORES[damage_grade],
        household_score=household,
        facility_livelihood_score=facility_livelihood_score(
            facility_type, damage_grade
        ),
        damage_grade=damage_grade,
        facility_type=facility_type,
    )


def calculate_and_save(db: Session, case_id: int) -> SeverityResult:
    case = db.get(Case, case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="사건을 찾을 수 없습니다.")

    components = derive_urgency_components(db, case)
    scores = calculate_scores(components)
    resolved_grade = resolve_damage_grade(db, case_id)
    result = SeverityResult(
        case_id=case_id,
        damage_score=components.ai_grade_score,
        human_risk_score=0.0,
        vulnerability_score=components.household_score,
        infrastructure_score=components.facility_livelihood_score,
        secondary_damage_score=0.0,
        severity_score=scores.severity_score,
        severity_level=scores.severity_level,
        recovery_urgency_score=scores.recovery_urgency_score,
        recovery_priority=scores.recovery_priority,
        urgency_level=scores.urgency_level,
        applied_damage_grade=components.damage_grade,
        damage_grade_source=resolved_grade.source,
        rule_version=URGENCY_RULE_VERSION,
    )
    db.add(result)
    db.flush()

    severity_summary = db.scalar(
        select(Severity).where(Severity.case_id == case_id).limit(1)
    )
    if severity_summary is None:
        severity_summary = Severity(severity_id=case_id, case_id=case_id)
        db.add(severity_summary)
    severity_summary.score = scores.recovery_urgency_score
    severity_summary.priority = scores.urgency_level
    severity_summary.calculated_at = result.calculated_at

    db.commit()
    return get_latest_result(db, case_id)


def get_latest_result(db: Session, case_id: int) -> SeverityResult:
    if db.get(Case, case_id) is None:
        raise HTTPException(status_code=404, detail="사건을 찾을 수 없습니다.")
    result = db.scalar(
        select(SeverityResult)
        .where(SeverityResult.case_id == case_id)
        .order_by(SeverityResult.calculated_at.desc(), SeverityResult.result_id.desc())
        .limit(1)
    )
    if result is None:
        raise HTTPException(status_code=404, detail="계산된 복구 긴급도 결과가 없습니다.")
    return result


def save_manual_scores(
    db: Session, case_id: int, payload: SeverityManualUpdateRequest
) -> SeverityResult:
    """Save a new auditable severity result based on the latest calculation."""
    current = get_latest_result(db, case_id)
    damage = payload.ai_grade_score if payload.ai_grade_score is not None else current.damage_score
    household = payload.household_score if payload.household_score is not None else current.vulnerability_score
    facility = (
        payload.facility_livelihood_score
        if payload.facility_livelihood_score is not None
        else current.infrastructure_score
    )
    total = payload.recovery_urgency_score
    if total is None:
        total = round(min(damage + household + facility, 100.0), 2)
    level = "CRITICAL" if total >= 80 else "HIGH" if total >= 60 else "MEDIUM" if total >= 40 else "LOW"
    priority = {"CRITICAL": 1, "HIGH": 2, "MEDIUM": 3, "LOW": 4}[level]
    adjusted_at = datetime.utcnow()
    result = SeverityResult(
        case_id=case_id,
        damage_score=damage,
        human_risk_score=current.human_risk_score,
        vulnerability_score=household,
        infrastructure_score=facility,
        secondary_damage_score=current.secondary_damage_score,
        severity_score=total,
        severity_level=level,
        recovery_urgency_score=total,
        recovery_priority=priority,
        urgency_level=level,
        applied_damage_grade=current.applied_damage_grade,
        damage_grade_source=current.damage_grade_source,
        rule_version=current.rule_version,
        is_manual=True,
        manual_adjustment_reason=payload.reason or " / ".join(
            f"{_COMPONENT_LABELS.get(key, key)}: {value}"
            for key, value in payload.component_reasons.items()
        ),
        component_adjustment_reasons=payload.component_reasons or None,
        manually_adjusted_at=adjusted_at,
        calculated_at=adjusted_at,
    )
    db.add(result)
    summary = db.scalar(select(Severity).where(Severity.case_id == case_id).limit(1))
    if summary is None:
        summary = Severity(severity_id=case_id, case_id=case_id)
        db.add(summary)
    summary.score = total
    summary.priority = level
    summary.calculated_at = adjusted_at
    db.commit()
    return get_latest_result(db, case_id)
