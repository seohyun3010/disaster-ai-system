"""
DB 연결 및 세션 설정.

.env에 DATABASE_URL이 없으면 SQLite(dev.db)로 자동 대체되므로,
PostgreSQL 없이도 우선 서버를 켜고 확인할 수 있습니다.
"""

import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./dev.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """라우터에서 Depends(get_db)로 주입해서 씁니다."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
