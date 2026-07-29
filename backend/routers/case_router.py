from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from database.database import get_db
from schemas.case import CaseCreate, CaseListResponse, CaseResponse
from services.case_service import (
    DuplicateCaseReportError,
    create_case,
    get_case,
    list_cases,
)

router = APIRouter(prefix="/cases", tags=["cases"])


@router.post("", response_model=CaseResponse, status_code=status.HTTP_201_CREATED)
def register_case(body: CaseCreate, db: Session = Depends(get_db)):
    try:
        return create_case(db, body)
    except DuplicateCaseReportError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": "이미 등록된 신고번호입니다.",
                "external_report_id": error.existing_case.external_report_id,
                "case_id": error.existing_case.case_id,
                "case_number": error.existing_case.case_number,
            },
        ) from error


@router.get("", response_model=CaseListResponse)
def read_cases(
    case_status: str | None = Query(default=None, alias="status"),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    items, total = list_cases(
        db, status=case_status, limit=limit, offset=offset
    )
    return {"items": items, "total": total, "limit": limit, "offset": offset}


@router.get("/{case_id}", response_model=CaseResponse)
def read_case(case_id: int, db: Session = Depends(get_db)):
    case = get_case(db, case_id)
    if case is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Case not found"
        )
    return case
