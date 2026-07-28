from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any, TYPE_CHECKING

from sqlalchemy import BigInteger, DateTime, JSON, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.database import Base

if TYPE_CHECKING:
    from models.case import Case


class ExternalReport(Base):
    __tablename__ = "external_reports"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    external_report_id: Mapped[str] = mapped_column(
        String(255), nullable=False, unique=True, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    disaster_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    facility_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    sido: Mapped[str | None] = mapped_column(String(100), nullable=True)
    sigungu: Mapped[str | None] = mapped_column(String(100), nullable=True)
    latitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 7), nullable=True)
    longitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 7), nullable=True)
    reported_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    received_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    raw_payload: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    processing_status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="PROCESSED"
    )

    case: Mapped[Case | None] = relationship(
        back_populates="external_report", uselist=False
    )
