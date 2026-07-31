from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from models.case import Case
from models.user import User
from schemas.case import CaseCreate

SYSTEM_USER_EMAIL = "mock-safety24@disaster.local"


class DuplicateCaseReportError(Exception):
    def __init__(self, existing_case: Case):
        self.existing_case = existing_case
        super().__init__(
            f"Report already registered: {existing_case.external_report_id}"
        )


def _next_id(db: Session, column) -> int:
    return int(db.scalar(select(func.max(column))) or 0) + 1


def _get_or_create_system_user(db: Session) -> User:
    user = db.scalar(select(User).where(User.email == SYSTEM_USER_EMAIL))
    if user is not None:
        return user
    now = datetime.utcnow()
    user = User(
        user_id=_next_id(db, User.user_id),
        name="국민안전24 Mock 연계",
        email=SYSTEM_USER_EMAIL,
        password=None,
        role="SYSTEM",
        department="Mock 신고 연계",
        created_at=now,
        updated_at=now,
    )
    db.add(user)
    db.flush()
    return user


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


def create_case(db: Session, data: CaseCreate) -> Case:
    existing = db.scalar(
        select(Case).where(Case.external_report_id == data.external_report_id)
    )
    if existing is not None:
        raise DuplicateCaseReportError(existing)

    now = datetime.utcnow()
    try:
        user = _get_or_create_system_user(db)
        case = Case(
            case_id=_next_id(db, Case.case_id),
            case_number=_next_case_number(db, now.year),
            external_report_id=data.external_report_id,
            user_id=user.user_id,
            title=data.title,
            description=data.description,
            disaster_type=data.disaster_type,
            facility_type=data.facility_type,
            address=data.address,
            reporter_name=data.reporter_name,
            resident_registration_number=data.resident_registration_number,
            contact_number=data.contact_number,
            household_members=data.household_members,
            bank_name=data.bank_name,
            account_number=data.account_number,
            account_holder=data.account_holder,
            damage_occurred_at=data.damage_occurred_at,
            damage_details=data.damage_details,
            sido=data.sido,
            sigungu=data.sigungu,
            latitude=data.latitude,
            longitude=data.longitude,
            reported_at=data.reported_at,
            received_at=now,
            raw_payload=data.raw_payload or data.model_dump(mode="json"),
            status="RECEIVED",
            duplicate_suspected=False,
            duplicate_status="NOT_CHECKED",
            priority="NORMAL",
            created_at=now,
            updated_at=now,
        )
        db.add(case)
        db.commit()
        db.refresh(case)
        # 신고 접수 직후 중복 후보를 자동 검사합니다. 담당자는 이후
        # duplicate-decision API에서 중복 여부를 최종 확정합니다.
        from services.duplicate_service import check_case_duplicates

        check_case_duplicates(db, case)
        db.refresh(case)
        return case
    except IntegrityError as error:
        db.rollback()
        existing = db.scalar(
            select(Case).where(Case.external_report_id == data.external_report_id)
        )
        if existing is not None:
            raise DuplicateCaseReportError(existing) from error
        raise
    except Exception:
        db.rollback()
        raise


def list_cases(
    db: Session,
    *,
    status: str | None,
    duplicate_status: str | None,
    limit: int,
    offset: int,
) -> tuple[list[Case], int]:
    filters = [Case.status == status] if status else []
    if duplicate_status:
        filters.append(Case.duplicate_status == duplicate_status)
    total = int(db.scalar(select(func.count(Case.case_id)).where(*filters)) or 0)
    items = list(
        db.scalars(
            select(Case)
            .options(selectinload(Case.case_images))
            .where(*filters)
            .order_by(Case.created_at.desc(), Case.case_id.desc())
            .limit(limit)
            .offset(offset)
        ).all()
    )
    return items, total


def get_case(db: Session, case_id: int) -> Case | None:
    return db.scalar(
        select(Case)
        .options(selectinload(Case.case_images))
        .where(Case.case_id == case_id)
    )
