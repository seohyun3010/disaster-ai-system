from datetime import datetime
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models.case import Case
from models.user import User
from schemas.external_report import ExternalReportCreate


SYSTEM_USER_EMAIL = "external-system@disaster.local"


class DuplicateExternalReportError(Exception):
    """이미 접수된 외부 신고번호일 때 발생하는 예외"""

    def __init__(self, existing_case: Case):
        self.existing_case = existing_case
        super().__init__(
            f"이미 접수된 외부 신고입니다: "
            f"{existing_case.external_report_id}"
        )


def get_or_create_system_user(db: Session) -> User:
    """외부 신고 데이터와 연결할 시스템 사용자를 조회하거나 생성한다."""

    system_user = db.scalar(
        select(User).where(User.email == SYSTEM_USER_EMAIL)
    )

    if system_user is not None:
        return system_user

    now = datetime.now()

    system_user = User(
        name="외부 신고 시스템",
        email=SYSTEM_USER_EMAIL,
        password=None,
        role="SYSTEM",
        department="외부 시스템 연계",
        created_at=now,
        updated_at=now,
    )

    db.add(system_user)
    db.flush()

    return system_user


def create_external_report(
    db: Session,
    report: ExternalReportCreate,
) -> Case:
    """외부 시스템에서 수신한 신고를 cases 테이블에 저장한다."""

    existing_case = db.scalar(
        select(Case).where(
            Case.external_report_id == report.external_report_id
        )
    )

    if existing_case is not None:
        raise DuplicateExternalReportError(existing_case)

    try:
        system_user = get_or_create_system_user(db)
        now = datetime.now()

        case_number = (
            f"EXT-{now:%Y%m%d%H%M%S}-"
            f"{uuid4().hex[:6].upper()}"
        )

        new_case = Case(
            external_report_id=report.external_report_id,
            case_number=case_number,
            user_id=system_user.user_id,
            title=report.title,
            description=report.description,
            latitude=report.latitude,
            longitude=report.longitude,
            address=report.address,
            status="RECEIVED",
            created_at=now,
            updated_at=now,
        )

        db.add(new_case)
        db.commit()
        db.refresh(new_case)

        return new_case

    except IntegrityError as error:
        db.rollback()

        existing_case = db.scalar(
            select(Case).where(
                Case.external_report_id == report.external_report_id
            )
        )

        if existing_case is not None:
            raise DuplicateExternalReportError(
                existing_case
            ) from error

        raise

    except Exception:
        db.rollback()
        raise