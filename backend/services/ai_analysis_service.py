from contextlib import ExitStack
from datetime import datetime
from pathlib import Path

import httpx
import json
from sqlalchemy.orm import Session

from models.ai_job import AIJob
from models.ai_results import AIResult
from models.case_image import CaseImage

AI_SERVER_URL = "http://127.0.0.1:8001"
BACKEND_DIRECTORY = Path(__file__).resolve().parent.parent


def _resolve_image_path(image_url: str) -> Path:
    if image_url.startswith("/uploads/"):
        return BACKEND_DIRECTORY / image_url.removeprefix("/")
    return Path(image_url)


def execute_ai_job(db: Session, job_id: int) -> None:
    job = db.get(AIJob, job_id)
    if job is None:
        return

    job.status = "RUNNING"
    db.commit()

    try:
        images = db.query(CaseImage).filter(CaseImage.case_id == job.case_id).all()
        if not images:
            raise ValueError("분석할 이미지가 없습니다")

        # 존재하는 파일만 추림
        valid = []
        for img in images:
            path = _resolve_image_path(img.image_url)
            if path.exists():
                valid.append((img, path))
            else:
                print(f"[AI JOB {job_id}] 파일 없음, 건너뜀: {path}")

        if not valid:
            raise FileNotFoundError("분석 가능한 이미지 파일이 없습니다")

        # 다중 뷰를 한 번에 전송 → 추론 서버가 집 단위 softmax 평균 수행
        with ExitStack() as stack:
            files = [
                ("files", (path.name, stack.enter_context(open(path, "rb")), "image/jpeg"))
                for _, path in valid
            ]
            response = httpx.post(
                f"{AI_SERVER_URL}/classify",
                files=files,
                timeout=120.0,
            )
        response.raise_for_status()
        output = response.json()

        # 집 단위 결과 1건만 저장 (대표 이미지 = 첫 번째 뷰)
        result = AIResult(
            case_id=job.case_id,
            case_number=job.case.case_number,
            image_id=valid[0][0].image_id,
            damage_grade=output["damage_grade"],
            confidence=output["confidence"],
            inspection_required=output["inspection_required"],
            ai_explanation=json.dumps({
                "distribution": output["distribution"],
                "model_version": output["model_version"],
                "view_count": len(valid),
                "second_grade": output.get("second_grade"),
                "second_confidence": output.get("second_confidence"),
                "observation": output.get("observation", {}),
                "consistency": output.get("consistency", {}),
                "cam_urls": output.get("cam_urls", []),
                "gate": output.get("gate", {}),
                "preprocess": output.get("preprocess", []),
                "source_urls": [img.image_url for img, _ in valid],
            }, ensure_ascii=False),
            analysis_time=output["analysis_time"],
            created_at=datetime.now(),
        )
        db.add(result)

        job.status = "DONE"
        job.finished_at = datetime.now()
        db.commit()
        print(f"[AI JOB {job_id}] DONE — {output['damage_grade']} "
              f"{output['confidence']:.1%} ({len(valid)}뷰)")

    except Exception as e:
        import traceback
        print(f"\n[AI JOB {job_id}] FAILED: {type(e).__name__}: {e}")
        traceback.print_exc()
        db.rollback()
        job.status = "FAILED"
        job.finished_at = datetime.now()
        db.commit()