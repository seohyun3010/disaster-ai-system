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
from services.disaster_event_service import sync_disaster_event_metadata


REPORT_ID = "SAFE24-MOCK-2026-0019"
CASE_NUMBER = "DS-2026-000019"
IMAGE_DIRECTORY = BACKEND_DIRECTORY / "uploads" / "mock-cases"
IMAGE_NAMES = [
    "heavy-rain-house-000019-01.jpg",
    "heavy-rain-house-000019-02.jpg",
    "heavy-rain-house-000019-03.jpg",
    "heavy-rain-house-000019-04.jpg",
]

CASE_DATA = {
    "external_report_id": REPORT_ID,
    "title": "집중호우로 인한 공동주택 옹벽 붕괴 및 차량 매몰 피해 신고",
    "description": (
        "집중호우로 옹벽 및 사면 토사가 무너져 내려 1층 세대 내부로 유입되었으며, "
        "주차된 차량 다수가 토사에 매몰·파손되었습니다. 세대 창호와 가재도구가 "
        "파손되어 긴급 복구가 필요합니다."
    ),
    "disaster_type": "HEAVY_RAIN",
    "facility_type": "HOUSE",
    "address": "경상남도 거제시 옥포동 거제오션뷰아파트 3동",
    "sido": "경상남도",
    "sigungu": "거제시",
    "latitude": 34.8934,
    "longitude": 128.7132,
    "reported_at": datetime(2026, 8, 18, 10, 0),
    "reporter_name": "박서준",
    "resident_registration_number": "850312-1234567",
    "contact_number": "010-4821-9037",
    "household_members": 3,
    "bank_name": "국민은행",
    "account_number": "301235-04-825197",
    "account_holder": "박서준",
    "damage_occurred_at": datetime(2026, 8, 17, 9, 0),
    "damage_details": [
        {
            "category": "주택",
            "quantity": "공동주택 1세대",
            "details": "옹벽 붕괴로 토사 유입, 창호·벽체 파손, 가재도구 다수 파손",
        },
        {
            "category": "차량",
            "quantity": "차량 2대",
            "details": "토사 매몰 및 나무 쓰러짐으로 차량 전면부 파손",
        },
    ],
    "raw_payload": {
        "source_system": "국민안전24_MOCK",
        "reporter_type": "VICTIM",
        "report_form_type": "PRIVATE_DAMAGE_REPORT",
        "disaster_event_id": "2026-HEAVY_RAIN",
        "disaster_start_date": "2026-08-16",
        "disaster_end_date": "2026-08-17",
        "deadline_start_date": "2026-08-28",
        "deadline_end_date": "2026-09-10",
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
        # 재난 기간 메타데이터 동기화 — 이걸 안 하면 사건은 DB에 들어가도
        # "자연재난 선택" 목록의 기간 그룹에는 반영되지 않는다.
        metadata_updates = sync_disaster_event_metadata(db)
        print(
            f"거제 집중호우 신고 등록 완료: case_id={case.case_id}, "
            f"case_number={case.case_number}, case_created={case_created}, "
            f"images_created={images_created}, total_images={len(IMAGE_NAMES)}, "
            f"event_metadata_updated={metadata_updates}"
        )
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
