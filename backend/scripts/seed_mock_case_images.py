from __future__ import annotations

import hashlib
import sys
from pathlib import Path

from sqlalchemy import func, select

BACKEND_DIRECTORY = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIRECTORY))

from database.database import SessionLocal
from models.ai_results import AIResult
from models.case import Case
from models.case_image import CaseImage

IMAGE_DIRECTORY = BACKEND_DIRECTORY / "uploads" / "mock-cases"

# 신고 내용과 사진에서 실제로 확인되는 피해 유형을 기준으로 한 연결이다.
# 정확한 사진이 없는 신고는 엉뚱한 대체 사진을 노출하지 않도록 빈 목록으로 둔다.
MOCK_IMAGES = {
    "SAFE24-MOCK-2026-0001": ["house-heavy-rain-debris.jpg"],
    "SAFE24-MOCK-2026-0002": [
        "house6_view1.png",
        "house6_view2.png",
        "house6_view3.png",
        "house6_view4.png",
    ],
    "SAFE24-MOCK-2026-0003": [],  # 주택 인접 옹벽 붕괴 사진 필요
    # 상가 신고자 중 정우진 신고에만 새 집중호우 상가 사진을 적용한다.
    "SAFE24-MOCK-2026-0004": ["store-heavy-rain-collapse.png"],
    "SAFE24-MOCK-2026-0005": ["landslide-house.png"],
    "SAFE24-MOCK-2026-0006": [
        "road-heavy-rain-collapse-1.jpg",
        "road-heavy-rain-collapse-2.jpg",
    ],
    "SAFE24-MOCK-2026-0007": ["greenhouse-flood.png"],
    "SAFE24-MOCK-2026-0008": ["urban-flood.png"],
    "SAFE24-MOCK-2026-0009": [],  # 지진 주택 피해 사진 필요
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
    moved = 0
    removed = 0
    try:
        cases = {
            report_id: db.scalar(
                select(Case).where(Case.external_report_id == report_id)
            )
            for report_id in MOCK_IMAGES
        }
        expected_owner = {
            filename: cases[report_id]
            for report_id, filenames in MOCK_IMAGES.items()
            for filename in filenames
            if cases[report_id] is not None
        }

        # 기존 DB에 남은 mock 이미지 오연결도 함께 바로잡는다.
        managed_urls = {
            f"/uploads/mock-cases/{path.name}"
            for path in IMAGE_DIRECTORY.iterdir()
            if path.is_file() and path.suffix.lower() in {".jpg", ".jpeg", ".png"}
        }
        existing_images = db.scalars(
            select(CaseImage).where(CaseImage.image_url.in_(managed_urls))
        ).all()
        for image in existing_images:
            filename = Path(image.image_url or "").name
            owner = expected_owner.get(filename)
            if owner is None:
                # 잘못된 사진으로 만든 AI 결과 역시 근거가 유효하지 않다.
                db.query(AIResult).filter(
                    AIResult.image_id == image.image_id
                ).delete(synchronize_session=False)
                db.delete(image)
                removed += 1
            elif image.case_id != owner.case_id:
                db.query(AIResult).filter(
                    AIResult.image_id == image.image_id
                ).delete(synchronize_session=False)
                image.case_id = owner.case_id
                image.taken_at = owner.damage_occurred_at
                moved += 1

        next_id = int(db.scalar(select(func.max(CaseImage.image_id))) or 0) + 1
        for report_id, filenames in MOCK_IMAGES.items():
            case = cases[report_id]
            if case is None:
                print(f"[건너뜀] Case 없음: {report_id}")
                continue
            for filename in filenames:
                path = IMAGE_DIRECTORY / filename
                if not path.exists():
                    print(f"[건너뜀] 파일 없음: {filename}")
                    continue
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
                        taken_at=case.damage_occurred_at,
                    )
                )
                next_id += 1
                created += 1

        db.commit()
        print(
            "Mock case image 동기화 완료 "
            f"(등록 {created}건, 이동 {moved}건, 제거 {removed}건)"
        )
        for report_id in MOCK_IMAGES:
            case = cases[report_id]
            if case is None:
                continue
            filenames = [
                Path(image.image_url or "").name
                for image in db.scalars(
                    select(CaseImage)
                    .where(CaseImage.case_id == case.case_id)
                    .order_by(CaseImage.image_id)
                ).all()
            ]
            print(
                f"  {report_id} | {case.reporter_name} | "
                f"{case.disaster_type}/{case.facility_type}: "
                f"{filenames or ['사진 필요']}"
            )
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
