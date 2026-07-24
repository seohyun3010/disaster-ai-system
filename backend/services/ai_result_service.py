from sqlalchemy import select
from sqlalchemy.orm import Session

from models.ai_results import AIResult


def get_ai_results_by_case(db: Session, case_id: int) -> list[AIResult]:
    statement = (
        select(AIResult)
        .where(AIResult.case_id == case_id)
        .order_by(AIResult.created_at.desc(), AIResult.result_id.desc())
    )
    return list(db.scalars(statement).all())