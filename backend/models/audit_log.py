from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    BigInteger,
    DateTime,
    ForeignKey,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from database.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    log_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.user_id"),
        nullable=False,
    )

    action: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    target_table: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    target_id: Mapped[int | None] = mapped_column(
        BigInteger,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )