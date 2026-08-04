from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from models.case import Case
from models.reviews import Review
from schemas.review import ReviewCreate


def create_review(db: Session, case_id: int, data: ReviewCreate) -> Review | None:
    case_exists = db.scalars(
        select(Case).where(Case.case_id == case_id)
    ).first()
    if case_exists is None:
        return None

    review = Review(
        case_id=case_id,
        reviewer_id=data.reviewer_id,
        hitl_result=data.hitl_result,
        comment=data.comment,
        confirmed_damage_grade=data.confirmed_damage_grade,
        reviewed_at=datetime.now(),
    )
    db.add(review)
    db.flush()

    if data.confirmed_damage_grade is not None:
        # Recalculate all downstream decisions from the official grade.
        from services.severity_service import calculate_and_save
        from services.subsidy_service import calculate_subsidy

        calculate_and_save(db, case_id)
        calculate_subsidy(db, case_id)
    else:
        db.commit()
    db.refresh(review)
    return review


def get_reviews_by_case(db: Session, case_id: int) -> list[Review]:
    statement = (
        select(Review)
        .where(Review.case_id == case_id)
        .order_by(Review.reviewed_at.desc(), Review.review_id.desc())
    )
    return list(db.scalars(statement).all())
