from __future__ import annotations

import hashlib
import sys
from datetime import datetime
from pathlib import Path

from sqlalchemy import func, select

BACKEND_DIRECTORY = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIRECTORY))

from database.database import SessionLocal
from models.case import Case
from models.case_image import CaseImage

IMAGE_DIRECTORY = BACKEND_DIRECTORY / "uploads" / "mock-cases"

MOCK_IMAGES = {
    "SAFE24-MOCK-2026-0001": [
        "flood-road.png",
        "flood-underpass.png",
    ],
    "SAFE24-MOCK-2026-0002": ["flood-collapse.png"],
    "SAFE24-MOCK-2026-0003": ["daegu-flood.png"],
}


def _file_hash(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    db = SessionLocal()
    created = 0
    try:
        next_id = int(db.scalar(select(func.max(CaseImage.image_id))) or 0) + 1
        for report_id, filenames in MOCK_IMAGES.items():
            case = db.scalar(
                select(Case).where(Case.external_report_id == report_id)
            )
            if case is None:
                print(f"[건너뜀] Case 없음: {report_id}")
                continue

            for filename in filenames:
                path = IMAGE_DIRECTORY / filename
                image_hash = _file_hash(path)
                exists = db.scalar(
                    select(CaseImage).where(CaseImage.image_hash == image_hash)
                )
                if exists is not None:
                    continue

                url = f"/uploads/mock-cases/{filename}"
                db.add(
                    CaseImage(
                        image_id=next_id,
                        case_id=case.case_id,
                        image_url=url,
                        thumbnail_url=url,
                        image_hash=image_hash,
                        taken_at=datetime.now(),
                    )
                )
                next_id += 1
                created += 1
        db.commit()
        print(f"Mock case image {created}건 등록 완료")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
