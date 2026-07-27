from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.database import get_db
from schemas.report import ReportResponse, ReportUpsertRequest
from services.report_service import get_report_by_case_id, upsert_report


router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)


@router.put(
    "/{case_id}",
    response_model=ReportResponse,
    summary="사건별 보고서 생성 또는 수정",
)
def save_report(
    case_id: int,
    payload: ReportUpsertRequest,
    db: Session = Depends(get_db),
):
    report = upsert_report(db=db, case_id=case_id, payload=payload)
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사건을 찾을 수 없습니다.",
        )
    return report


@router.get(
    "/{case_id}",
    response_model=ReportResponse,
    summary="보고서 조회",
)
def read_report(
    case_id: int,
    db: Session = Depends(get_db),
):
    report = get_report_by_case_id(
        db=db,
        case_id=case_id,
    )

    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="보고서를 찾을 수 없습니다.",
        )

    return report
