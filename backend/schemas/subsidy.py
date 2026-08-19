from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field
class SubsidyUpsertRequest(BaseModel):
    estimated_amount: Decimal | None = None
    confirmed_amount: Decimal | None = None
    status: str = "PENDING"
    adjustment_reason: str | None = Field(default=None, max_length=2000)
class SubsidyResponse(BaseModel):
    subsidy_id: int
    case_id: int
    estimated_amount: Decimal | None = None
    confirmed_amount: Decimal | None = None
    status: str | None = None
    damage_grade: str | None = None
    calculation_basis: str | None = None
    calculation_standard: str | None = None
    unit_price: Decimal | None = None
    damage_ratio_percent: float | None = None
    adjustment_reason: str | None = None
    adjusted_at: datetime | None = None
    model_config = ConfigDict(
        from_attributes=True
    )
