from decimal import Decimal
from pydantic import BaseModel, ConfigDict
class SubsidyUpsertRequest(BaseModel):
    estimated_amount: Decimal | None = None
    confirmed_amount: Decimal | None = None
    status: str = "PENDING"
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
    model_config = ConfigDict(
        from_attributes=True
    )