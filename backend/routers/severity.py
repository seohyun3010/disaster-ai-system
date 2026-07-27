from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from database.database import get_db
from models.severity_result import SeverityResult
from schemas.severity import (
    PolicyReferenceResponse,
    SeverityResponse,
)
from services.severity_service import calculate_and_save, get_latest_result

router = APIRouter(prefix="/cases/{case_id}", tags=["severity"])


def _reference_response(reference) -> PolicyReferenceResponse:
    document = reference.document
    return PolicyReferenceResponse(
        document_id=document.document_id,
        document_code=document.document_code,
        document_name=document.document_name,
        article=document.article,
        content=document.content,
        version=document.policy_version,
        matched_content=reference.matched_content,
        relevance_score=reference.relevance_score,
    )


def _result_response(result: SeverityResult) -> SeverityResponse:
    return SeverityResponse(
        result_id=result.result_id,
        case_id=result.case_id,
        severity_score=result.severity_score,
        severity_level=result.severity_level,
        recovery_urgency_score=result.recovery_urgency_score,
        recovery_priority=result.recovery_priority,
        urgency_level=result.urgency_level,
        policy_version=result.policy_version,
        calculated_at=result.calculated_at,
        calculation_method="CASE_DATA_RAG_RULE_ENGINE",
        component_scores={
            "damage_score": result.damage_score,
            "human_risk_score": result.human_risk_score,
            "vulnerability_score": result.vulnerability_score,
            "infrastructure_score": result.infrastructure_score,
            "secondary_damage_score": result.secondary_damage_score,
        },
        document_references=[
            _reference_response(reference) for reference in result.document_references
        ],
    )


@router.post(
    "/severity/calculate",
    response_model=SeverityResponse,
    status_code=status.HTTP_201_CREATED,
    summary="심각도 및 복구 긴급도 계산",
)
def calculate_severity(
    case_id: int,
    db: Session = Depends(get_db),
) -> SeverityResponse:
    return _result_response(calculate_and_save(db, case_id))


@router.get(
    "/severity", response_model=SeverityResponse, summary="최근 심각도 계산 결과 조회"
)
def read_severity(case_id: int, db: Session = Depends(get_db)) -> SeverityResponse:
    return _result_response(get_latest_result(db, case_id))


@router.get(
    "/policy-references",
    response_model=list[PolicyReferenceResponse],
    summary="최근 계산에 적용된 정책 근거 조회",
)
def read_policy_references(
    case_id: int, db: Session = Depends(get_db)
) -> list[PolicyReferenceResponse]:
    result = get_latest_result(db, case_id)
    return [_reference_response(reference) for reference in result.document_references]
