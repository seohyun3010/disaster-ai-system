from datetime import datetime
from pathlib import Path

import httpx
from sqlalchemy.orm import Session

from models.ai_job import AIJob
from models.ai_results import AIResult
from models.case_image import CaseImage

AI_SERVER_URL = "http://127.0.0.1:8001"


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

        for img in images:
            file_path = Path(img.image_url)
            with open(file_path, "rb") as f:
                response = httpx.post(
                    f"{AI_SERVER_URL}/classify",
                    files={"files": (file_path.name, f, "image/jpeg")},
                    timeout=60.0,
                )
            response.raise_for_status()
            output = response.json()

            result = AIResult(
                case_id=job.case_id,
                image_id=img.image_id,
                damage_grade=output["damage_grade"],
                confidence=output["confidence"],
                inspection_required=output["inspection_required"],
                ai_explanation=f'{{"distribution": {output["distribution"]}, "model_version": "{output["model_version"]}"}}',
                analysis_time=output["analysis_time"],
                created_at=datetime.now(),
            )
            db.add(result)

        job.status = "DONE"
        job.finished_at = datetime.now()
        db.commit()
    except Exception:
        db.rollback()
        job.status = "FAILED"
        job.finished_at = datetime.now()
        db.commit()