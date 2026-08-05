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


IMAGE_DIRECTORY = BACKEND_DIRECTORY / "uploads" / "mock-cases"

REPORTS = [
    {
        "external_report_id": "SAFE24-MOCK-2026-0013",
        "title": "태풍으로 인한 단독주택 담장 붕괴 신고",
        "description": (
            "태풍의 강풍과 집중호우로 주택 외부 블록 담장이 붕괴하고 "
            "진입로에 잔해가 쌓여 통행이 어려운 상태입니다."
        ),
        "disaster_type": "TYPHOON",
        "facility_type": "HOUSE",
        "address": "제주특별자치도 제주시 한림읍 협재로 20",
        "sido": "제주특별자치도",
        "sigungu": "제주시",
        "latitude": 33.3938,
        "longitude": 126.2397,
        "reported_at": datetime(2026, 8, 4, 11, 10),
        "reporter_name": "강수진",
        "resident_registration_number": "810512-2345678",
        "contact_number": "010-5831-7264",
        "household_members": 3,
        "bank_name": "제주은행",
        "account_number": "02-481-739201",
        "account_holder": "강수진",
        "damage_occurred_at": datetime(2026, 8, 4, 7, 40),
        "damage_details": [
            {
                "category": "주택",
                "quantity": "담장 약 12m·대문 1개소",
                "details": "강풍으로 블록 담장과 대문 기둥이 붕괴하고 주택 진입로가 파손됨",
            }
        ],
        "images": ["typhoon-house-01.jpg", "typhoon-house-02.jpg"],
    },
    {
        "external_report_id": "SAFE24-MOCK-2026-0014",
        "title": "폭설로 인한 농경지 비닐하우스 붕괴 신고",
        "description": (
            "연속된 폭설의 적설 하중으로 시설하우스 골조가 휘고 피복이 내려앉아 "
            "재배 작물과 관수 시설이 피해를 입었습니다."
        ),
        "disaster_type": "HEAVY_SNOW",
        "facility_type": "FARMLAND",
        "address": "강원특별자치도 평창군 진부면 오대천로 184",
        "sido": "강원특별자치도",
        "sigungu": "평창군",
        "latitude": 37.6379,
        "longitude": 128.5585,
        "reported_at": datetime(2026, 2, 9, 9, 35),
        "reporter_name": "박영철",
        "resident_registration_number": "650903-1234567",
        "contact_number": "010-3168-9427",
        "household_members": 2,
        "bank_name": "농협은행",
        "account_number": "351-1027-6843-93",
        "account_holder": "박영철",
        "damage_occurred_at": datetime(2026, 2, 9, 6, 20),
        "damage_details": [
            {
                "category": "농경지·시설하우스",
                "quantity": "비닐하우스 4동·약 2,100㎡",
                "details": "적설 하중으로 철제 골조와 차광막이 붕괴하고 재배 작물이 훼손됨",
            }
        ],
        "images": [
            "heavy-snow-farmland-01.jpg",
            "heavy-snow-farmland-02.jpg",
            "heavy-snow-farmland-03.jpg",
            "heavy-snow-farmland-04.jpg",
        ],
    },
    {
        "external_report_id": "SAFE24-MOCK-2026-0015",
        "title": "집중호우로 인한 주택 지붕 및 내부 파손 신고",
        "description": (
            "집중호우로 약해진 흙벽과 지붕 일부가 무너져 침실 천장과 가재도구가 "
            "파손됐으며 추가 붕괴 위험이 있습니다."
        ),
        "disaster_type": "HEAVY_RAIN",
        "facility_type": "HOUSE",
        "address": "전라남도 구례군 구례읍 섬진강로 73",
        "sido": "전라남도",
        "sigungu": "구례군",
        "latitude": 35.2029,
        "longitude": 127.4628,
        "reported_at": datetime(2026, 7, 19, 16, 20),
        "reporter_name": "윤정희",
        "resident_registration_number": "720226-2345678",
        "contact_number": "010-7482-1956",
        "household_members": 2,
        "bank_name": "광주은행",
        "account_number": "1107-020-846315",
        "account_holder": "윤정희",
        "damage_occurred_at": datetime(2026, 7, 19, 13, 55),
        "damage_details": [
            {
                "category": "주택",
                "quantity": "단독주택 1동·방 2칸",
                "details": "지붕과 흙벽 일부 붕괴, 실내 천장 및 가재도구 파손",
            }
        ],
        "images": ["heavy-rain-house-01.jpg", "heavy-rain-house-02.jpg"],
    },
    {
        "external_report_id": "SAFE24-MOCK-2026-0016",
        "title": "산불 확산으로 인한 축사 및 사육시설 피해 신고",
        "description": (
            "인근 산불의 화염과 복사열로 축사 지붕과 울타리, 급이 시설이 불에 타거나 "
            "변형됐으며 가축을 긴급 이동시켰습니다."
        ),
        "disaster_type": "WILDFIRE",
        "facility_type": "LIVESTOCK_FACILITY",
        "address": "경상북도 의성군 안평면 산불로 128",
        "sido": "경상북도",
        "sigungu": "의성군",
        "latitude": 36.3762,
        "longitude": 128.5841,
        "reported_at": datetime(2026, 4, 7, 18, 10),
        "reporter_name": "최재호",
        "resident_registration_number": "680714-1234567",
        "contact_number": "010-2947-6381",
        "household_members": 4,
        "bank_name": "농협은행",
        "account_number": "302-1184-7602-11",
        "account_holder": "최재호",
        "damage_occurred_at": datetime(2026, 4, 7, 15, 45),
        "damage_details": [
            {
                "category": "축사",
                "quantity": "축사 2동·소 14두·염소 32두",
                "details": "지붕 피복과 울타리, 급이통 소실 및 변형; 가축은 인근 시설로 대피",
            }
        ],
        "images": ["wildfire-livestock-01.jpg", "wildfire-livestock-02.jpg"],
    },
]


def _image_hash(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _upsert_case(db, report: dict) -> tuple[Case, bool]:
    report_id = report["external_report_id"]
    images = report["images"]
    case_data = {key: value for key, value in report.items() if key != "images"}
    case_data["raw_payload"] = {
        "source_system": "국민안전24_MOCK",
        "reporter_type": "VICTIM",
        "report_form_type": "PRIVATE_DAMAGE_REPORT",
        "attachment_count": len(images),
        "mock_data": True,
    }

    case = db.scalar(select(Case).where(Case.external_report_id == report_id))
    if case is None:
        return create_case(db, CaseCreate(**case_data)), True

    for field, value in case_data.items():
        setattr(case, field, value)
    case.updated_at = datetime.now()
    db.commit()
    db.refresh(case)
    return case, False


def _upsert_images(db, case: Case, image_names: list[str]) -> int:
    created = 0
    for image_name in image_names:
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
                taken_at=case.damage_occurred_at,
            )
            db.add(image)
            db.flush()
            created += 1
        else:
            image.case_id = case.case_id
            image.image_url = image_url
            image.thumbnail_url = image_url
            image.image_hash = digest
            image.taken_at = case.damage_occurred_at
    return created


def main() -> None:
    db = SessionLocal()
    created_cases = 0
    created_images = 0
    try:
        for report in REPORTS:
            case, was_created = _upsert_case(db, report)
            created_cases += int(was_created)
            created_images += _upsert_images(db, case, report["images"])
        db.commit()
        metadata_updates = sync_disaster_event_metadata(db)
        print(
            f"재난 신고 4건 등록 완료: cases_created={created_cases}, "
            f"images_created={created_images}, total_images=10, "
            f"event_metadata_updated={metadata_updates}"
        )
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
