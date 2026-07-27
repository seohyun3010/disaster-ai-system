from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.database import get_db
from schemas.subsidy import SubsidyResponse
from services.subsidy_service import get_subsidy_by_case_id

router = APIRouter(
    prefix="/subsidies",
    tags=["Subsidies"],
)


@router.get(
    "/{case_id}",
    response_model=SubsidyResponse,
    summary="지원금 조회",
)
def read_subsidy(
    case_id: int,
    db: Session = Depends(get_db),
):
    subsidy = get_subsidy_by_case_id(
        db=db,
        case_id=case_id,
    )

    if subsidy is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="지원금 정보를 찾을 수 없습니다.",
        )

    return subsidy