from __future__ import annotations

from datetime import datetime
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.database import Base

from models.case import Case


class SeverityResult(Base):
    __tablename__ = "severity_results"

    result_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.case_id"), nullable=False, index=True)
    damage_score: Mapped[float] = mapped_column(Float, nullable=False)
    human_risk_score: Mapped[float] = mapped_column(Float, nullable=False)
    vulnerability_score: Mapped[float] = mapped_column(Float, nullable=False)
    infrastructure_score: Mapped[float] = mapped_column(Float, nullable=False)
    secondary_damage_score: Mapped[float] = mapped_column(Float, nullable=False)
    severity_score: Mapped[float] = mapped_column(Float, nullable=False)
    severity_level: Mapped[str] = mapped_column(String(20), nullable=False)
    recovery_urgency_score: Mapped[float] = mapped_column(Float, nullable=False)
    recovery_priority: Mapped[int] = mapped_column(Integer, nullable=False)
    urgency_level: Mapped[str] = mapped_column(String(20), nullable=False)
    applied_damage_grade: Mapped[str | None] = mapped_column(String(10), nullable=True)
    damage_grade_source: Mapped[str | None] = mapped_column(String(20), nullable=True)
    rule_version: Mapped[str] = mapped_column(String(100), nullable=False)
    is_manual: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    manual_adjustment_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    component_adjustment_reasons: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    manually_adjusted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    calculated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )

    case: Mapped["Case"] = relationship()
