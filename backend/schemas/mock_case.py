from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class MockCaseCreate(BaseModel):
    """개발 중 severity 연동 테스트에 사용하는 가상 사건 입력값."""

    title: str = Field(default="집중호우로 인한 주택 전파 및 도로 단절")
    description: str = Field(
        default="주택이 전파되었고 주민 인명 위험, 취약계층 고립 및 2차 붕괴 가능성이 있습니다."
    )
    address: str = Field(default="서울특별시 동작구 가상재난로 12")
    latitude: Decimal | None = Field(default=Decimal("37.5123456"))
    longitude: Decimal | None = Field(default=Decimal("126.9345678"))
    status: str = Field(default="DAMAGE_CONFIRMED")


class MockCaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    case_id: int
    case_number: str
    user_id: int
    title: str | None
    description: str | None
    address: str | None
    latitude: Decimal | None
    longitude: Decimal | None
    status: str | None
    created_at: datetime | None


class MockCaseListResponse(BaseModel):
    items: list[MockCaseResponse]
    severity_test_endpoint: str = "/cases/{case_id}/severity/calculate"
    guide: str = (
        "items의 case_id를 severity_test_endpoint의 {case_id} 자리에 입력하세요."
    )
