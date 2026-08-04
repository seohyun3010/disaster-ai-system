from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from models.ai_results import AIResult
from models.reviews import Review


@dataclass(frozen=True)
class ResolvedDamageGrade:
    grade: str | None
    source: str
    review: Review | None = None
    ai_result: AIResult | None = None


def resolve_damage_grade(db: Session, case_id: int) -> ResolvedDamageGrade:
    review = db.scalar(
        select(Review)
        .where(
            Review.case_id == case_id,
            Review.confirmed_damage_grade.is_not(None),
        )
        .order_by(Review.reviewed_at.desc(), Review.review_id.desc())
        .limit(1)
    )
    if review is not None and review.confirmed_damage_grade:
        return ResolvedDamageGrade(
            grade=review.confirmed_damage_grade.strip().upper(),
            source="OFFICIAL_REVIEW",
            review=review,
        )

    ai_result = db.scalar(
        select(AIResult)
        .where(AIResult.case_id == case_id)
        .order_by(AIResult.created_at.desc(), AIResult.result_id.desc())
        .limit(1)
    )
    return ResolvedDamageGrade(
        grade=(ai_result.damage_grade.strip().upper() if ai_result and ai_result.damage_grade else None),
        source="AI_RESULT",
        ai_result=ai_result,
    )
