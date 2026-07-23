from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column

from database.database import Base


class Review(Base):
    """SQLAlchemy model for the reviews table."""

    __tablename__ = "reviews"

    review_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
    )
    case_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("cases.case_id"),
        nullable=False,
    )
    reviewer_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.user_id"),
        nullable=False,
    )
    hitl_result: Mapped[bool | None] = mapped_column(
        Boolean,
        nullable=True,
    )
    comment: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )
