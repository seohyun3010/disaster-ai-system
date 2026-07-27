from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.database import get_db
from schemas.ai_result import AIResultResponse
from services.ai_result_service import get_ai_results_by_case

router = APIRouter(tags=["AI Results"])


@router.get(
    "/cases/{case_id}/ai-results",
    response_model=list[AIResultResponse],
    summary="신고 건의 AI 판독 결과 조회",
)
def read_ai_results(
    case_id: int,
    db: Session = Depends(get_db),
) -> list[AIResultResponse]:
    return get_ai_results_by_case(db, case_id)