from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from models.ai_job import AIJob


def create_ai_job(db: Session, case_id: int) -> AIJob:
    job = AIJob(
        case_id=case_id,
        status="PENDING",
        started_at=datetime.now(),
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def get_ai_job(db: Session, job_id: int) -> AIJob | None:
    statement = select(AIJob).where(AIJob.job_id == job_id)
    return db.scalars(statement).first()