from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column

from database.database import Base


class Report(Base):
    """SQLAlchemy model for the reports table."""

    __tablename__ = "reports"

    report_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
    )
    case_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("cases.case_id"),
        nullable=False,
    )
    file_url: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    summary: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    created_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )
