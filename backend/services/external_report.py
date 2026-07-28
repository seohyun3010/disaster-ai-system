from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models.case import Case
from models.external_report import ExternalReport
from models.user import User
from schemas.external_report import ExternalReportCreate

SYSTEM_USER_EMAIL = "external-system@disaster.local"


class DuplicateExternalReportError(Exception):
    def __init__(self, existing_case: Case):
        self.existing_case = existing_case
        super().__init__(
            f"External report already exists: {existing_case.external_report_id}"
        )


def _next_id(db: Session, column) -> int:
    return int(db.scalar(select(func.max(column))) or 0) + 1


def get_or_create_system_user(db: Session) -> User:
    system_user = db.scalar(select(User).where(User.email == SYSTEM_USER_EMAIL))
    if system_user is not None:
        return system_user
    now = datetime.utcnow()
    system_user = User(
        user_id=_next_id(db, User.user_id),
        name="External report system",
        email=SYSTEM_USER_EMAIL,
        password=None,
        role="SYSTEM",
        department="External integration",
        created_at=now,
        updated_at=now,
    )
    db.add(system_user)
    db.flush()
    return system_user


def _next_case_number(db: Session, year: int) -> str:
    prefix = f"DS-{year}-"
    latest = db.scalar(
        select(Case.case_number)
        .where(Case.case_number.like(f"{prefix}%"))
        .order_by(Case.case_number.desc())
        .limit(1)
    )
    sequence = int(latest.rsplit("-", 1)[1]) + 1 if latest else 1
    return f"{prefix}{sequence:06d}"


def create_external_report(db: Session, report: ExternalReportCreate) -> Case:
    existing_case = db.scalar(
        select(Case).where(Case.external_report_id == report.external_report_id)
    )
    if existing_case is not None:
        raise DuplicateExternalReportError(existing_case)

    now = datetime.utcnow()
    try:
        system_user = get_or_create_system_user(db)
        external_report = ExternalReport(
            id=_next_id(db, ExternalReport.id),
            external_report_id=report.external_report_id,
            title=report.title,
            description=report.description,
            disaster_type=report.disaster_type,
            facility_type=report.facility_type,
            address=report.address,
            sido=report.sido,
            sigungu=report.sigungu,
            latitude=report.latitude,
            longitude=report.longitude,
            reported_at=report.reported_at,
            received_at=now,
            raw_payload=report.raw_payload or report.model_dump(mode="json"),
            processing_status="PROCESSED",
        )
        new_case = Case(
            case_id=_next_id(db, Case.case_id),
            external_report_id=report.external_report_id,
            case_number=_next_case_number(db, now.year),
            user_id=system_user.user_id,
            title=report.title,
            description=report.description,
            latitude=report.latitude,
            longitude=report.longitude,
            address=report.address,
            status="RECEIVED",
            duplicate_suspected=False,
            priority="NORMAL",
            created_at=now,
            updated_at=now,
        )
        db.add_all([external_report, new_case])
        db.commit()
        db.refresh(new_case)
        return new_case
    except IntegrityError as error:
        db.rollback()
        existing_case = db.scalar(
            select(Case).where(Case.external_report_id == report.external_report_id)
        )
        if existing_case is not None:
            raise DuplicateExternalReportError(existing_case) from error
        raise
    except Exception:
        db.rollback()
        raise
