from sqlalchemy import func, select
from sqlalchemy.orm import Session

from models.case import Case


def list_cases(
    db: Session, *, status: str | None, limit: int, offset: int
) -> tuple[list[Case], int]:
    filters = [Case.status == status] if status else []
    total = int(db.scalar(select(func.count(Case.case_id)).where(*filters)) or 0)
    items = list(
        db.scalars(
            select(Case)
            .where(*filters)
            .order_by(Case.created_at.desc(), Case.case_id.desc())
            .limit(limit)
            .offset(offset)
        ).all()
    )
    return items, total


def get_case(db: Session, case_id: int) -> Case | None:
    return db.get(Case, case_id)
