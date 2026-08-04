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


REPORT_ID = "SAFE24-MOCK-2026-0012"
IMAGE_DIRECTORY = BACKEND_DIRECTORY / "uploads" / "mock-cases"
IMAGE_NAMES = [
    "daedong-villa-earthquake-01.jpg",
    "daedong-villa-earthquake-02.jpg",
    "daedong-villa-earthquake-03.jpg",
    "daedong-villa-earthquake-04.jpg",
    "daedong-villa-earthquake-05.jpg",
    "daedong-villa-earthquake-06.jpg",
]

CASE_DATA = {
    "external_report_id": REPORT_ID,
    "title": "대동빌라 지진 피해 및 이재민 발생 신고",
    "description": (
        "지진으로 대동빌라 옥탑 구조물과 외벽, 창호가 파손되고 벽돌과 지붕재가 "
        "낙하했습니다. 추가 붕괴 위험으로 거주 세대가 임시 대피한 상태입니다."
    ),
    "disaster_type": "EARTHQUAKE",
    "facility_type": "HOUSE",
    "address": "경상북도 포항시 북구 흥해읍 대동로 27 대동빌라",
    "sido": "경상북도",
    "sigungu": "포항시 북구",
    "latitude": 36.1123,
    "longitude": 129.3478,
    "reported_at": datetime(2026, 8, 4, 10, 25),
    "reporter_name": "이도현",
    "resident_registration_number": "790318-1234567",
    "contact_number": "010-4726-8315",
    "household_members": 4,
    "bank_name": "농협은행",
    "account_number": "301-0284-7612-51",
    "account_holder": "이도현",
    "damage_occurred_at": datetime(2026, 8, 4, 9, 42),
    "damage_details": [
        {
            "category": "공동주택",
            "quantity": "대동빌라 1개 동·거주 4인",
            "details": (
                "옥탑 물탱크실과 조적벽 파손, 지붕 기와 및 벽돌 낙하, "
                "외벽·창호 파손으로 거주 불가"
            ),
        },
        {
            "category": "이재민",
            "quantity": "1세대 4명",
            "details": "추가 붕괴 우려로 전원 대피했으며 임시 주거시설 지원이 필요함",
        },
    ],
    "raw_payload": {
        "source_system": "국민안전24_MOCK",
        "reporter_type": "VICTIM",
        "report_form_type": "DISPLACED_PERSON_DAMAGE_REPORT",
        "attachment_count": len(IMAGE_NAMES),
        "mock_data": True,
        "evacuation_status": "EVACUATED",
        "displaced_households": 1,
        "displaced_people": 4,
        "temporary_shelter_required": True,
        "building_name": "대동빌라",
    },
}


def _image_hash(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _upsert_case(db) -> tuple[Case, bool]:
    case = db.scalar(select(Case).where(Case.external_report_id == REPORT_ID))
    if case is None:
        return create_case(db, CaseCreate(**CASE_DATA)), True

    for field, value in CASE_DATA.items():
        setattr(case, field, value)
    case.updated_at = datetime.now()
    db.commit()
    db.refresh(case)
    return case, False


def main() -> None:
    missing_images = [name for name in IMAGE_NAMES if not (IMAGE_DIRECTORY / name).is_file()]
    if missing_images:
        raise FileNotFoundError(f"피해 사진 파일이 없습니다: {', '.join(missing_images)}")

    db = SessionLocal()
    try:
        case, case_created = _upsert_case(db)
        created_images = 0

        for image_name in IMAGE_NAMES:
            image_path = IMAGE_DIRECTORY / image_name
            image_url = f"/uploads/mock-cases/{image_name}"
            digest = _image_hash(image_path)
            image = db.scalar(
                select(CaseImage).where(CaseImage.image_url == image_url)
            )
            if image is None:
                image = db.scalar(
                    select(CaseImage).where(CaseImage.image_hash == digest)
                )

            if image is None:
                next_image_id = int(
                    db.scalar(select(func.max(CaseImage.image_id))) or 0
                ) + 1
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
                created_images += 1
            else:
                image.case_id = case.case_id
                image.image_url = image_url
                image.thumbnail_url = image_url
                image.image_hash = digest
                image.taken_at = CASE_DATA["damage_occurred_at"]

        db.commit()
        print(
            f"대동빌라 지진 신고 등록 완료: case_id={case.case_id}, "
            f"case_created={case_created}, images_created={created_images}, "
            f"total_images={len(IMAGE_NAMES)}"
        )
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
