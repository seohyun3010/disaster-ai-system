import traceback
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.database import get_db
from schemas.external_report import (
    ExternalReportCreate,
    ExternalReportResponse,
)
from services.external_report import (
    DuplicateExternalReportError,
    create_external_report,
)


router = APIRouter(
    prefix="/external-reports",
    tags=["external-reports"],
)


@router.post(
    "",
    response_model=ExternalReportResponse,
    status_code=status.HTTP_201_CREATED,
)
def receive_external_report(
    report: ExternalReportCreate,
    db: Session = Depends(get_db),
):
    """외부 시스템에서 전달한 피해 신고를 저장한다."""

    try:
        new_case = create_external_report(
            db=db,
            report=report,
        )

        return {
            "message": "외부 신고가 정상적으로 접수되었습니다.",
            "external_report_id": new_case.external_report_id,
            "case_id": new_case.case_id,
            "case_number": new_case.case_number,
            "status": new_case.status,
            "created_at": new_case.created_at,
        }

    except DuplicateExternalReportError as error:
        existing_case = error.existing_case

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": "이미 접수된 외부 신고입니다.",
                "external_report_id": existing_case.external_report_id,
                "case_id": existing_case.case_id,
                "case_number": existing_case.case_number,
                "status": existing_case.status,
            },
        ) from error

    except Exception as error:
        traceback.print_exc()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="외부 신고 저장 중 오류가 발생했습니다.",
        ) from error