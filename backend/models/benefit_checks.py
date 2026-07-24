from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.database import Base

if TYPE_CHECKING:
    from models.case import Case


class BenefitCheck(Base):
    __tablename__ = "benefit_checks"

    check_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
    )

    case_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("cases.case_id"),
        nullable=False,
    )

    previous_case_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("cases.case_id"),
        nullable=True,
    )

    is_duplicate_benefit: Mapped[bool | None] = mapped_column(
        Boolean,
        nullable=True,
    )

    checked_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    case: Mapped[Case] = relationship(
        back_populates="benefit_checks",
        foreign_keys=[case_id],
    )
    previous_case: Mapped[Case | None] = relationship(
        back_populates="previous_benefit_checks",
        foreign_keys=[previous_case_id],
    )
