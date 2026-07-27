from datetime import datetime

from pydantic import BaseModel, ConfigDict


class BenefitCheckBase(BaseModel):
    case_id: int
    previous_case_id: int | None = None
    is_duplicate_benefit: bool | None = None


class BenefitCheckCreate(BenefitCheckBase):
    pass


class BenefitCheckResponse(BenefitCheckBase):
    check_id: int
    checked_at: datetime | None

    model_config = ConfigDict(from_attributes=True)