from sqlalchemy import select
from sqlalchemy.orm import Session

from models.subsidy import Subsidy


def get_subsidy_by_case_id(
    db: Session,
    case_id: int,
) -> Subsidy | None:
    statement = (
        select(Subsidy)
        .where(Subsidy.case_id == case_id)
    )

    return db.scalar(statement)