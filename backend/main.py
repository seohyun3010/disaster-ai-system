import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import external_report

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

app.include_router(external_report.router)

@app.get("/")
def root():
    return {"message": "재난 피해조사 플랫폼 API 서버 동작 중"}
