from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.database import get_db
from schemas.benefit_checks import BenefitCheckResponse
from services.benefit_checks_service import (
    check_duplicate_benefit,
    get_benefit_check,
)

router = APIRouter(tags=["Benefit Checks"])


@router.post(
    "/cases/{case_id}/benefit-check",
    response_model=BenefitCheckResponse,
    status_code=status.HTTP_201_CREATED,
    summary="중복 수혜 여부 확인",
)
def create_benefit_check(
    case_id: int,
    db: Session = Depends(get_db),
) -> BenefitCheckResponse:
    result = check_duplicate_benefit(db, case_id)

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 신고를 찾을 수 없습니다.",
        )

    return result


@router.get(
    "/cases/{case_id}/benefit-check",
    response_model=BenefitCheckResponse,
    summary="중복 수혜 결과 조회",
)
def read_benefit_check(
    case_id: int,
    db: Session = Depends(get_db),
) -> BenefitCheckResponse:
    result = get_benefit_check(db, case_id)

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="중복 수혜 결과가 없습니다.",
        )

    return result