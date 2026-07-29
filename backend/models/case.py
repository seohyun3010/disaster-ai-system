from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any, TYPE_CHECKING

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.database import Base

if TYPE_CHECKING:
    from models.ai_job import AIJob
    from models.ai_results import AIResult
    from models.benefit_checks import BenefitCheck
    from models.case_image import CaseImage
    from models.duplicate_result import DuplicateResult
    from models.reports import Report
    from models.reviews import Review
    from models.severities import Severity
    from models.subsidy import Subsidy
    from models.user import User


class Case(Base):
    __tablename__ = "cases"

    case_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
    )

    case_number: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        unique=True,
    )

    external_report_id: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        unique=True,
    )

    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.user_id"),
        nullable=False,
    )

    title: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    disaster_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    facility_type: Mapped[str | None] = mapped_column(String(100), nullable=True)

    latitude: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 7),
        nullable=True,
    )

    longitude: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 7),
        nullable=True,
    )

    address: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    reporter_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    resident_registration_number: Mapped[str | None] = mapped_column(
        String(20), nullable=True
    )
    contact_number: Mapped[str | None] = mapped_column(String(30), nullable=True)
    household_members: Mapped[int | None] = mapped_column(Integer, nullable=True)
    bank_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    account_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    account_holder: Mapped[str | None] = mapped_column(String(100), nullable=True)
    damage_occurred_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )
    damage_details: Mapped[list[dict[str, Any]] | None] = mapped_column(
        JSON, nullable=True
    )

    sido: Mapped[str | None] = mapped_column(String(100), nullable=True)
    sigungu: Mapped[str | None] = mapped_column(String(100), nullable=True)
    reported_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    received_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    raw_payload: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)

    status: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    duplicate_suspected: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    priority: Mapped[str] = mapped_column(
        String(50), nullable=False, default="NORMAL"
    )

    created_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    assigned_user_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.user_id"), nullable=True
    )

    user: Mapped[User] = relationship(
        back_populates="cases", foreign_keys=[user_id]
    )
    assigned_user: Mapped[User | None] = relationship(
        foreign_keys=[assigned_user_id]
    )
    case_images: Mapped[list[CaseImage]] = relationship(back_populates="case")
    ai_jobs: Mapped[list[AIJob]] = relationship(back_populates="case")
    ai_results: Mapped[list[AIResult]] = relationship(back_populates="case")
    duplicate_results: Mapped[list[DuplicateResult]] = relationship(
        back_populates="case",
        foreign_keys="DuplicateResult.case_id",
    )
    duplicate_target_results: Mapped[list[DuplicateResult]] = relationship(
        back_populates="target_case",
        foreign_keys="DuplicateResult.target_case_id",
    )
    benefit_checks: Mapped[list[BenefitCheck]] = relationship(
        back_populates="case",
        foreign_keys="BenefitCheck.case_id",
    )
    previous_benefit_checks: Mapped[list[BenefitCheck]] = relationship(
        back_populates="previous_case",
        foreign_keys="BenefitCheck.previous_case_id",
    )
    severities: Mapped[list[Severity]] = relationship(back_populates="case")
    subsidies: Mapped[list[Subsidy]] = relationship(back_populates="case")
    reports: Mapped[list[Report]] = relationship(back_populates="case")
    reviews: Mapped[list[Review]] = relationship(back_populates="case")

    @property
    def representative_image_url(self) -> str | None:
        if not self.case_images:
            return None
        first_image = self.case_images[0]
        return first_image.thumbnail_url or first_image.image_url
