from __future__ import annotations

from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from models.case import Case
from models.user import User
from schemas.mock_case import MockCaseCreate

MOCK_USER_ID = 990000
MOCK_CASE_ID_START = 990001
MOCK_CASE_NUMBER_PREFIX = "MOCK-SEVERITY"


def _ensure_mock_user(db: Session) -> User:
    user = db.get(User, MOCK_USER_ID)
    if user is None:
        user = User(
            user_id=MOCK_USER_ID,
            name="Severity Mock 담당자",
            email="severity-mock@local.test",
            role="OFFICIAL",
            department="재난복구 테스트팀",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(user)
        db.flush()
    return user


def create_mock_case(db: Session, data: MockCaseCreate) -> Case:
    """실제 cases 테이블에 FK 테스트용 사건을 생성합니다."""
    _ensure_mock_user(db)
    latest_id = db.scalar(
        select(func.max(Case.case_id)).where(Case.case_id >= MOCK_CASE_ID_START)
    )
    case_id = max(int(latest_id or 0) + 1, MOCK_CASE_ID_START)
    now = datetime.utcnow()
    case = Case(
        case_id=case_id,
        case_number=f"{MOCK_CASE_NUMBER_PREFIX}-{case_id}",
        user_id=MOCK_USER_ID,
        title=data.title,
        description=data.description,
        latitude=data.latitude,
        longitude=data.longitude,
        address=data.address,
        status=data.status,
        created_at=now,
        updated_at=now,
    )
    db.add(case)
    db.commit()
    db.refresh(case)
    return case


def list_mock_cases(db: Session) -> list[Case]:
    return list(
        db.scalars(
            select(Case)
            .where(Case.case_number.like(f"{MOCK_CASE_NUMBER_PREFIX}-%"))
            .order_by(Case.case_id.desc())
        ).all()
    )
