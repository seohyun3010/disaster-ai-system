from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from database.database import get_db
from models.user import User
from schemas.duplicate import (
    DuplicateCandidateResponse,
    DuplicateCheckResponse,
    DuplicateDecisionRequest,
    DuplicateDecisionResponse,
)
from services.auth_service import get_current_user
from services.case_service import get_case
from services.duplicate_service import (
    check_case_duplicates,
    decide_duplicate_candidate,
    get_duplicate_candidates,
)

router = APIRouter(prefix="/cases", tags=["case-duplicates"])


def _get_case_or_404(db: Session, case_id: int):
    case = get_case(db, case_id)
    if case is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found",
        )
    return case


@router.post(
    "/{case_id}/duplicate-check",
    response_model=DuplicateCheckResponse,
)
def run_duplicate_check(
    case_id: int,
    threshold: float = Query(default=0.60, ge=0, le=1),
    db: Session = Depends(get_db),
):
    case = _get_case_or_404(db, case_id)
    return check_case_duplicates(db, case, threshold)


@router.get(
    "/{case_id}/duplicate-candidates",
    response_model=list[DuplicateCandidateResponse],
)
def read_duplicate_candidates(
    case_id: int,
    db: Session = Depends(get_db),
):
    _get_case_or_404(db, case_id)
    return get_duplicate_candidates(db, case_id)


@router.patch(
    "/{case_id}/duplicate-decision",
    response_model=DuplicateDecisionResponse,
)
def review_duplicate_candidate(
    case_id: int,
    body: DuplicateDecisionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    case = _get_case_or_404(db, case_id)
    result = decide_duplicate_candidate(
        db,
        case=case,
        duplicate_id=body.duplicate_id,
        decision=body.decision,
        reviewer_user_id=current_user.user_id,
        note=body.note,
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Duplicate candidate not found",
        )
    return result
