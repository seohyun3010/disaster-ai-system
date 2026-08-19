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
    received_at: datetime | None = None
    damage_occurred_at: datetime | None = None
    contact_number: str | None = None
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    description: str | None = None


class ReportAnalysisResponse(BaseModel):
    damage_grade: str | None = None
    damage_grade_source: str | None = None
    confidence: float | None = None
    explanation: str | None = None
    inspection_required: bool | None = None

    # ▼▼▼ 신규 추가: 보고서 2번 섹션(AI 예비판정 결과)의 "분석 소요시간"·
    # "판독 시각" 행을 실제 AIResult 값과 연계하기 위한 필드.
    analysis_time: float | None = None
    analyzed_at: datetime | None = None
    # ▲▲▲ 신규 추가 끝


class ReportImageResponse(BaseModel):
    image_id: int
    image_url: str | None = None
    thumbnail_url: str | None = None
    taken_at: datetime | None = None


class ReportSeverityResponse(BaseModel):
    urgency_score: float = 0
    urgency_level: str | None = None
    recovery_priority: int | None = None

    # ▼▼▼ 신규 추가: 복구 긴급도 산정 근거표(보고서 PDF 3번 섹션)를 위한
    # SeverityResult 세부 점수. recovery_urgency_rules.py의 실제 산정 로직과
    # 1:1로 대응됨 (damage_score=AI등급점수, vulnerability_score=가구원수점수,
    # infrastructure_score=시설·이재민긴급도점수). human_risk_score/
    # secondary_damage_score는 현재 severity_service.py에서 항상 0으로 저장되는
    # 미구현 자리라 PDF에는 아직 표시하지 않음.
    damage_score: float | None = None
    human_risk_score: float | None = None
    vulnerability_score: float | None = None
    infrastructure_score: float | None = None
    secondary_damage_score: float | None = None
    applied_damage_grade: str | None = None
    rule_version: str | None = None
    is_manual: bool = False
    adjustment_reason: str | None = None
    adjusted_at: datetime | None = None
    # ▲▲▲ 신규 추가 끝


class ReportSubsidyResponse(BaseModel):
    estimated_amount: Decimal | None = None
    confirmed_amount: Decimal | None = None
    status: str | None = None
    damage_grade: str | None = None
    calculation_basis: str | None = None
    adjustment_reason: str | None = None
    adjusted_at: datetime | None = None


class ReportVerificationResponse(BaseModel):
    duplicate_report_result: str = "검사 이력 없음"
    duplicate_benefit_result: str = "검사 이력 없음"
    reviewer_comment: str | None = None


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
    verification: ReportVerificationResponse = Field(
        default_factory=ReportVerificationResponse
    )
    images: list[ReportImageResponse] = Field(default_factory=list)
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
