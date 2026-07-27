from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from database.database import get_db
from schemas.ai_job import AIJobResponse
from services.ai_job_service import create_ai_job, get_ai_job
from services.ai_analysis_service import execute_ai_job

router = APIRouter(tags=["AI Jobs"])


@router.post(
    "/cases/{case_id}/ai-jobs",
    response_model=AIJobResponse,
    status_code=201,
    summary="AI 분석 작업 생성",
)
def request_ai_analysis(
    case_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> AIJobResponse:
    job = create_ai_job(db, case_id)
    if job is None:
        raise HTTPException(status_code=404, detail="해당 신고를 찾을 수 없습니다")
    background_tasks.add_task(execute_ai_job, db, job.job_id)
    return job


@router.get(
    "/ai-jobs/{job_id}",
    response_model=AIJobResponse,
    summary="AI 분석 작업 상태 조회",
)
def read_ai_job(
    job_id: int,
    db: Session = Depends(get_db),
) -> AIJobResponse:
    job = get_ai_job(db, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="해당 작업을 찾을 수 없습니다")
    return job