from datetime import datetime
from decimal import Decimal
from typing import Any, Literal

from pydantic import BaseModel, Field


class DuplicateTargetSummary(BaseModel):
    case_id: int
    case_number: str | None
    title: str | None
    address: str | None
    disaster_type: str | None
    facility_type: str | None
    reported_at: datetime | None


class DuplicateCandidateResponse(BaseModel):
    duplicate_id: int
    case_id: int
    target_case_id: int
    similarity_score: Decimal | None
    match_reasons: dict[str, Any] | None
    decision_status: str
    is_duplicate: bool | None
    checked_at: datetime | None
    reviewed_by_user_id: int | None
    review_note: str | None
    decided_at: datetime | None
    target_case: DuplicateTargetSummary


class DuplicateCheckResponse(BaseModel):
    case_id: int
    duplicate_status: str
    candidate_count: int
    candidates: list[DuplicateCandidateResponse]


class DuplicateDecisionRequest(BaseModel):
    duplicate_id: int
    decision: Literal["DUPLICATE", "UNIQUE"]
    note: str | None = Field(default=None, max_length=1000)


class DuplicateDecisionResponse(BaseModel):
    case_id: int
    duplicate_id: int
    duplicate_status: str
    duplicate_of_case_id: int | None
    decision: str
