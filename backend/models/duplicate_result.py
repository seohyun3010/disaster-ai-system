from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.database import Base

if TYPE_CHECKING:
    from models.case import Case


class DuplicateResult(Base):
    __tablename__ = "duplicate_results"

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
