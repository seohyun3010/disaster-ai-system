from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class SubsidyResponse(BaseModel):
    subsidy_id: int
    case_id: int
    estimated_amount: Decimal | None = None
    confirmed_amount: Decimal | None = None
    status: str | None = None

    model_config = ConfigDict(
        from_attributes=True
    )