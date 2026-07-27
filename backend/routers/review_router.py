from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.database import get_db
from schemas.review import ReviewCreate, ReviewResponse
from services.review_service import create_review, get_reviews_by_case

router = APIRouter(tags=["Reviews"])


@router.post(
    "/cases/{case_id}/reviews",
    response_model=ReviewResponse,
    status_code=201,
    summary="공무원 검토 결과 저장 (승인/반려)",
)
def submit_review(
    case_id: int,
    data: ReviewCreate,
    db: Session = Depends(get_db),
) -> ReviewResponse:
    if data.hitl_result is False and not (data.comment and data.comment.strip()):
        raise HTTPException(status_code=400, detail="반려 시 사유 입력이 필수입니다")

    review = create_review(db, case_id, data)
    if review is None:
        raise HTTPException(status_code=404, detail="해당 신고를 찾을 수 없습니다")
    return review


@router.get(
    "/cases/{case_id}/reviews",
    response_model=list[ReviewResponse],
    summary="신고 건의 검토 이력 조회",
)
def read_reviews(
    case_id: int,
    db: Session = Depends(get_db),
) -> list[ReviewResponse]:
    return get_reviews_by_case(db, case_id)