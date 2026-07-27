from sqlalchemy import select
from sqlalchemy.orm import Session

from models.case import Case
from models.subsidy import Subsidy
from schemas.subsidy import SubsidyUpsertRequest


def upsert_subsidy(
    db: Session,
    case_id: int,
    payload: SubsidyUpsertRequest,
) -> Subsidy | None:
    """Create or update the subsidy linked to an existing case."""
    if db.get(Case, case_id) is None:
        return None

    subsidy = db.scalar(
        select(Subsidy)
        .where(Subsidy.case_id == case_id)
        .order_by(Subsidy.subsidy_id.desc())
        .limit(1)
    )
    if subsidy is None:
        subsidy = Subsidy(case_id=case_id)
        db.add(subsidy)

    subsidy.estimated_amount = payload.estimated_amount
    subsidy.confirmed_amount = payload.confirmed_amount
    subsidy.status = payload.status
    db.commit()
    db.refresh(subsidy)
    return subsidy


def get_subsidy_by_case_id(
    db: Session,
    case_id: int,
) -> Subsidy | None:
    statement = (
        select(Subsidy)
        .where(Subsidy.case_id == case_id)
        .order_by(Subsidy.subsidy_id.desc())
        .limit(1)
    )

    return db.scalar(statement)
