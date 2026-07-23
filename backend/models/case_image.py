from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.database import Base

if TYPE_CHECKING:
    from models.ai_results import AIResult
    from models.case import Case


class CaseImage(Base):
    __tablename__ = "case_images"

    image_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
    )
    case_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("cases.case_id"),
        nullable=False,
    )
    image_url: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    thumbnail_url: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    image_hash: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        unique=True,
    )
    taken_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    case: Mapped[Case] = relationship(back_populates="case_images")
    ai_results: Mapped[list[AIResult]] = relationship(back_populates="image")
