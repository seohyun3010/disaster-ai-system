from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class ExternalReportCreate(BaseModel):
    """외부 신고 시스템에서 전달받는 신고 데이터"""

    external_report_id: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="외부 시스템에서 발급한 신고 고유번호",
    )

    title: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="피해 신고 제목",
    )

    description: str | None = Field(
        default=None,
        description="피해 내용",
    )

    latitude: Decimal | None = Field(
        default=None,
        ge=-90,
        le=90,
        description="피해 발생 위치의 위도",
    )

    longitude: Decimal | None = Field(
        default=None,
        ge=-180,
        le=180,
        description="피해 발생 위치의 경도",
    )

    address: str | None = Field(
        default=None,
        max_length=255,
        description="피해 발생 주소",
    )


class ExternalReportResponse(BaseModel):
    """외부 신고 접수 결과"""

    message: str
    external_report_id: str
    case_id: int
    case_number: str
    status: str
    created_at: datetime