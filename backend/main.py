import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import auth_router, health

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

# 라우터 등록 — ERD 확정되고 팀원별 기능 나오면 여기 계속 추가
app.include_router(health.router)
app.include_router(auth_router.router)


@app.get("/")
def root():
    return {"message": "재난 피해조사 플랫폼 API 서버 동작 중"}
