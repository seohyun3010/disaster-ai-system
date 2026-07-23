"""subsidies — 지원금(복구비) 산정."""
 
from typing import Optional
 
from sqlalchemy import BigInteger, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column
 
from database.database import Base
 
 
class Subsidy(Base):
    __tablename__ = "subsidies"
 
    subsidy_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    case_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("cases.case_id"), nullable=False, index=True
    )
 
    estimated_amount: Mapped[Optional[float]] = mapped_column(Numeric(15, 2), nullable=True)
    confirmed_amount: Mapped[Optional[float]] = mapped_column(Numeric(15, 2), nullable=True)
    status: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)