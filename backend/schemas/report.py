from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ReportUpsertRequest(BaseModel):
    file_url: str | None = None
    summary: str | None = None


class ReportResponse(BaseModel):
    report_id: int
    case_id: int
    file_url: str | None = None
    summary: str | None = None
    created_at: datetime | None = None

    model_config = ConfigDict(
        from_attributes=True
    )
