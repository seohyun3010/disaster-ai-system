from datetime import datetime
from decimal import Decimal

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class CaseCreate(BaseModel):
    external_report_id: str = Field(..., min_length=1, max_length=255)
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    disaster_type: str | None = Field(default=None, max_length=100)
    facility_type: str | None = Field(default=None, max_length=100)
    address: str | None = Field(default=None, max_length=255)
    sido: str | None = Field(default=None, max_length=100)
    sigungu: str | None = Field(default=None, max_length=100)
    latitude: Decimal | None = Field(default=None, ge=-90, le=90)
    longitude: Decimal | None = Field(default=None, ge=-180, le=180)
    reported_at: datetime | None = None
    raw_payload: dict[str, Any] | None = None


class CaseResponse(BaseModel):
    case_id: int
    case_number: str | None
    external_report_id: str | None
    status: str | None
    duplicate_suspected: bool
    priority: str
    title: str | None
    description: str | None
    disaster_type: str | None
    facility_type: str | None
    address: str | None
    sido: str | None
    sigungu: str | None
    latitude: Decimal | None
    longitude: Decimal | None
    reported_at: datetime | None
    received_at: datetime | None
    raw_payload: dict[str, Any] | None
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
