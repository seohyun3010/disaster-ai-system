"""
서버가 살아있는지, DB 연결이 되는지 확인하는 라우터.
팀원 아무나 이 주소 하나만 호출해봐도 "환경설정이 제대로 됐는지" 바로 알 수 있습니다.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from database.database import get_db

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
def health_check():
    return {"status": "ok"}


@router.get("/db")
def db_check(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"status": "ok", "db": "connected"}
