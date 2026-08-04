from __future__ import annotations

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
