from datetime import datetime

from pydantic import BaseModel


class SeverityResponse(BaseModel):
    result_id: int
    case_id: int
    severity_score: float
    severity_level: str
    recovery_urgency_score: float
    recovery_priority: int
    urgency_level: str
    rule_version: str
    calculated_at: datetime
    calculation_method: str = "RECOVERY_URGENCY_RULE_ENGINE"
    component_scores: dict[str, float]
