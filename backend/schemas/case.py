from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class CaseResponse(BaseModel):
    case_id: int
    case_number: str | None
    external_report_id: str | None
    status: str | None
    duplicate_suspected: bool
    priority: str
    title: str | None
    description: str | None
    address: str | None
    latitude: Decimal | None
    longitude: Decimal | None
    created_at: datetime | None
    updated_at: datetime | None
    completed_at: datetime | None
    assigned_user_id: int | None

    model_config = ConfigDict(from_attributes=True)


class CaseListResponse(BaseModel):
    items: list[CaseResponse]
    total: int
    limit: int
    offset: int
