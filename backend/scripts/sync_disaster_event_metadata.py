from __future__ import annotations

import sys
from pathlib import Path


BACKEND_DIRECTORY = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIRECTORY))

from database.database import SessionLocal
from services.disaster_event_service import sync_disaster_event_metadata


def main() -> None:
    db = SessionLocal()
    try:
        updated = sync_disaster_event_metadata(db)
        print(f"재해 기간 및 마감 기간 DB 반영 완료: updated_cases={updated}")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
