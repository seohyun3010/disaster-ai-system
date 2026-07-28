from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.database import get_db
from schemas.external_report import ExternalReportCreate, ExternalReportResponse
from services.external_report import (
    DuplicateExternalReportError,
    create_external_report,
)

router = APIRouter(prefix="/external-reports", tags=["external-reports"])


@router.post(
    "",
    response_model=ExternalReportResponse,
    status_code=status.HTTP_201_CREATED,
)
def receive_external_report(
    report: ExternalReportCreate, db: Session = Depends(get_db)
):
    try:
        case = create_external_report(db=db, report=report)
        return {
            "external_report_id": case.external_report_id,
            "case_id": case.case_id,
            "case_number": case.case_number,
            "status": case.status,
        }
    except DuplicateExternalReportError as error:
        case = error.existing_case
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": "External report already received",
                "external_report_id": case.external_report_id,
                "case_id": case.case_id,
                "case_number": case.case_number,
                "status": case.status,
            },
        ) from error
