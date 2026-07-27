from datetime import datetime

from sqlalchemy.orm import Session

from models.benefit_checks import BenefitCheck
from models.case import Case


def check_duplicate_benefit(
    db: Session,
    case_id: int,
) -> BenefitCheck | None:
    case = (
        db.query(Case)
        .filter(Case.case_id == case_id)
        .first()
    )

    if case is None:
        return None

    benefit_check = (
        db.query(BenefitCheck)
        .filter(BenefitCheck.case_id == case_id)
        .first()
    )

    if benefit_check is not None:
        return benefit_check

    # TODO: 실제 중복 수혜 판정 로직 구현
    is_duplicate_benefit = False
    previous_case_id = None

    benefit_check = BenefitCheck(
        case_id=case_id,
        previous_case_id=previous_case_id,
        is_duplicate_benefit=is_duplicate_benefit,
        checked_at=datetime.utcnow(),
    )

    db.add(benefit_check)
    db.commit()
    db.refresh(benefit_check)

    return benefit_check


def get_benefit_check(
    db: Session,
    case_id: int,
) -> BenefitCheck | None:
    return (
        db.query(BenefitCheck)
        .filter(BenefitCheck.case_id == case_id)
        .first()
    )