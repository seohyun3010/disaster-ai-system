from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AIResultResponse(BaseModel):
    result_id: int
    case_id: int
    image_id: int
    damage_grade: str | None = None
    confidence: float | None = None
    inspection_required: bool | None = None
    ai_explanation: str | None = None
    analysis_time: float | None = None
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)