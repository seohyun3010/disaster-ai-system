from sqlalchemy import select
from sqlalchemy.orm import Session

from models.reports import Report


def get_report_by_case_id(
    db: Session,
    case_id: int,
) -> Report | None:
    statement = (
        select(Report)
        .where(Report.case_id == case_id)
    )

    return db.scalar(statement)