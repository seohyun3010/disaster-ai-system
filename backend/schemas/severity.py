from datetime import datetime

from pydantic import BaseModel, Field, model_validator


class SeverityManualUpdateRequest(BaseModel):
    ai_grade_score: float | None = Field(default=None, ge=0, le=100)
    household_score: float | None = Field(default=None, ge=0, le=100)
    facility_livelihood_score: float | None = Field(default=None, ge=0, le=100)
    recovery_urgency_score: float | None = Field(default=None, ge=0, le=100)
    reason: str | None = Field(default=None, max_length=2000)
    component_reasons: dict[str, str] = Field(default_factory=dict)

    @model_validator(mode="after")
    def require_a_score(self):
        if all(value is None for value in (
            self.ai_grade_score, self.household_score,
            self.facility_livelihood_score, self.recovery_urgency_score,
        )):
            raise ValueError("수정할 점수를 하나 이상 입력해야 합니다.")
        self.reason = self.reason.strip() if self.reason else None
        self.component_reasons = {
            key: value.strip() for key, value in self.component_reasons.items()
            if value and value.strip()
        }
        if not self.reason and not self.component_reasons:
            raise ValueError("수정 사유를 입력해야 합니다.")
        return self


class SeverityResponse(BaseModel):
    result_id: int
    case_id: int
    severity_score: float
    severity_level: str
    recovery_urgency_score: float
    recovery_priority: int
    urgency_level: str
    applied_damage_grade: str | None = None
    damage_grade_source: str | None = None
    rule_version: str
    calculated_at: datetime
    calculation_method: str = "RECOVERY_URGENCY_RULE_ENGINE"
    component_scores: dict[str, float]
    is_manual: bool = False
    manual_adjustment_reason: str | None = None
    manually_adjusted_at: datetime | None = None
    component_reasons: dict[str, str] = Field(default_factory=dict)
