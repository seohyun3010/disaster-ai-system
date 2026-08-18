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
from schemas.case import CaseCreate
from services.case_service import create_case


REPORT_ID = "SAFE24-MOCK-2026-0018"
CASE_NUMBER = "DS-2026-000018"
IMAGE_DIRECTORY = BACKEND_DIRECTORY / "uploads" / "mock-cases"
IMAGE_NAMES = [
    "earthquake-house-000018-01.png",
    "earthquake-house-000018-02.png",
    "earthquake-house-000018-03.png",
    "earthquake-house-000018-04.png",
]

CASE_DATA = {
    "external_report_id": REPORT_ID,
    "title": "지진으로 인한 공동주택 외벽 및 기초 파손 신고",
    "description": (
        "지진 발생 후 공동주택 외벽과 기초부에 균열이 생기고 일부 창호가 이탈했습니다. "
        "건물 안전 점검과 긴급 보수가 필요합니다."
    ),
    "disaster_type": "EARTHQUAKE",
    "facility_type": "HOUSE",
    "address": "경상북도 포항시 북구 흥해읍 초곡로 182",
    "sido": "경상북도",
    "sigungu": "포항시 북구",
    "latitude": 36.1098,
    "longitude": 129.3445,
    # 8.3~8.4 지진 신고 중 가장 최근 신고로 두어 목록 첫 번째에 표시한다.
    "reported_at": datetime(2026, 8, 4, 23, 59),
    "reporter_name": "김서현",
    "resident_registration_number": "790315-2345678",
    "contact_number": "010-4721-8395",
    "household_members": 4,
    "bank_name": "농협은행",
    "account_number": "301-0284-6519-01",
    "account_holder": "김서현",
    "damage_occurred_at": datetime(2026, 8, 4, 21, 10),
    "damage_details": [
        {
            "category": "주택",
            "quantity": "공동주택 1개 동·1세대",
            "details": (
                "외벽과 기초부 균열, 창호 이탈 및 유리 파손, 건물 일부 침하 의심"
            ),
        }
    ],
    "raw_payload": {
        "source_system": "국민안전24_MOCK",
        "reporter_type": "VICTIM",
        "report_form_type": "PRIVATE_DAMAGE_REPORT",
        "disaster_event_id": "backend-2026-08-EARTHQUAKE",
        "disaster_start_date": "2026-08-03",
        "disaster_end_date": "2026-08-04",
        "deadline_start_date": "2026-08-15",
        "deadline_end_date": "2026-08-28",
        "attachment_count": len(IMAGE_NAMES),
        "mock_data": True,
    },
}


def _image_hash(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _upsert_case(db) -> tuple[Case, bool]:
    case = db.scalar(select(Case).where(Case.external_report_id == REPORT_ID))
    number_owner = db.scalar(select(Case).where(Case.case_number == CASE_NUMBER))

    if case is None:
        if number_owner is not None:
            raise RuntimeError(
                f"{CASE_NUMBER}은 이미 case_id={number_owner.case_id}에서 사용 중입니다."
            )
        case = create_case(db, CaseCreate(**CASE_DATA))
        case.case_number = CASE_NUMBER
        db.commit()
        db.refresh(case)
        return case, True

    if number_owner is not None and number_owner.case_id != case.case_id:
        raise RuntimeError(
            f"{CASE_NUMBER}은 이미 case_id={number_owner.case_id}에서 사용 중입니다."
        )

    for field, value in CASE_DATA.items():
        setattr(case, field, value)
    case.case_number = CASE_NUMBER
    case.updated_at = datetime.now()
    db.commit()
    db.refresh(case)
    return case, False


def _upsert_images(db, case: Case) -> int:
    created = 0
    expected_urls = {f"/uploads/mock-cases/{name}" for name in IMAGE_NAMES}

    for image in db.scalars(select(CaseImage).where(CaseImage.case_id == case.case_id)):
        if image.image_url not in expected_urls:
            db.delete(image)

    for image_name in IMAGE_NAMES:
        image_path = IMAGE_DIRECTORY / image_name
        if not image_path.is_file():
            raise FileNotFoundError(f"피해 사진 파일이 없습니다: {image_path}")

        image_url = f"/uploads/mock-cases/{image_name}"
        digest = _image_hash(image_path)
        image = db.scalar(select(CaseImage).where(CaseImage.image_url == image_url))
        if image is None:
            image = db.scalar(select(CaseImage).where(CaseImage.image_hash == digest))

        if image is None:
            next_image_id = int(db.scalar(select(func.max(CaseImage.image_id))) or 0) + 1
            image = CaseImage(
                image_id=next_image_id,
                case_id=case.case_id,
                image_url=image_url,
                thumbnail_url=image_url,
                image_hash=digest,
                taken_at=CASE_DATA["damage_occurred_at"],
            )
            db.add(image)
            db.flush()
            created += 1
        else:
            image.case_id = case.case_id
            image.image_url = image_url
            image.thumbnail_url = image_url
            image.image_hash = digest
            image.taken_at = CASE_DATA["damage_occurred_at"]
    return created


def main() -> None:
    db = SessionLocal()
    try:
        case, case_created = _upsert_case(db)
        images_created = _upsert_images(db, case)
        db.commit()
        print(
            f"지진 신고 등록 완료: case_id={case.case_id}, "
            f"case_number={case.case_number}, case_created={case_created}, "
            f"images_created={images_created}, total_images={len(IMAGE_NAMES)}"
        )
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
