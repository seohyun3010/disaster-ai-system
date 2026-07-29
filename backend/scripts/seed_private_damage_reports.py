from __future__ import annotations

import sys
from datetime import datetime
from pathlib import Path

from sqlalchemy import select

BACKEND_DIRECTORY = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIRECTORY))

from database.database import SessionLocal
from models.case import Case


REPORT_DATA = {
    "SAFE24-MOCK-2026-0001": {
        "reporter_name": "김민수",
        "resident_registration_number": "800101-1234567",
        "contact_number": "010-1234-5678",
        "household_members": 3,
        "bank_name": "국민은행",
        "account_number": "123-456-789012",
        "account_holder": "김민수",
        "damage_occurred_at": datetime(2026, 7, 28, 5, 50),
        "damage_details": [
            {
                "category": "주택",
                "quantity": "1동",
                "details": "주택 1층과 마당이 약 60cm 침수되어 바닥재와 가전제품이 훼손됨",
            }
        ],
    },
    "SAFE24-MOCK-2026-0002": {
        "reporter_name": "박지현",
        "resident_registration_number": "850315-2345678",
        "contact_number": "010-3587-2416",
        "household_members": 2,
        "bank_name": "부산은행",
        "account_number": "101-2045-8890-03",
        "account_holder": "박지현",
        "damage_occurred_at": datetime(2026, 7, 28, 7, 40),
        "damage_details": [
            {
                "category": "주택",
                "quantity": "지붕 25㎡",
                "details": "강풍으로 주택 지붕 일부가 파손되고 빗물이 내부로 유입됨",
            }
        ],
    },
    "SAFE24-MOCK-2026-0003": {
        "reporter_name": "이서연",
        "resident_registration_number": "790922-2456789",
        "contact_number": "010-7721-3098",
        "household_members": 4,
        "bank_name": "대구은행",
        "account_number": "508-12-345678-9",
        "account_holder": "이서연",
        "damage_occurred_at": datetime(2026, 7, 28, 9, 55),
        "damage_details": [
            {
                "category": "옹벽·담장",
                "quantity": "약 12m",
                "details": "집중호우와 토사 유입으로 주택 인접 옹벽 일부가 붕괴되고 골목이 침수됨",
            }
        ],
    },
}


def main() -> None:
    db = SessionLocal()
    updated = 0
    try:
        for external_report_id, values in REPORT_DATA.items():
            case = db.scalar(
                select(Case).where(
                    Case.external_report_id == external_report_id
                )
            )
            if case is None:
                print(f"[건너뜀] 사건 없음: {external_report_id}")
                continue
            for field, value in values.items():
                setattr(case, field, value)
            updated += 1
        db.commit()
        print(f"사유재산 피해신고서 {updated}건 갱신 완료")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
