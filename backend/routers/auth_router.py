"""로그인 / 토큰 갱신 / 로그아웃 라우터."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.database import get_db
from schemas.auth import (
    LoginRequest,
    LoginResponse,
    LogoutRequest,
    RefreshRequest,
    RefreshResponse,
)
from services.auth_service import (
    authenticate_user,
    issue_tokens,
    refresh_access_token,
    revoke_refresh_token,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=LoginResponse, summary="로그인 (Access+Refresh Token 발급)")
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    user = authenticate_user(db, payload.email, payload.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 올바르지 않습니다.",
        )
    access_token, refresh_token = issue_tokens(db, user)
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=user.user_id,
        name=user.name,
        role=user.role,
    )


@router.post("/refresh", response_model=RefreshResponse, summary="Access Token 갱신")
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)) -> RefreshResponse:
    new_access_token = refresh_access_token(db, payload.refresh_token)
    if new_access_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않거나 만료된 refresh token입니다. 다시 로그인해주세요.",
        )
    return RefreshResponse(access_token=new_access_token)


@router.post("/logout", summary="로그아웃 (Refresh Token 무효화)")
def logout(payload: LogoutRequest, db: Session = Depends(get_db)) -> dict:
    ok = revoke_refresh_token(db, payload.refresh_token)
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 요청입니다.",
        )
    return {"message": "로그아웃 되었습니다."}
