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
    reporter_name: str | None = Field(default=None, max_length=100)
    resident_registration_number: str | None = Field(default=None, max_length=20)
    contact_number: str | None = Field(default=None, max_length=30)
    household_members: int | None = Field(default=None, ge=1)
    bank_name: str | None = Field(default=None, max_length=100)
    account_number: str | None = Field(default=None, max_length=100)
    account_holder: str | None = Field(default=None, max_length=100)
    damage_occurred_at: datetime | None = None
    damage_details: list[dict[str, Any]] | None = None
    sido: str | None = Field(default=None, max_length=100)
    sigungu: str | None = Field(default=None, max_length=100)
    latitude: Decimal | None = Field(default=None, ge=-90, le=90)
    longitude: Decimal | None = Field(default=None, ge=-180, le=180)
    reported_at: datetime | None = None
    raw_payload: dict[str, Any] | None = None


class CaseImageResponse(BaseModel):
    image_id: int
    image_url: str | None
    thumbnail_url: str | None
    taken_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class CaseResponse(BaseModel):
    case_id: int
    case_number: str | None
    external_report_id: str | None
    status: str | None
    duplicate_suspected: bool
    duplicate_status: str
    duplicate_of_case_id: int | None
    priority: str
    title: str | None
    description: str | None
    disaster_type: str | None
    facility_type: str | None
    address: str | None
    reporter_name: str | None
    resident_registration_number: str | None
    contact_number: str | None
    household_members: int | None
    bank_name: str | None
    account_number: str | None
    account_holder: str | None
    damage_occurred_at: datetime | None
    damage_details: list[dict[str, Any]] | None
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
    representative_image_url: str | None = None

    model_config = ConfigDict(from_attributes=True)


class CaseDetailResponse(CaseResponse):
    images: list[CaseImageResponse] = Field(
        default_factory=list,
        validation_alias="case_images",
    )


class CaseListResponse(BaseModel):
    items: list[CaseResponse]
    total: int
    limit: int
    offset: int
