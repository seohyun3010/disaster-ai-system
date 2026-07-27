from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ReviewCreate(BaseModel):
    reviewer_id: int
    hitl_result: bool          # true = 승인, false = 반려
    comment: str | None = None  # 반려 시 필수 (Service에서 검증)


class ReviewResponse(BaseModel):
    review_id: int
    case_id: int
    reviewer_id: int
    hitl_result: bool | None = None
    comment: str | None = None
    reviewed_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)