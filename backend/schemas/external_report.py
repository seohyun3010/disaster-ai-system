from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, Field


class ExternalReportCreate(BaseModel):
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


class ExternalReportResponse(BaseModel):
    external_report_id: str
    case_id: int
    case_number: str
    status: str
