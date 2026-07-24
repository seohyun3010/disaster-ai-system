"""subsidies — 지원금(복구비) 산정."""
 
from decimal import Decimal
from typing import TYPE_CHECKING, Optional
 
from sqlalchemy import BigInteger, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
 
from database.database import Base

if TYPE_CHECKING:
    from models.case import Case
 
 
class Subsidy(Base):
    __tablename__ = "subsidies"
 
    subsidy_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    case_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("cases.case_id"), nullable=False
    )
 
    estimated_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2), nullable=True)
    confirmed_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2), nullable=True)
    status: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    case: Mapped["Case"] = relationship(back_populates="subsidies")
