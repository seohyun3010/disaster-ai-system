from datetime import datetime
import re

from pydantic import BaseModel, ConfigDict, field_validator


class ReviewCreate(BaseModel):
    reviewer_id: int
    hitl_result: bool
    comment: str | None = None
    confirmed_damage_grade: str | None = None

    @field_validator("confirmed_damage_grade")
    @classmethod
    def normalize_damage_grade(cls, value: str | None) -> str | None:
        if value is None:
            return None
        match = re.search(r"DS[0-4]", value.strip(), re.IGNORECASE)
        if match is None:
            raise ValueError("피해등급은 DS0부터 DS4 중 하나여야 합니다.")
        return match.group(0).upper()


class ReviewResponse(BaseModel):
    review_id: int
    case_id: int
    reviewer_id: int
    hitl_result: bool | None = None
    comment: str | None = None
    confirmed_damage_grade: str | None = None
    reviewed_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
