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


REPORTS = [
    {
        "external_report_id": "SAFE24-MOCK-2026-0004",
        "title": "집중호우로 인한 상가 토사 유입 신고",
        "description": "상가 앞 도로와 주차장에 토사와 잔해가 유입되어 영업 시설 일부가 파손되었습니다.",
        "disaster_type": "HEAVY_RAIN",
        "facility_type": "STORE",
        "address": "충청북도 청주시 상당구 남일면 효촌송암길 21",
        "sido": "충청북도",
        "sigungu": "청주시 상당구",
        "latitude": 36.5874,
        "longitude": 127.5098,
        "reported_at": datetime(2026, 7, 28, 11, 10),
        "reporter_name": "정우진",
        "resident_registration_number": "760412-1234567",
        "contact_number": "010-4382-6159",
        "household_members": 3,
        "bank_name": "농협은행",
        "account_number": "301-0281-7745-11",
        "account_holder": "정우진",
        "damage_occurred_at": datetime(2026, 7, 28, 9, 35),
        "damage_details": [
            {
                "category": "상가",
                "quantity": "1개소·주차장 45㎡",
                "details": "토사와 잔해 유입으로 출입구, 외부 집기 및 주차 시설 파손",
            }
        ],
        "image": "store-debris.png",
    },
    {
        "external_report_id": "SAFE24-MOCK-2026-0005",
        "title": "산사태로 인한 주택 및 차량 매몰 신고",
        "description": "주택 뒤편 사면이 붕괴하면서 토사가 주택 부속시설과 차량을 덮쳤습니다.",
        "disaster_type": "LANDSLIDE",
        "facility_type": "HOUSE",
        "address": "강원특별자치도 원주시 신림면 황둔리 314",
        "sido": "강원특별자치도",
        "sigungu": "원주시",
        "latitude": 37.2306,
        "longitude": 128.0821,
        "reported_at": datetime(2026, 7, 28, 12, 25),
        "reporter_name": "최은경",
        "resident_registration_number": "690807-2345678",
        "contact_number": "010-9051-2764",
        "household_members": 2,
        "bank_name": "신한은행",
        "account_number": "110-458-902341",
        "account_holder": "최은경",
        "damage_occurred_at": datetime(2026, 7, 28, 10, 50),
        "damage_details": [
            {
                "category": "주택·차량",
                "quantity": "주택 부속시설 1동·승용차 1대",
                "details": "사면 붕괴 토사로 창고와 차양이 파손되고 주차 차량 일부 매몰",
            }
        ],
        "image": "landslide-house.png",
    },
    {
        "external_report_id": "SAFE24-MOCK-2026-0006",
        "title": "계곡 범람으로 인한 도로 침수 신고",
        "description": "집중호우로 계곡물이 도로와 인근 상가 진입로를 넘어 차량 통행이 불가능합니다.",
        "disaster_type": "HEAVY_RAIN",
        "facility_type": "ROAD",
        "address": "경기도 가평군 청평면 호반로 112",
        "sido": "경기도",
        "sigungu": "가평군",
        "latitude": 37.7234,
        "longitude": 127.4198,
        "reported_at": datetime(2026, 7, 28, 13, 5),
        "reporter_name": "한도윤",
        "resident_registration_number": "880219-1456789",
        "contact_number": "010-6217-4430",
        "household_members": 4,
        "bank_name": "우리은행",
        "account_number": "1002-458-770921",
        "account_holder": "한도윤",
        "damage_occurred_at": datetime(2026, 7, 28, 11, 40),
        "damage_details": [
            {
                "category": "도로·진입로",
                "quantity": "약 180m",
                "details": "계곡 범람으로 도로가 약 50cm 침수되고 노면 일부 유실",
            }
        ],
        "image": "road-flash-flood.png",
    },
    {
        "external_report_id": "SAFE24-MOCK-2026-0007",
        "title": "농경지 및 비닐하우스 침수 신고",
        "description": "배수로가 넘치면서 농경지와 재배용 비닐하우스 내부가 침수되었습니다.",
        "disaster_type": "HEAVY_RAIN",
        "facility_type": "FARMLAND",
        "address": "충청남도 논산시 연산면 계백로 1842",
        "sido": "충청남도",
        "sigungu": "논산시",
        "latitude": 36.2178,
        "longitude": 127.1846,
        "reported_at": datetime(2026, 7, 28, 14, 20),
        "reporter_name": "오성호",
        "resident_registration_number": "640531-1678901",
        "contact_number": "010-3478-9215",
        "household_members": 2,
        "bank_name": "농협은행",
        "account_number": "351-0942-6307-43",
        "account_holder": "오성호",
        "damage_occurred_at": datetime(2026, 7, 28, 12, 15),
        "damage_details": [
            {
                "category": "농경지·비닐하우스",
                "quantity": "농경지 1,200㎡·비닐하우스 3동",
                "details": "시설 내부 약 40cm 침수로 작물과 관수 설비 피해",
            }
        ],
        "image": "greenhouse-flood.png",
    },
    {
        "external_report_id": "SAFE24-MOCK-2026-0008",
        "title": "도심 저지대 상가 침수 신고",
        "description": "시간당 강한 비로 도심 저지대 도로와 1층 상가 내부에 빗물이 유입되었습니다.",
        "disaster_type": "HEAVY_RAIN",
        "facility_type": "STORE",
        "address": "서울특별시 동작구 상도로 104",
        "sido": "서울특별시",
        "sigungu": "동작구",
        "latitude": 37.4998,
        "longitude": 126.9392,
        "reported_at": datetime(2026, 7, 28, 15, 45),
        "reporter_name": "문지아",
        "resident_registration_number": "910604-2789012",
        "contact_number": "010-5189-3642",
        "household_members": 1,
        "bank_name": "하나은행",
        "account_number": "352-910045-82107",
        "account_holder": "문지아",
        "damage_occurred_at": datetime(2026, 7, 28, 14, 5),
        "damage_details": [
            {
                "category": "상가",
                "quantity": "1층 점포 2개소·약 85㎡",
                "details": "도로와 점포 내부 약 35cm 침수로 집기 및 재고 일부 훼손",
            }
        ],
        "image": "urban-flood.png",
    },
    {
        "external_report_id": "SAFE24-MOCK-2026-0009",
        "title": "지진으로 인한 주택 벽체 균열 신고",
        "description": "지진 발생 후 주택 외벽과 내부 벽체에 균열이 생기고 일부 마감재가 떨어졌습니다.",
        "disaster_type": "EARTHQUAKE",
        "facility_type": "HOUSE",
        "address": "충청북도 괴산군 괴산읍 읍내로 215",
        "sido": "충청북도",
        "sigungu": "괴산군",
        "latitude": 36.8153,
        "longitude": 127.7866,
        "reported_at": datetime(2026, 6, 18, 9, 20),
        "reporter_name": "강현수",
        "resident_registration_number": "820614-1234567",
        "contact_number": "010-6842-3175",
        "household_members": 3,
        "bank_name": "국민은행",
        "account_number": "456-781-230945",
        "account_holder": "강현수",
        "damage_occurred_at": datetime(2026, 6, 13, 14, 35),
        "damage_details": [
            {
                "category": "주택",
                "quantity": "1동",
                "details": "외벽과 내부 벽체 균열 및 마감재 일부 탈락",
            }
        ],
    },
    # 신규 추가 (2026-08-03): 경주 지진 - DS2(준파) 등급 테스트용 케이스
    {
        "external_report_id": "SAFE24-MOCK-2026-0010",
        "title": "지진으로 인한 주택 외벽 균열 신고",
        "description": "지진 발생 후 주택 외벽에 다수의 균열이 발생하고 지붕 기와 일부가 파손되었습니다.",
        "disaster_type": "EARTHQUAKE",
        "facility_type": "HOUSE",
        "address": "경상북도 경주시 황성동 538-6",
        "sido": "경상북도",
        "sigungu": "경주시",
        "latitude": 35.8687865,
        "longitude": 129.2118908,
        "reported_at": datetime(2026, 8, 3, 14, 35),
        "reporter_name": "김민준",
        "resident_registration_number": "930215-1456789",
        "contact_number": "010-7734-2091",
        "household_members": 3,
        "bank_name": "신한은행",
        "account_number": "110-762-459081",
        "account_holder": "김민준",
        "damage_occurred_at": datetime(2026, 8, 3, 13, 52),
        "damage_details": [
            {
                "category": "주택",
                "quantity": "1동",
                "details": "외벽 다수 균열 및 지붕 기와 일부 파손",
            }
        ],
        "image": "house-earthquake-crack-2.jpg",
    },
    # 신규 추가 (2026-08-03): 포항 지진 - 추가 검증용 케이스
    {
        "external_report_id": "SAFE24-MOCK-2026-0011",
        "title": "지진으로 인한 주택 외벽 균열 및 파손 신고",
        "description": "지진 발생 후 주택 외벽에 균열이 발생하고 창호 주변 마감재 일부가 탈락했습니다.",
        "disaster_type": "EARTHQUAKE",
        "facility_type": "HOUSE",
        "address": "경상북도 포항시 북구 흥해읍 남성리 587-1",
        "sido": "경상북도",
        "sigungu": "포항시 북구",
        "latitude": 36.1015776,
        "longitude": 129.3439027,
        "reported_at": datetime(2026, 8, 3, 16, 10),
        "reporter_name": "박서준",
        "resident_registration_number": "870423-1567890",
        "contact_number": "010-8823-4576",
        "household_members": 4,
        "bank_name": "우리은행",
        "account_number": "1002-847-215369",
        "account_holder": "박서준",
        "damage_occurred_at": datetime(2026, 8, 3, 15, 20),
        "damage_details": [
            {
                "category": "주택",
                "quantity": "1동",
                "details": "외벽 균열 및 창호 주변 마감재 일부 탈락",
            }
        ],
        "image": "house-earthquake-crack-3.png",
    },
]


def _image_hash(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    db = SessionLocal()
    created_cases = 0
    created_images = 0
    try:
        for report in REPORTS:
            image_name = report.get("image")
            case_data = {key: value for key, value in report.items() if key != "image"}
            case_data["raw_payload"] = {
                "source_system": "국민안전24_MOCK",
                "reporter_type": "VICTIM",
                "attachment_count": 1 if image_name else 0,
                "mock_data": True,
            }
            case = db.scalar(
                select(Case).where(
                    Case.external_report_id == report["external_report_id"]
                )
            )
            if case is None:
                case = create_case(db, CaseCreate(**case_data))
                created_cases += 1
            else:
                for field, value in case_data.items():
                    if field != "raw_payload":
                        setattr(case, field, value)
                db.commit()

            if image_name is None:
                continue

            image_path = (
                BACKEND_DIRECTORY / "uploads" / "mock-cases" / image_name
            )
            digest = _image_hash(image_path)
            existing_image = db.scalar(
                select(CaseImage).where(CaseImage.image_hash == digest)
            )
            if existing_image is None:
                next_image_id = int(
                    db.scalar(select(func.max(CaseImage.image_id))) or 0
                ) + 1
                image_url = f"/uploads/mock-cases/{image_name}"
                db.add(
                    CaseImage(
                        image_id=next_image_id,
                        case_id=case.case_id,
                        image_url=image_url,
                        thumbnail_url=image_url,
                        image_hash=digest,
                        taken_at=case.damage_occurred_at,
                    )
                )
                db.commit()
                created_images += 1

        print(
            f"추가 신고서 {created_cases}건, 피해 사진 {created_images}건 등록 완료"
        )
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()