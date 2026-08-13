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


REPORT_ID = "SAFE24-MOCK-2026-0017"
CASE_NUMBER = "DS-2026-000017"
IMAGE_DIRECTORY = BACKEND_DIRECTORY / "uploads" / "mock-cases"
IMAGE_NAMES = [
    "heavy-rain-house-000017-01.jpg",
    "heavy-rain-house-000017-02-v2.jpg",
    "heavy-rain-house-000017-03.jpg",
]
LEGACY_IMAGE_URLS = {
    "heavy-rain-house-000017-02-v2.jpg": (
        "/uploads/mock-cases/heavy-rain-house-000017-02.jpg"
    ),
}

CASE_DATA = {
    "external_report_id": REPORT_ID,
    "title": "집중호우로 인한 반지하 주택 침수 피해 신고",
    "description": (
        "집중호우로 골목과 반지하 주택에 빗물이 유입되어 실내 가구와 가전제품이 "
        "침수됐으며, 배수 후에도 벽체와 바닥에 오염 및 습기 피해가 남았습니다."
    ),
    "disaster_type": "HEAVY_RAIN",
    "facility_type": "HOUSE",
    "address": "서울특별시 관악구 신림로 184",
    "sido": "서울특별시",
    "sigungu": "관악구",
    "latitude": 37.4817,
    "longitude": 126.9292,
    # 7.15~7.18 집중호우 신고 중 가장 먼저 표시되도록 기간 내 최종 시각으로 등록한다.
    "reported_at": datetime(2026, 7, 18, 23, 59),
    "reporter_name": "이현우",
    "resident_registration_number": "780426-1234567",
    "contact_number": "010-5824-7316",
    "household_members": 3,
    "bank_name": "국민은행",
    "account_number": "457-21-830194",
    "account_holder": "이현우",
    "damage_occurred_at": datetime(2026, 7, 18, 21, 35),
    "damage_details": [
        {
            "category": "주택",
            "quantity": "반지하 주택 1세대·방 3칸",
            "details": (
                "실내 약 70cm 침수, 벽체와 바닥 오염, 냉장고·세탁기 및 가구 다수 침수"
            ),
        }
    ],
    "raw_payload": {
        "source_system": "국민안전24_MOCK",
        "reporter_type": "VICTIM",
        "report_form_type": "PRIVATE_DAMAGE_REPORT",
        "disaster_event_id": "2026-HEAVY_RAIN",
        "disaster_start_date": "2026-07-15",
        "disaster_end_date": "2026-07-18",
        "deadline_start_date": "2026-07-29",
        "deadline_end_date": "2026-08-11",
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
                f"{CASE_NUMBER}는 이미 case_id={number_owner.case_id}에서 사용 중입니다."
            )
        case = create_case(db, CaseCreate(**CASE_DATA))
        case.case_number = CASE_NUMBER
        db.commit()
        db.refresh(case)
        return case, True

    if number_owner is not None and number_owner.case_id != case.case_id:
        raise RuntimeError(
            f"{CASE_NUMBER}는 이미 case_id={number_owner.case_id}에서 사용 중입니다."
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
    for image_name in IMAGE_NAMES:
        image_path = IMAGE_DIRECTORY / image_name
        if not image_path.is_file():
            raise FileNotFoundError(f"피해 사진 파일이 없습니다: {image_path}")

        image_url = f"/uploads/mock-cases/{image_name}"
        digest = _image_hash(image_path)
        image = db.scalar(select(CaseImage).where(CaseImage.image_url == image_url))
        if image is None and image_name in LEGACY_IMAGE_URLS:
            image = db.scalar(
                select(CaseImage).where(
                    CaseImage.image_url == LEGACY_IMAGE_URLS[image_name],
                    CaseImage.case_id == case.case_id,
                )
            )
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
            f"집중호우 신고 등록 완료: case_id={case.case_id}, "
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
