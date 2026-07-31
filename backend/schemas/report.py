from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


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


class ReportGenerateRequest(BaseModel):
    """보고서 생성 시 사용자가 덧붙일 수 있는 최종 처리 요약."""

    summary: str | None = None


class ReportCreatorResponse(BaseModel):
    user_id: int | None = None
    name: str = "담당자 미지정"
    department: str | None = None


class ReportCaseResponse(BaseModel):
    case_id: int
    case_number: str
    reporter_name: str | None = None
    disaster_type: str | None = None
    facility_type: str | None = None
    address: str | None = None
    reported_at: datetime | None = None
    description: str | None = None


class ReportAnalysisResponse(BaseModel):
    damage_grade: str | None = None
    confidence: float | None = None
    explanation: str | None = None


class ReportSeverityResponse(BaseModel):
    urgency_score: float = 0
    urgency_level: str | None = None
    recovery_priority: int | None = None


class ReportSubsidyResponse(BaseModel):
    estimated_amount: Decimal | None = None
    confirmed_amount: Decimal | None = None
    status: str | None = None


class ReportTimelineResponse(BaseModel):
    occurred_at: datetime | None = None
    title: str
    description: str
    actor: str | None = None


class ReportDetailResponse(BaseModel):
    """최종 보고서 화면이 한 번의 요청으로 사용하는 통합 응답."""

    report_id: int
    report_number: str
    status: str
    created_at: datetime | None = None
    approved_at: datetime | None = None
    creator: ReportCreatorResponse
    case: ReportCaseResponse
    analysis: ReportAnalysisResponse
    severity: ReportSeverityResponse
    subsidy: ReportSubsidyResponse
    approval_result: str
    summary: str | None = None
    download_url: str
    timeline: list[ReportTimelineResponse] = Field(default_factory=list)


class ReportListItemResponse(BaseModel):
    report_id: int
    report_number: str
    case_id: int
    case_number: str
    reporter_name: str | None = None
    disaster_type: str | None = None
    address: str | None = None
    status: str
    created_at: datetime | None = None
    creator_name: str
    download_url: str


class ReportListResponse(BaseModel):
    items: list[ReportListItemResponse]
    total: int
    limit: int
    offset: int
