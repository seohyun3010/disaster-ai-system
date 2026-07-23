"""severities — 심각도 점수/우선순위."""
 
from datetime import datetime
from typing import Optional
 
from sqlalchemy import BigInteger, DateTime, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column
 
from database.database import Base
 
 
class Severity(Base):
    __tablename__ = "severities"
 
    severity_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    case_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("cases.case_id"), nullable=False, index=True
    )
 
    score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    priority: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    calculated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)