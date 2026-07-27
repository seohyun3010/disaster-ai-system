from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AIJobResponse(BaseModel):
    job_id: int
    case_id: int
    status: str | None = None
    started_at: datetime | None = None
    finished_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)