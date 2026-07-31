from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from decimal import Decimal
from typing import Any

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    JSON,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.database import Base

if TYPE_CHECKING:
    from models.case import Case


class DuplicateResult(Base):
    __tablename__ = "duplicate_results"
    __table_args__ = (
        UniqueConstraint(
            "case_id",
            "target_case_id",
            name="uq_duplicate_results_case_target",
        ),
    )

    duplicate_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
    )

    case_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("cases.case_id"),
        nullable=False,
    )

    target_case_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("cases.case_id"),
        nullable=False,
    )

    is_duplicate: Mapped[bool | None] = mapped_column(
        Boolean,
        nullable=True,
    )
    similarity_score: Mapped[Decimal | None] = mapped_column(
        Numeric(5, 4), nullable=True
    )
    match_reasons: Mapped[dict[str, Any] | None] = mapped_column(
        JSON, nullable=True
    )
    decision_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="SUSPECTED"
    )
    reviewed_by_user_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.user_id"), nullable=True
    )
    review_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    decided_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )

    checked_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    case: Mapped[Case] = relationship(
        back_populates="duplicate_results",
        foreign_keys=[case_id],
    )
    target_case: Mapped[Case] = relationship(
        back_populates="duplicate_target_results",
        foreign_keys=[target_case_id],
    )
