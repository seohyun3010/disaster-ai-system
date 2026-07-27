from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PolicyReferenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    document_id: int
    document_code: str
    document_name: str
    article: str
    content: str
    version: str
    matched_content: str
    relevance_score: float


class SeverityResponse(BaseModel):
    result_id: int
    case_id: int
    severity_score: float
    severity_level: str
    recovery_urgency_score: float
    recovery_priority: int
    urgency_level: str
    policy_version: str
    calculated_at: datetime
    calculation_method: str = "CASE_DATA_RAG_RULE_ENGINE"
    component_scores: dict[str, float]
    document_references: list[PolicyReferenceResponse]
