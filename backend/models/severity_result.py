from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.database import Base

if TYPE_CHECKING:
    from models.case import Case
    from models.policy_reference import PolicyReference


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
    policy_version: Mapped[str] = mapped_column(String(100), nullable=False)
    calculated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )

    case: Mapped["Case"] = relationship()
    document_references: Mapped[list["PolicyReference"]] = relationship(
        back_populates="severity_result", cascade="all, delete-orphan"
    )
