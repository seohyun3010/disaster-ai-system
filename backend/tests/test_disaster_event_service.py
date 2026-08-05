from datetime import date, datetime
from types import SimpleNamespace
import unittest

from services.disaster_event_service import (
    DEADLINE_PERIOD_DAYS,
    REPORTING_PERIOD_DAYS,
    _known_period,
    _event_date,
)


class DisasterEventMetadataTests(unittest.TestCase):
    def test_damage_occurrence_date_has_priority(self):
        case = SimpleNamespace(
            damage_occurred_at=datetime(2026, 4, 8, 23, 30),
            reported_at=datetime(2026, 4, 10, 9, 0),
            received_at=datetime(2026, 4, 11, 9, 0),
        )
        self.assertEqual(_event_date(case), date(2026, 4, 8))

    def test_policy_period_constants(self):
        self.assertEqual(REPORTING_PERIOD_DAYS, 10)
        self.assertEqual(DEADLINE_PERIOD_DAYS, 14)

    def test_report_in_ten_day_window_uses_authoritative_disaster_period(self):
        case = SimpleNamespace(disaster_type="HEAVY_RAIN")
        period = _known_period(case, date(2026, 7, 28))
        self.assertIsNotNone(period)
        self.assertEqual(period.start, date(2026, 7, 15))
        self.assertEqual(period.end, date(2026, 7, 18))

    def test_later_earthquake_is_not_merged_into_june_event(self):
        case = SimpleNamespace(disaster_type="EARTHQUAKE")
        self.assertIsNone(_known_period(case, date(2026, 8, 3)))


if __name__ == "__main__":
    unittest.main()
