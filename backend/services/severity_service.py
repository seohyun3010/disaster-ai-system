from __future__ import annotations

from dataclasses import dataclass

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from models.case import Case
from models.ai_results import AIResult
from models.policy_reference import PolicyReference
from models.severity_result import SeverityResult
from models.severities import Severity
from services.rag_service import POLICY_VERSION, retrieve_policy_documents

SEVERITY_WEIGHTS = {
    "damage_score": 0.40,
    "human_risk_score": 0.25,
    "vulnerability_score": 0.15,
    "infrastructure_score": 0.10,
    "secondary_damage_score": 0.10,
}


@dataclass(frozen=True)
class CalculatedScores:
    severity_score: float
    severity_level: str
    recovery_urgency_score: float
    recovery_priority: int
    urgency_level: str


@dataclass(frozen=True)
class ComponentScores:
    damage_score: float
    human_risk_score: float
    vulnerability_score: float
    infrastructure_score: float
    secondary_damage_score: float
    damage_grade: str


def _level(score: float) -> str:
    if score >= 80:
        return "CRITICAL"
    if score >= 60:
        return "HIGH"
    if score >= 40:
        return "MEDIUM"
    return "LOW"


def _keyword_score(text: str, rules: tuple[tuple[tuple[str, ...], float], ...]) -> float:
    for keywords, score in rules:
        if any(keyword in text for keyword in keywords):
            return score
    return 20.0


def derive_component_scores(db: Session, case: Case) -> ComponentScores:
    """Convert stored case facts into reproducible policy-rule inputs."""
    latest_ai = db.scalar(
        select(AIResult)
        .where(AIResult.case_id == case.case_id)
        .order_by(AIResult.created_at.desc(), AIResult.result_id.desc())
        .limit(1)
    )
    text = " ".join(filter(None, [case.title, case.description, case.status])).lower()
    if not text.strip():
        raise HTTPException(
            status_code=409,
            detail="사건 설명 또는 확정 피해정보가 없어 자동 계산할 수 없습니다.",
        )
    damage_grade = (latest_ai.damage_grade if latest_ai else None) or next(
        (grade for grade in ("전파", "완파", "반파", "침수", "소파") if grade in text),
        "기타 피해",
    )
    damage_score = _keyword_score(
        f"{damage_grade} {text}",
        (
            (("전파", "완파", "전소"), 90.0),
            (("반파", "대파"), 70.0),
            (("침수",), 55.0),
            (("소파",), 40.0),
            (("피해",), 35.0),
        ),
    )
    human_risk_score = _keyword_score(
            text,
            (
                (("사망", "실종"), 100.0),
                (("인명 위험", "생명 위험"), 90.0),
                (("부상",), 75.0),
                (("고립",), 60.0),
                (("대피",), 50.0),
            ),
        )
    vulnerability_score = _keyword_score(
            text,
            (
                (("취약계층", "노인", "장애인", "아동", "영유아"), 80.0),
                (("저소득", "기초생활"), 65.0),
            ),
        )
    infrastructure_score = _keyword_score(
            text,
            (
                (("도로 단절", "교량 붕괴"), 85.0),
                (("정전", "단수", "통신 두절"), 80.0),
                (("도로", "하천", "전기", "수도", "통신"), 65.0),
            ),
        )
    secondary_damage_score = _keyword_score(
            text,
            (
                (("2차 붕괴", "산사태", "토석류"), 85.0),
                (("재발", "추가 붕괴", "여진"), 70.0),
            ),
        )
    if any(term in text for term in ("인명 피해 없음", "인명 피해가 없", "사상자 없음")):
        human_risk_score = 0.0
    if any(term in text for term in ("취약계층 없음", "취약계층이 없")):
        vulnerability_score = 0.0
    if any(
        term in text
        for term in ("기반시설 정상", "기반시설은 정상", "도로 정상", "기반 시설 정상")
    ):
        infrastructure_score = 0.0
    if any(
        term in text
        for term in ("붕괴 위험 없음", "붕괴 위험이 없", "추가 피해 없음", "2차 피해 없음")
    ):
        secondary_damage_score = 0.0
    return ComponentScores(
        damage_score=damage_score,
        human_risk_score=human_risk_score,
        vulnerability_score=vulnerability_score,
        infrastructure_score=infrastructure_score,
        secondary_damage_score=secondary_damage_score,
        damage_grade=damage_grade,
    )


def calculate_scores(data: ComponentScores) -> CalculatedScores:
    """Deterministic rule engine. RAG never generates or changes the scores."""
    severity = round(
        sum(getattr(data, key) * weight for key, weight in SEVERITY_WEIGHTS.items()),
        2,
    )
    recovery = round(
        severity * 0.70
        + data.human_risk_score * 0.15
        + data.infrastructure_score * 0.10
        + data.secondary_damage_score * 0.05,
        2,
    )
    urgency = _level(recovery)
    priority = {"CRITICAL": 1, "HIGH": 2, "MEDIUM": 3, "LOW": 4}[urgency]
    return CalculatedScores(severity, _level(severity), recovery, priority, urgency)


def calculate_and_save(
    db: Session, case_id: int
) -> SeverityResult:
    case = db.get(Case, case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="사건을 찾을 수 없습니다.")

    data = derive_component_scores(db, case)
    query = " ".join(
        filter(
            None,
            [
                case.title,
                case.description,
                data.damage_grade,
                "자연재난 피해 조사 복구계획",
                "인명 위험 사망 부상 긴급조치" if data.human_risk_score >= 60 else None,
                "취약계층 대피 지원" if data.vulnerability_score >= 60 else None,
                "도로 하천 전기 수도 기반시설 복구" if data.infrastructure_score >= 60 else None,
                "2차 붕괴 산사태 토석류 재발 위험" if data.secondary_damage_score >= 60 else None,
            ],
        )
    )
    retrieved = retrieve_policy_documents(db, query)
    if not retrieved:
        raise HTTPException(status_code=503, detail="두 정책 PDF에서 근거를 검색하지 못했습니다.")

    scores = calculate_scores(data)
    result = SeverityResult(
        case_id=case_id,
        damage_score=data.damage_score,
        human_risk_score=data.human_risk_score,
        vulnerability_score=data.vulnerability_score,
        infrastructure_score=data.infrastructure_score,
        secondary_damage_score=data.secondary_damage_score,
        severity_score=scores.severity_score,
        severity_level=scores.severity_level,
        recovery_urgency_score=scores.recovery_urgency_score,
        recovery_priority=scores.recovery_priority,
        urgency_level=scores.urgency_level,
        policy_version=POLICY_VERSION,
    )
    db.add(result)
    db.flush()
    severity_summary = db.scalar(
        select(Severity).where(Severity.case_id == case_id).limit(1)
    )
    if severity_summary is None:
        severity_summary = Severity(severity_id=case_id, case_id=case_id)
        db.add(severity_summary)
    severity_summary.score = scores.severity_score
    severity_summary.priority = scores.urgency_level
    severity_summary.calculated_at = result.calculated_at
    for item in retrieved:
        db.add(
            PolicyReference(
                severity_result_id=result.result_id,
                document_id=item.document.document_id,
                matched_content=item.matched_content,
                relevance_score=item.relevance_score,
            )
        )
    db.commit()
    return get_latest_result(db, case_id)


def get_latest_result(db: Session, case_id: int) -> SeverityResult:
    if db.get(Case, case_id) is None:
        raise HTTPException(status_code=404, detail="사건을 찾을 수 없습니다.")
    result = db.scalar(
        select(SeverityResult)
        .where(SeverityResult.case_id == case_id)
        .options(
            selectinload(SeverityResult.document_references).selectinload(
                PolicyReference.document
            )
        )
        .order_by(SeverityResult.calculated_at.desc(), SeverityResult.result_id.desc())
        .limit(1)
    )
    if result is None:
        raise HTTPException(status_code=404, detail="계산된 심각도 결과가 없습니다.")
    return result
