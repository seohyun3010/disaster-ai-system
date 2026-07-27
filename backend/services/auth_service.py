"""로그인/토큰 갱신/로그아웃 업무 로직.

주의: passlib(1.7.4) + bcrypt(5.0.0) 조합은 서로 버전이 안 맞아서
passlib.CryptContext를 쓰면 해싱 시점에 에러가 납니다. bcrypt를 직접 사용.
"""

import os
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from models.user import User

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-change-me")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "14"))


def hash_password(plain_password: str) -> str:
    return bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = db.query(User).filter(User.email == email).first()
    if user is None or not user.password:
        return None
    if not verify_password(password, user.password):
        return None
    return user


def create_access_token(user: User) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(user.user_id), "role": user.role, "type": "access", "exp": expire}
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def create_refresh_token(user: User) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {"sub": str(user.user_id), "type": "refresh", "exp": expire}
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def issue_tokens(db: Session, user: User) -> tuple[str, str]:
    """로그인 성공 시 Access+Refresh 둘 다 발급하고, refresh는 DB에 저장.
    (나중에 로그아웃/갱신 요청이 왔을 때 "이게 지금도 유효한 토큰인지" 비교하려고)"""
    access_token = create_access_token(user)
    refresh_token = create_refresh_token(user)
    user.refresh_token = refresh_token
    db.commit()
    return access_token, refresh_token


def refresh_access_token(db: Session, refresh_token: str) -> str | None:
    """refresh_token이 유효하고, DB에 저장된 값과 일치하면 새 Access Token 발급.
    유효하지 않거나(만료/변조) 이미 로그아웃돼서 DB 값이 다르면 None."""
    try:
        payload = jwt.decode(refresh_token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except JWTError:
        return None

    if payload.get("type") != "refresh":
        return None

    user = db.query(User).filter(User.user_id == int(payload.get("sub"))).first()
    if user is None or user.refresh_token != refresh_token:
        return None

    return create_access_token(user)


def revoke_refresh_token(db: Session, refresh_token: str) -> bool:
    """로그아웃 — DB에 저장된 refresh_token을 지워서 이후 갱신 요청을 막음."""
    try:
        payload = jwt.decode(refresh_token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except JWTError:
        return False

    user = db.query(User).filter(User.user_id == int(payload.get("sub"))).first()
    if user is None or user.refresh_token != refresh_token:
        return False

    user.refresh_token = None
    db.commit()
    return True
