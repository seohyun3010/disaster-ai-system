from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from database.database import Base


class BenefitCheck(Base):
    __tablename__ = "benefit_checks"

    check_id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True
    )

    case_id: Mapped[int] = mapped_column(
        ForeignKey("cases.case_id"),
        nullable=False
    )

    previous_case_id: Mapped[int | None] = mapped_column(
        ForeignKey("cases.case_id"),
        nullable=True
    )

    is_duplicate_benefit: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False
    )

    checked_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )