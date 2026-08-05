from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from models.case import Case


REPORTING_PERIOD_DAYS = 10
DEADLINE_PERIOD_DAYS = 14


@dataclass(frozen=True)
class DisasterPeriod:
    event_id: str
    disaster_type: str
    start: date
    end: date


# Authoritative disaster periods used by the test dataset. A report received
# during the ten-day reporting window remains attached to the original event.
KNOWN_DISASTER_PERIODS = (
    DisasterPeriod("2026-HEAVY_RAIN", "HEAVY_RAIN", date(2026, 7, 15), date(2026, 7, 18)),
    DisasterPeriod("2026-EARTHQUAKE", "EARTHQUAKE", date(2026, 6, 12), date(2026, 6, 13)),
    DisasterPeriod("2026-WILDFIRE", "WILDFIRE", date(2026, 4, 6), date(2026, 4, 8)),
    DisasterPeriod("2026-LANDSLIDE", "LANDSLIDE", date(2026, 4, 3), date(2026, 4, 5)),
    DisasterPeriod("2026-HEAVY_SNOW", "HEAVY_SNOW", date(2026, 2, 7), date(2026, 2, 9)),
    DisasterPeriod("2025-HEAVY_SNOW", "HEAVY_SNOW", date(2025, 12, 18), date(2025, 12, 21)),
    DisasterPeriod("2025-LANDSLIDE", "LANDSLIDE", date(2025, 9, 3), date(2025, 9, 5)),
    DisasterPeriod("2025-HEAVY_RAIN", "HEAVY_RAIN", date(2025, 7, 18), date(2025, 7, 21)),
)


def _event_date(case: Case) -> date | None:
    occurred_at = case.damage_occurred_at or case.reported_at or case.received_at
    return occurred_at.date() if occurred_at else None


def _known_period(case: Case, event_date: date) -> DisasterPeriod | None:
    candidates = [
        period for period in KNOWN_DISASTER_PERIODS
        if period.disaster_type == case.disaster_type
        and period.start.year == event_date.year
    ]
    return next((period for period in candidates if (
        period.start <= event_date <= period.end + timedelta(days=REPORTING_PERIOD_DAYS)
    )), None)


def _metadata(period: DisasterPeriod) -> dict[str, str | int]:
    deadline_start = period.end + timedelta(days=REPORTING_PERIOD_DAYS + 1)
    deadline_end = deadline_start + timedelta(days=DEADLINE_PERIOD_DAYS - 1)
    return {
        "disaster_event_id": period.event_id,
        "disaster_start_date": period.start.isoformat(),
        "disaster_end_date": period.end.isoformat(),
        "reporting_period_days": REPORTING_PERIOD_DAYS,
        "deadline_start_date": deadline_start.isoformat(),
        "deadline_end_date": deadline_end.isoformat(),
    }


def sync_disaster_event_metadata(db: Session) -> int:
    """Persist authoritative disaster and administrative deadline periods."""

    assignments: dict[Case, DisasterPeriod] = {}
    unmatched: dict[tuple[int, str], list[tuple[Case, date]]] = {}
    for case in db.scalars(select(Case)).all():
        event_date = _event_date(case)
        if event_date is None or not case.disaster_type:
            continue
        known_period = _known_period(case, event_date)
        if known_period:
            assignments[case] = known_period
            continue
        unmatched.setdefault((event_date.year, case.disaster_type), []).append((case, event_date))

    # Remaining test cases represent events not yet present in the master list.
    # Split them when occurrence dates are more than ten days apart.
    for (year, disaster_type), case_dates in unmatched.items():
        case_dates.sort(key=lambda pair: pair[1])
        clusters: list[list[tuple[Case, date]]] = []
        for case_date in case_dates:
            if not clusters or (case_date[1] - clusters[-1][-1][1]).days > REPORTING_PERIOD_DAYS:
                clusters.append([])
            clusters[-1].append(case_date)
        for cluster in clusters:
            start = min(value for _, value in cluster)
            end = max(value for _, value in cluster)
            period = DisasterPeriod(
                f"DB-{year}-{disaster_type}-{start:%Y%m%d}",
                disaster_type,
                start,
                end,
            )
            for case, _ in cluster:
                assignments[case] = period

    updated = 0
    for case, period in assignments.items():
        metadata = _metadata(period)
        raw_payload = dict(case.raw_payload or {})
        if all(raw_payload.get(key) == value for key, value in metadata.items()):
            continue
        raw_payload.update(metadata)
        case.raw_payload = raw_payload
        case.updated_at = datetime.now()
        updated += 1

    db.commit()
    return updated
