from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from database.database import get_db
from schemas.report import (
    ReportDetailResponse,
    ReportGenerateRequest,
    ReportListResponse,
)
from services.report_service import (
    build_report_detail,
    generate_report,
    get_report_by_case_id,
    get_report_by_id,
    list_report_details,
)
from services.report_pdf_service import render_report_pdf
from services.report_pdf_form_service import render_form_report_pdf


router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)


# 기존 연동 전 API는 삭제하지 않고 주석으로 보존합니다.
# @router.put("/{case_id}", response_model=ReportResponse)
# def save_report(case_id: int, payload: ReportUpsertRequest, db: Session = Depends(get_db)):
#     report = upsert_report(db=db, case_id=case_id, payload=payload)
#     if report is None:
#         raise HTTPException(status_code=404, detail="사건을 찾을 수 없습니다.")
#     return report
#
# @router.get("/{case_id}", response_model=ReportResponse)
# def read_report(case_id: int, db: Session = Depends(get_db)):
#     report = get_report_by_case_id(db=db, case_id=case_id)
#     if report is None:
#         raise HTTPException(status_code=404, detail="보고서를 찾을 수 없습니다.")
#     return report


@router.get("", response_model=ReportListResponse, summary="최종 보고서 목록 조회")
def read_reports(
    search: str | None = Query(default=None),
    sort: str = Query(default="latest", pattern="^(latest|oldest)$"),
    limit: int = Query(default=10, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> ReportListResponse:
    return list_report_details(
        db,
        search=search,
        sort=sort,
        limit=limit,
        offset=offset,
    )


@router.post(
    "/cases/{case_id}",
    response_model=ReportDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="사건의 최종 보고서 생성",
)
def create_report(
    case_id: int,
    payload: ReportGenerateRequest,
    db: Session = Depends(get_db),
) -> ReportDetailResponse:
    report = generate_report(db, case_id, payload)
    if report is None:
        raise HTTPException(status_code=404, detail="사건을 찾을 수 없습니다.")
    return build_report_detail(db, report)


@router.get(
    "/cases/{case_id}",
    response_model=ReportDetailResponse,
    summary="사건의 최신 최종 보고서 조회",
)
def read_report_by_case(
    case_id: int,
    db: Session = Depends(get_db),
) -> ReportDetailResponse:
    report = get_report_by_case_id(db, case_id)
    if report is None:
        raise HTTPException(status_code=404, detail="보고서를 찾을 수 없습니다.")
    return build_report_detail(db, report)


@router.get(
    "/{report_id}",
    response_model=ReportDetailResponse,
    summary="보고서 상세 조회",
)
def read_report(
    report_id: int,
    db: Session = Depends(get_db),
) -> ReportDetailResponse:
    report = get_report_by_id(db, report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="보고서를 찾을 수 없습니다.")
    return build_report_detail(db, report)


@router.get("/{report_id}/download", summary="최종 보고서 파일 다운로드")
def download_report(
    report_id: int,
    db: Session = Depends(get_db),
) -> Response:
    report = get_report_by_id(db, report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="보고서를 찾을 수 없습니다.")
    detail = build_report_detail(db, report)
    # 기존 TXT 다운로드 응답은 삭제하지 않고 아래에 주석으로 보존합니다.
    # filename = f"{detail.case.case_number}_final_report.txt"
    # return Response(
    #     content=render_report_text(detail).encode("utf-8-sig"),
    #     media_type="text/plain; charset=utf-8",
    #     headers={
    #         "Content-Disposition": (
    #             f"attachment; filename=final_report_{report_id}.txt; "
    #             f"filename*=UTF-8''{quote(filename)}"
    #         )
    #     },
    # )
    filename = f"{detail.case.case_number}_final_report.pdf"
    return Response(
        # 기존 1페이지 요약형 PDF 생성기는 보존하고, 예시 공문형 3페이지
        # 양식은 별도 생성기로 적용합니다.
        content=render_form_report_pdf(detail),
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f"attachment; filename=final_report_{report_id}.pdf; "
                f"filename*=UTF-8''{quote(filename)}"
            )
        },
    )
