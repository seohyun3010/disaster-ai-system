from datetime import datetime
from decimal import Decimal
import re

from sqlalchemy import func, or_, select, text
from sqlalchemy.orm import Session, selectinload

from models.ai_results import AIResult
from models.benefit_checks import BenefitCheck
from models.case import Case
from models.duplicate_result import DuplicateResult
from models.reports import Report
from models.reviews import Review
from models.severity_result import SeverityResult
from models.subsidy import Subsidy
from models.user import User
from schemas.report import (
    ReportAnalysisResponse,
    ReportCaseResponse,
    ReportCreatorResponse,
    ReportDetailResponse,
    ReportGenerateRequest,
    ReportImageResponse,
    ReportListItemResponse,
    ReportListResponse,
    ReportSeverityResponse,
    ReportSubsidyResponse,
    ReportTimelineResponse,
    ReportUpsertRequest,
    ReportVerificationResponse,
)
from services.damage_grade_service import resolve_damage_grade


# 기존 최소 저장 로직은 연동 전 동작을 확인할 수 있도록 주석으로 보존합니다.
# def upsert_report(
#     db: Session,
#     case_id: int,
#     payload: ReportUpsertRequest,
# ) -> Report | None:
#     case = db.get(Case, case_id)
#     if case is None:
#         return None
#     report = db.scalar(
#         select(Report)
#         .where(Report.case_id == case_id)
#         .order_by(Report.report_id.desc())
#         .limit(1)
#     )
#     if report is None:
#         report = Report(case_id=case_id, created_at=datetime.now())
#         db.add(report)
#     report.file_url = payload.file_url
#     report.summary = payload.summary
#     db.commit()
#     db.refresh(report)
#     return report
#
# def get_report_by_case_id(db: Session, case_id: int) -> Report | None:
#     return db.scalar(
#         select(Report)
#         .where(Report.case_id == case_id)
#         .order_by(Report.report_id.desc())
#         .limit(1)
#     )


def upsert_report(
    db: Session,
    case_id: int,
    payload: ReportUpsertRequest,
) -> Report | None:
    """Create or update the report linked to an existing case."""
    case = db.get(Case, case_id)
    if case is None:
        return None

    report = db.scalar(
        select(Report)
        .where(Report.case_id == case_id)
        .order_by(Report.report_id.desc())
        .limit(1)
    )
    if report is None:
        report = Report(case_id=case_id, created_at=datetime.now())
        db.add(report)

    report.file_url = payload.file_url
    report.summary = payload.summary
    db.commit()
    db.refresh(report)
    return report


def get_report_by_case_id(
    db: Session,
    case_id: int,
) -> Report | None:
    statement = (
        select(Report)
        .where(Report.case_id == case_id)
        .order_by(Report.report_id.desc())
        .limit(1)
    )

    return db.scalar(statement)


def _latest(db: Session, model, case_id: int, *order_columns):
    statement = select(model).where(model.case_id == case_id)
    if order_columns:
        statement = statement.order_by(*(column.desc() for column in order_columns))
    return db.scalar(statement.limit(1))


def _creator(case: Case) -> User | None:
    return case.assigned_user or case.user


def _creator_response(case: Case) -> ReportCreatorResponse:
    user = _creator(case)
    if user is None:
        return ReportCreatorResponse()
    return ReportCreatorResponse(
        user_id=user.user_id,
        name=user.name or "담당자 미지정",
        department=user.department,
    )


def _case_number(case: Case) -> str:
    return case.case_number or f"CASE-{case.case_id}"


def _report_number(report: Report) -> str:
    return f"RPT-{report.report_id:03d}"


def _approval_result(subsidy: Subsidy | None, review: Review | None) -> str:
    if subsidy and subsidy.status:
        normalized = subsidy.status.upper()
        labels = {
            "APPROVED": "최종 승인",
            "CONFIRMED": "최종 승인",
            "REJECTED": "반려",
            "HOLD": "보류",
            "PENDING": "승인 대기",
        }
        return labels.get(normalized, subsidy.status)
    if review and review.hitl_result is not None:
        return "최종 승인" if review.hitl_result else "반려"
    return "승인 대기"


def _timeline(
    case: Case,
    report: Report,
    ai_result: AIResult | None,
    severity: SeverityResult | None,
    subsidy: Subsidy | None,
    review: Review | None,
) -> list[ReportTimelineResponse]:
    creator = _creator_response(case).name
    events = [
        ReportTimelineResponse(
            occurred_at=case.reported_at or case.received_at or case.created_at,
            title="신고 접수",
            description="피해 신고가 접수되어 사건이 생성되었습니다.",
            actor="접수 시스템",
        )
    ]
    if ai_result:
        events.append(
            ReportTimelineResponse(
                occurred_at=ai_result.created_at,
                title="AI 분석 완료",
                description=f"피해등급 {ai_result.damage_grade or '미분류'}로 분석했습니다.",
                actor="AI 업무지원",
            )
        )
    if severity:
        events.append(
            ReportTimelineResponse(
                occurred_at=severity.calculated_at,
                title="긴급도 산정",
                description=(
                    f"복구 긴급도 {severity.recovery_urgency_score:g}점"
                    f", 우선순위 {severity.recovery_priority}순위로 산정했습니다."
                ),
                actor="긴급도 산정 시스템",
            )
        )
    if subsidy:
        amount = subsidy.confirmed_amount or subsidy.estimated_amount or Decimal("0")
        events.append(
            ReportTimelineResponse(
                occurred_at=review.reviewed_at if review else report.created_at,
                title="지원금 산정",
                description=f"지원금 {amount:,.0f}원을 산정했습니다.",
                actor=creator,
            )
        )
    if review:
        events.append(
            ReportTimelineResponse(
                occurred_at=review.reviewed_at,
                title="피해등급 재판정" if review.confirmed_damage_grade else (
                    "검토 승인" if review.hitl_result else "검토 반려"
                ),
                description=(
                    f"최종 피해등급을 {review.confirmed_damage_grade}로 확정했습니다. "
                    f"{review.comment or ''}"
                ).strip() if review.confirmed_damage_grade else (
                    review.comment or "담당자 검토 결과가 반영되었습니다."
                ),
                actor=review.reviewer.name if review.reviewer else creator,
            )
        )
    events.append(
        ReportTimelineResponse(
            occurred_at=report.created_at,
            title="보고서 생성",
            description="최종 처리 결과를 기준으로 보고서를 생성했습니다.",
            actor=creator,
        )
    )
    return sorted(
        events,
        key=lambda event: event.occurred_at or datetime.min,
    )


def build_report_detail(db: Session, report: Report) -> ReportDetailResponse:
    case = db.scalar(
        select(Case)
        .options(
            selectinload(Case.user),
            selectinload(Case.assigned_user),
            selectinload(Case.case_images),
        )
        .where(Case.case_id == report.case_id)
    )
    if case is None:
        raise ValueError("보고서에 연결된 사건이 없습니다.")

    ai_result = _latest(db, AIResult, case.case_id, AIResult.created_at, AIResult.result_id)
    resolved_grade = resolve_damage_grade(db, case.case_id)
    severity = _latest(
        db,
        SeverityResult,
        case.case_id,
        SeverityResult.calculated_at,
        SeverityResult.result_id,
    )
    subsidy = _latest(db, Subsidy, case.case_id, Subsidy.subsidy_id)
    duplicate_result = _latest(
        db, DuplicateResult, case.case_id, DuplicateResult.checked_at, DuplicateResult.duplicate_id
    )
    benefit_check = _latest(
        db, BenefitCheck, case.case_id, BenefitCheck.checked_at, BenefitCheck.check_id
    )
    review = db.scalar(
        select(Review)
        .options(selectinload(Review.reviewer))
        .where(
            Review.case_id == case.case_id,
            Review.confirmed_damage_grade.is_not(None),
        )
        .order_by(Review.reviewed_at.desc(), Review.review_id.desc())
        .limit(1)
    )
    creator = _creator_response(case)
    approval_result = _approval_result(subsidy, review)
    approved_at = (
        review.reviewed_at
        if review and review.hitl_result
        else case.completed_at or report.created_at
    )
    return ReportDetailResponse(
        report_id=report.report_id,
        report_number=_report_number(report),
        status="최종",
        created_at=report.created_at,
        approved_at=approved_at,
        creator=creator,
        case=ReportCaseResponse(
            case_id=case.case_id,
            case_number=_case_number(case),
            reporter_name=case.reporter_name,
            disaster_type=case.disaster_type,
            facility_type=case.facility_type,
            address=case.address,
            reported_at=case.reported_at,
            received_at=case.received_at,
            damage_occurred_at=case.damage_occurred_at,
            contact_number=case.contact_number,
            latitude=case.latitude,
            longitude=case.longitude,
            description=case.description,
        ),
        analysis=ReportAnalysisResponse(
            damage_grade=resolved_grade.grade,
            damage_grade_source=resolved_grade.source,
            confidence=ai_result.confidence if ai_result else None,
            explanation=ai_result.ai_explanation if ai_result else None,
            inspection_required=ai_result.inspection_required if ai_result else None,
        ),
        severity=ReportSeverityResponse(
            urgency_score=severity.recovery_urgency_score if severity else 0,
            urgency_level=severity.urgency_level if severity else None,
            recovery_priority=severity.recovery_priority if severity else None,
        ),
        subsidy=ReportSubsidyResponse(
            estimated_amount=subsidy.estimated_amount if subsidy else None,
            confirmed_amount=subsidy.confirmed_amount if subsidy else None,
            status=subsidy.status if subsidy else None,
            damage_grade=subsidy.damage_grade if subsidy else None,
        ),
        verification=ReportVerificationResponse(
            duplicate_report_result=(
                "중복 의심"
                if duplicate_result and duplicate_result.is_duplicate
                else "중복 없음"
                if duplicate_result
                else "검사 이력 없음"
            ),
            duplicate_benefit_result=(
                "중복 수혜 의심"
                if benefit_check and benefit_check.is_duplicate_benefit
                else "해당 없음"
                if benefit_check
                else "검사 이력 없음"
            ),
            reviewer_comment=review.comment if review else None,
        ),
        images=[
            ReportImageResponse(
                image_id=image.image_id,
                image_url=image.image_url,
                thumbnail_url=image.thumbnail_url,
                taken_at=image.taken_at,
            )
            for image in sorted(case.case_images, key=lambda item: item.image_id)[:4]
        ],
        approval_result=approval_result,
        summary=report.summary or case.description,
        download_url=f"/reports/{report.report_id}/download",
        timeline=_timeline(case, report, ai_result, severity, subsidy, review),
    )


def generate_report(
    db: Session,
    case_id: int,
    payload: ReportGenerateRequest,
) -> Report | None:
    case = db.get(Case, case_id)
    if case is None:
        return None

    # React 개발 모드의 중복 effect나 여러 사용자의 동시 진입으로 생성 요청이
    # 겹칠 수 있습니다. PostgreSQL에서는 ID 계산부터 저장까지 한 요청만
    # 진행하도록 트랜잭션 단위 advisory lock을 사용합니다.
    if db.bind is not None and db.bind.dialect.name == "postgresql":
        db.execute(text("SELECT pg_advisory_xact_lock(:lock_key)"), {"lock_key": 72839401})

    # 잠금을 얻기 전에 다른 요청이 보고서를 만들었을 수 있으므로 반드시
    # 잠금 이후에 다시 조회합니다.
    report = get_report_by_case_id(db, case_id)
    if report is None:
        next_id = (db.scalar(select(func.max(Report.report_id))) or 0) + 1
        report = Report(
            report_id=next_id,
            case_id=case_id,
            created_at=datetime.now(),
        )
        db.add(report)
    if payload.summary is not None:
        report.summary = payload.summary
    report.file_url = f"/reports/{report.report_id}/download"
    db.commit()
    db.refresh(report)
    return report


def get_report_by_id(db: Session, report_id: int) -> Report | None:
    return db.get(Report, report_id)


def list_report_details(
    db: Session,
    *,
    search: str | None,
    sort: str,
    limit: int,
    offset: int,
) -> ReportListResponse:
    filters = []
    if search and search.strip():
        search_text = search.strip()
        keyword = f"%{search_text}%"
        search_conditions = [
            Case.case_number.ilike(keyword),
            Case.reporter_name.ilike(keyword),
            Case.disaster_type.ilike(keyword),
            Case.address.ilike(keyword),
        ]
        report_number_match = re.fullmatch(r"RPT-(\d+)", search_text, re.IGNORECASE)
        if report_number_match:
            search_conditions.append(
                Report.report_id == int(report_number_match.group(1))
            )
        filters.append(
            or_(*search_conditions)
        )
    base = select(Report).join(Case, Case.case_id == Report.case_id)
    count_statement = (
        select(func.count(Report.report_id))
        .select_from(Report)
        .join(Case, Case.case_id == Report.case_id)
    )
    if filters:
        base = base.where(*filters)
        count_statement = count_statement.where(*filters)
    order = Report.created_at.asc() if sort == "oldest" else Report.created_at.desc()
    reports = list(
        db.scalars(
            base.options(
                selectinload(Report.case).selectinload(Case.user),
                selectinload(Report.case).selectinload(Case.assigned_user),
            )
            .order_by(order, Report.report_id.desc())
            .offset(offset)
            .limit(limit)
        ).all()
    )
    items = []
    for report in reports:
        case = report.case
        items.append(
            ReportListItemResponse(
                report_id=report.report_id,
                report_number=_report_number(report),
                case_id=case.case_id,
                case_number=_case_number(case),
                reporter_name=case.reporter_name,
                disaster_type=case.disaster_type,
                address=case.address,
                status="최종",
                created_at=report.created_at,
                creator_name=_creator_response(case).name,
                download_url=f"/reports/{report.report_id}/download",
            )
        )
    return ReportListResponse(
        items=items,
        total=db.scalar(count_statement) or 0,
        limit=limit,
        offset=offset,
    )


def render_report_text(detail: ReportDetailResponse) -> str:
    amount = detail.subsidy.confirmed_amount or detail.subsidy.estimated_amount or 0
    return "\n".join(
        [
            "재해복구 업무 처리 보고서",
            "피해 복구 지원 최종 보고서",
            "",
            f"보고서번호: {detail.report_number}",
            f"사건번호: {detail.case.case_number}",
            f"신고자: {detail.case.reporter_name or '-'}",
            f"재난 유형: {detail.case.disaster_type or '-'}",
            f"시설 유형: {detail.case.facility_type or '-'}",
            f"피해 위치: {detail.case.address or '-'}",
            f"최종 피해등급: {detail.analysis.damage_grade or '-'}",
            f"긴급도 점수: {detail.severity.urgency_score:g}점",
            f"최종 지원금: {amount:,.0f}원",
            f"최종 처리 결과: {detail.approval_result}",
            f"보고서 작성자: {detail.creator.name}",
            "",
            "피해 및 처리 결과",
            detail.summary or "-",
        ]
    )
