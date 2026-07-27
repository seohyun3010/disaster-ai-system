import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import (
    ai_job_router,
    ai_result_router,
    auth_router,
    benefit_checks_router,
    external_report,
    report_router,
    review_router,
    severity,
    subsidy_router,
) 
# 환경변수 불러오기 -> .env 파일 읽기 (DB 연결 정보 / 프론트엔드 주소 등)
# from routers import scase_router, health, subsidy_router, report_router
# from routers import subsidy_router, report_router
# from backend.routers import benefit_checks_router
load_dotenv()

app = FastAPI(title="재난 피해조사·지급심사 검증 플랫폼 API")

# 프론트(React 개발서버)에서 API 호출 허용
frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록 - ERD 확정되고 팀원별 기능 나오면 여기 계속 추가
app.include_router(auth_router.router)
app.include_router(ai_job_router.router)
app.include_router(ai_result_router.router)
app.include_router(review_router.router)
app.include_router(external_report.router)
app.include_router(subsidy_router.router)
app.include_router(report_router.router)
app.include_router(severity.router)
app.include_router(benefit_checks_router.router)

@app.get("/")
def root():
    return {"message": "재난 피해조사 플랫폼 API 서버 동작 중"}