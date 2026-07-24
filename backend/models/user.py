from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.database import Base

if TYPE_CHECKING:
    from models.audit_log import AuditLog
    from models.case import Case
    from models.reviews import Review


class User(Base):
    """SQLAlchemy model for the users table."""

    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
    )
    name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    email: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        unique=True,
    )
    password: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    role: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    department: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    # 로그아웃 시 무효화하려면 "지금 유효한 refresh token이 뭔지"를 서버가 기억해야 함.
    # refresh 요청이 오면 여기 저장된 값과 비교하고, 로그아웃하면 이 값을 NULL로 지움.
    refresh_token: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )
    created_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    cases: Mapped[list[Case]] = relationship(back_populates="user")
    audit_logs: Mapped[list[AuditLog]] = relationship(back_populates="user")
    reviews: Mapped[list[Review]] = relationship(back_populates="reviewer")
