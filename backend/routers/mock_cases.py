from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from database.database import get_db
from schemas.mock_case import MockCaseCreate, MockCaseListResponse, MockCaseResponse
from services.mock_case_service import create_mock_case, list_mock_cases

router = APIRouter(
    prefix="/dev/mock-cases",
    tags=["development - mock cases"],
)


@router.post(
    "",
    response_model=MockCaseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Severity 테스트용 가상 사건 생성",
    description=(
        "case 담당 기능이 완성되기 전까지 사용하는 개발 전용 API입니다. "
        "응답의 case_id를 POST /cases/{case_id}/severity/calculate에 입력하세요."
    ),
)
def create_case_for_severity_test(
    body: MockCaseCreate, db: Session = Depends(get_db)
) -> MockCaseResponse:
    return MockCaseResponse.model_validate(create_mock_case(db, body))


@router.get(
    "",
    response_model=MockCaseListResponse,
    summary="생성된 가상 사건과 case_id 조회",
)
def read_mock_cases(db: Session = Depends(get_db)) -> MockCaseListResponse:
    cases = [
        MockCaseResponse.model_validate(case) for case in list_mock_cases(db)
    ]
    return MockCaseListResponse(items=cases)
