import unittest

from services.recovery_urgency_rules import (
    UrgencyComponents,
    calculate_scores,
    facility_livelihood_score,
    household_score,
)


class RecoveryUrgencyRuleTests(unittest.TestCase):
    def test_household_score_is_four_points_per_member_capped_at_five(self):
        self.assertEqual(household_score(1), 4)
        self.assertEqual(household_score(4), 16)
        self.assertEqual(household_score(5), 20)
        self.assertEqual(household_score(8), 20)
        self.assertEqual(household_score(None), 0)

    def test_housing_livelihood_score_uses_damage_grade(self):
        self.assertEqual(facility_livelihood_score("HOUSE", "DS4"), 30)
        self.assertEqual(facility_livelihood_score("HOUSE", "DS3"), 20)
        self.assertEqual(facility_livelihood_score("HOUSE", "DS2"), 15)
        self.assertEqual(facility_livelihood_score("HOUSE", "DS1"), 15)
        self.assertEqual(facility_livelihood_score("HOUSE", "DS0"), 0)

    def test_five_person_household_with_destroyed_house_scores_100(self):
        scores = calculate_scores(
            UrgencyComponents(
                ai_grade_score=50,
                household_score=20,
                facility_livelihood_score=30,
                damage_grade="DS4",
                facility_type="HOUSE",
            )
        )
        self.assertEqual(scores.recovery_urgency_score, 100)
        self.assertEqual(scores.urgency_level, "CRITICAL")
        self.assertEqual(scores.recovery_priority, 1)

    def test_four_person_household_with_half_destroyed_house_scores_61(self):
        scores = calculate_scores(
            UrgencyComponents(
                ai_grade_score=25,
                household_score=16,
                facility_livelihood_score=20,
                damage_grade="DS3",
                facility_type="HOUSE",
            )
        )
        self.assertEqual(scores.recovery_urgency_score, 61)
        self.assertEqual(scores.urgency_level, "HIGH")

    def test_ds2_four_person_household_scores_44(self):
        scores = calculate_scores(
            UrgencyComponents(
                ai_grade_score=13,
                household_score=16,
                facility_livelihood_score=15,
                damage_grade="DS2",
                facility_type="HOUSE",
            )
        )
        self.assertEqual(scores.recovery_urgency_score, 44)
        self.assertEqual(scores.urgency_level, "MEDIUM")
        self.assertEqual(scores.recovery_priority, 3)


if __name__ == "__main__":
    unittest.main()
