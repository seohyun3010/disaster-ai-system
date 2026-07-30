from __future__ import annotations

import math
import re
from datetime import datetime
from difflib import SequenceMatcher

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session, selectinload

from models.case import Case
from models.duplicate_result import DuplicateResult


def _next_id(db: Session) -> int:
    return int(
        db.scalar(select(func.max(DuplicateResult.duplicate_id))) or 0
    ) + 1


def _normalize(value: str | None) -> str:
    return re.sub(r"[^0-9a-z가-힣]", "", (value or "").lower())


def _text_similarity(left: str | None, right: str | None) -> float:
    normalized_left = _normalize(left)
    normalized_right = _normalize(right)
    if not normalized_left or not normalized_right:
        return 0.0
    return SequenceMatcher(None, normalized_left, normalized_right).ratio()


def _distance_km(source: Case, target: Case) -> float | None:
    if (
        source.latitude is None
        or source.longitude is None
        or target.latitude is None
        or target.longitude is None
    ):
        return None
    source_latitude = math.radians(float(source.latitude))
    target_latitude = math.radians(float(target.latitude))
    latitude_delta = target_latitude - source_latitude
    longitude_delta = math.radians(
        float(target.longitude) - float(source.longitude)
    )
    haversine = (
        math.sin(latitude_delta / 2) ** 2
        + math.cos(source_latitude)
        * math.cos(target_latitude)
        * math.sin(longitude_delta / 2) ** 2
    )
    return 6371 * 2 * math.atan2(
        math.sqrt(haversine), math.sqrt(1 - haversine)
    )


def _time_similarity(source: Case, target: Case) -> tuple[float, float | None]:
    source_time = source.reported_at or source.received_at
    target_time = target.reported_at or target.received_at
    if source_time is None or target_time is None:
        return 0.0, None
    hours = abs((source_time - target_time).total_seconds()) / 3600
    if hours <= 6:
        return 1.0, hours
    if hours <= 24:
        return 0.7, hours
    if hours <= 72:
        return 0.4, hours
    return 0.0, hours


def _calculate_similarity(
    source: Case, target: Case
) -> tuple[float, dict[str, object]]:
    address_score = _text_similarity(source.address, target.address)
    distance = _distance_km(source, target)
    if distance is None:
        location_score = address_score
    elif distance <= 0.2:
        location_score = 1.0
    elif distance <= 1:
        location_score = 0.8
    elif distance <= 5:
        location_score = 0.4
    else:
        location_score = 0.0

    disaster_score = float(
        bool(source.disaster_type)
        and source.disaster_type == target.disaster_type
    )
    facility_score = float(
        bool(source.facility_type)
        and source.facility_type == target.facility_type
    )
    time_score, hours_apart = _time_similarity(source, target)
    content_score = _text_similarity(
        f"{source.title or ''} {source.description or ''}",
        f"{target.title or ''} {target.description or ''}",
    )
    score = (
        address_score * 0.30
        + location_score * 0.20
        + disaster_score * 0.15
        + facility_score * 0.10
        + time_score * 0.10
        + content_score * 0.15
    )
    reasons = {
        "address_similarity": round(address_score, 4),
        "location_similarity": round(location_score, 4),
        "distance_km": round(distance, 3) if distance is not None else None,
        "same_disaster_type": bool(disaster_score),
        "same_facility_type": bool(facility_score),
        "hours_apart": round(hours_apart, 2)
        if hours_apart is not None
        else None,
        "content_similarity": round(content_score, 4),
    }
    return round(score, 4), reasons


def _candidate_dict(result: DuplicateResult) -> dict[str, object]:
    target = result.target_case
    return {
        "duplicate_id": result.duplicate_id,
        "case_id": result.case_id,
        "target_case_id": result.target_case_id,
        "similarity_score": result.similarity_score,
        "match_reasons": result.match_reasons,
        "decision_status": result.decision_status,
        "is_duplicate": result.is_duplicate,
        "checked_at": result.checked_at,
        "reviewed_by_user_id": result.reviewed_by_user_id,
        "review_note": result.review_note,
        "decided_at": result.decided_at,
        "target_case": {
            "case_id": target.case_id,
            "case_number": target.case_number,
            "title": target.title,
            "address": target.address,
            "disaster_type": target.disaster_type,
            "facility_type": target.facility_type,
            "reported_at": target.reported_at,
        },
    }


def get_duplicate_candidates(
    db: Session, case_id: int
) -> list[dict[str, object]]:
    results = db.scalars(
        select(DuplicateResult)
        .options(selectinload(DuplicateResult.target_case))
        .where(DuplicateResult.case_id == case_id)
        .order_by(
            DuplicateResult.similarity_score.desc(),
            DuplicateResult.duplicate_id,
        )
    ).all()
    return [_candidate_dict(result) for result in results]


def check_case_duplicates(
    db: Session, case: Case, threshold: float = 0.60
) -> dict[str, object]:
    db.execute(
        delete(DuplicateResult).where(
            DuplicateResult.case_id == case.case_id,
            DuplicateResult.decision_status == "SUSPECTED",
        )
    )
    existing_targets = set(
        db.scalars(
            select(DuplicateResult.target_case_id).where(
                DuplicateResult.case_id == case.case_id
            )
        ).all()
    )
    targets = db.scalars(
        select(Case).where(
            Case.case_id != case.case_id,
            Case.duplicate_status != "DUPLICATE",
        )
    ).all()
    now = datetime.utcnow()
    next_id = _next_id(db)
    for target in targets:
        if target.case_id in existing_targets:
            continue
        score, reasons = _calculate_similarity(case, target)
        if score < threshold:
            continue
        db.add(
            DuplicateResult(
                duplicate_id=next_id,
                case_id=case.case_id,
                target_case_id=target.case_id,
                is_duplicate=None,
                similarity_score=score,
                match_reasons=reasons,
                decision_status="SUSPECTED",
                checked_at=now,
            )
        )
        next_id += 1

    db.flush()
    suspected_count = int(
        db.scalar(
            select(func.count(DuplicateResult.duplicate_id)).where(
                DuplicateResult.case_id == case.case_id,
                DuplicateResult.decision_status == "SUSPECTED",
            )
        )
        or 0
    )
    case.duplicate_status = "SUSPECTED" if suspected_count else "UNIQUE"
    case.duplicate_suspected = suspected_count > 0
    if not suspected_count:
        case.duplicate_of_case_id = None
    db.commit()
    candidates = get_duplicate_candidates(db, case.case_id)
    return {
        "case_id": case.case_id,
        "duplicate_status": case.duplicate_status,
        "candidate_count": len(candidates),
        "candidates": candidates,
    }


def decide_duplicate_candidate(
    db: Session,
    *,
    case: Case,
    duplicate_id: int,
    decision: str,
    reviewer_user_id: int,
    note: str | None,
) -> dict[str, object] | None:
    result = db.scalar(
        select(DuplicateResult).where(
            DuplicateResult.duplicate_id == duplicate_id,
            DuplicateResult.case_id == case.case_id,
        )
    )
    if result is None:
        return None

    now = datetime.utcnow()
    result.decision_status = decision
    result.is_duplicate = decision == "DUPLICATE"
    result.reviewed_by_user_id = reviewer_user_id
    result.review_note = note
    result.decided_at = now

    if decision == "DUPLICATE":
        case.duplicate_status = "DUPLICATE"
        case.duplicate_suspected = True
        case.duplicate_of_case_id = result.target_case_id
    else:
        has_suspected = bool(
            db.scalar(
                select(DuplicateResult.duplicate_id)
                .where(
                    DuplicateResult.case_id == case.case_id,
                    DuplicateResult.duplicate_id != duplicate_id,
                    DuplicateResult.decision_status == "SUSPECTED",
                )
                .limit(1)
            )
        )
        case.duplicate_status = "SUSPECTED" if has_suspected else "UNIQUE"
        case.duplicate_suspected = has_suspected
        case.duplicate_of_case_id = None

    db.commit()
    return {
        "case_id": case.case_id,
        "duplicate_id": result.duplicate_id,
        "duplicate_status": case.duplicate_status,
        "duplicate_of_case_id": case.duplicate_of_case_id,
        "decision": decision,
    }
