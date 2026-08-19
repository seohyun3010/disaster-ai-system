from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from database.database import get_db
from models.severity_result import SeverityResult
from schemas.severity import SeverityManualUpdateRequest, SeverityResponse
from services.severity_service import calculate_and_save, get_latest_result, save_manual_scores


router = APIRouter(prefix="/cases/{case_id}", tags=["severity"])


def _result_response(result: SeverityResult) -> SeverityResponse:
    return SeverityResponse(
        result_id=result.result_id,
        case_id=result.case_id,
        severity_score=result.severity_score,
        severity_level=result.severity_level,
        recovery_urgency_score=result.recovery_urgency_score,
        recovery_priority=result.recovery_priority,
        urgency_level=result.urgency_level,
        applied_damage_grade=result.applied_damage_grade,
        damage_grade_source=result.damage_grade_source,
        rule_version=result.rule_version,
        calculated_at=result.calculated_at,
        calculation_method="RECOVERY_URGENCY_RULE_ENGINE",
        component_scores={
            "ai_grade_score": result.damage_score,
            "household_score": result.vulnerability_score,
            "facility_livelihood_score": result.infrastructure_score,
        },
        is_manual=result.is_manual,
        manual_adjustment_reason=result.manual_adjustment_reason,
        manually_adjusted_at=result.manually_adjusted_at,
        component_reasons=result.component_adjustment_reasons or {},
    )


@router.post(
    "/severity/calculate",
    response_model=SeverityResponse,
    status_code=status.HTTP_201_CREATED,
    summary="복구 긴급도 계산 및 저장",
)
def calculate_severity(
    case_id: int,
    db: Session = Depends(get_db),
) -> SeverityResponse:
    return _result_response(calculate_and_save(db, case_id))


@router.get(
    "/severity",
    response_model=SeverityResponse,
    summary="최근 복구 긴급도 결과 조회",
)
def read_severity(case_id: int, db: Session = Depends(get_db)) -> SeverityResponse:
    return _result_response(get_latest_result(db, case_id))


@router.put(
    "/severity/manual",
    response_model=SeverityResponse,
    summary="복구 긴급도 수동 수정 저장",
)
def update_severity_manually(
    case_id: int,
    payload: SeverityManualUpdateRequest,
    db: Session = Depends(get_db),
) -> SeverityResponse:
    return _result_response(save_manual_scores(db, case_id, payload))
