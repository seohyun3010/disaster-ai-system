from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from database.database import Base


class DuplicateResult(Base):
    __tablename__ = "duplicate_results"

    duplicate_id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True
    )

    case_id: Mapped[int] = mapped_column(
        ForeignKey("cases.case_id"),
        nullable=False
    )

    target_case_id: Mapped[int] = mapped_column(
        ForeignKey("cases.case_id"),
        nullable=False
    )

    is_duplicate: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False
    )

    checked_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )