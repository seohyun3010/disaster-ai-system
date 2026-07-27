from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from models.case import Case
from models.reports import Report
from schemas.report import ReportUpsertRequest


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
