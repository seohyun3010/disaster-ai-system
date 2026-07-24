from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, Boolean, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.database import Base

if TYPE_CHECKING:
    from models.case import Case
    from models.case_image import CaseImage


class AIResult(Base):
    """SQLAlchemy model for the ai_results table."""

    __tablename__ = "ai_results"

    result_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
    )
    case_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("cases.case_id"),
        nullable=False,
    )
    image_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("case_images.image_id"),
        nullable=False,
    )
    damage_grade: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    confidence: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )
    inspection_required: Mapped[bool | None] = mapped_column(
        Boolean,
        nullable=True,
    )
    ai_explanation: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    analysis_time: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )
    created_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    case: Mapped[Case] = relationship(back_populates="ai_results")
    image: Mapped[CaseImage] = relationship(back_populates="ai_results")
