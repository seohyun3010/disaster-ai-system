from __future__ import annotations

from dataclasses import dataclass


URGENCY_RULE_VERSION = "recovery-urgency-rule-1.0"

AI_GRADE_SCORES = {
    "DS4": 50.0,
    "DS3": 25.0,
    "DS2": 13.0,
    "DS1": 0.0,
    "DS0": 0.0,
}

FACILITY_LIVELIHOOD_SCORES = {
    "STORE": 10.0,
    "FARMLAND": 8.0,
    "BUILDING": 10.0,
    "ROAD": 0.0,
    "RETAINING_WALL": 0.0,
}

HOUSING_LIVELIHOOD_SCORES = {
    "DS4": 30.0,
    "DS3": 20.0,
    "DS2": 15.0,
    "DS1": 15.0,
    "DS0": 0.0,
}

HOUSEHOLD_ELIGIBLE_FACILITY_TYPES = {"HOUSE"}


@dataclass(frozen=True)
class UrgencyComponents:
    ai_grade_score: float
    household_score: float
    facility_livelihood_score: float
    damage_grade: str
    facility_type: str


@dataclass(frozen=True)
class CalculatedScores:
    severity_score: float
    severity_level: str
    recovery_urgency_score: float
    recovery_priority: int
    urgency_level: str


def _level(score: float) -> str:
    if score >= 80:
        return "CRITICAL"
    if score >= 60:
        return "HIGH"
    if score >= 40:
        return "MEDIUM"
    return "LOW"


def household_score(members: int | None) -> float:
    """Return 4 points per member, capped at 20 points for 5+ members."""
    if members is None:
        return 0.0
    return float(min(max(members, 0), 5) * 4)


def facility_livelihood_score(facility_type: str, damage_grade: str) -> float:
    """Score housing/livelihood urgency, capped at 30 points."""
    if facility_type == "HOUSE":
        return HOUSING_LIVELIHOOD_SCORES[damage_grade]
    return FACILITY_LIVELIHOOD_SCORES.get(facility_type, 0.0)


def calculate_scores(data: UrgencyComponents) -> CalculatedScores:
    """Calculate deterministic recovery urgency on a 0-100 scale."""
    recovery = round(
        min(
            data.ai_grade_score
            + data.household_score
            + data.facility_livelihood_score,
            100.0,
        ),
        2,
    )
    urgency = _level(recovery)
    priority = {"CRITICAL": 1, "HIGH": 2, "MEDIUM": 3, "LOW": 4}[urgency]
    return CalculatedScores(
        severity_score=recovery,
        severity_level=urgency,
        recovery_urgency_score=recovery,
        recovery_priority=priority,
        urgency_level=urgency,
    )
