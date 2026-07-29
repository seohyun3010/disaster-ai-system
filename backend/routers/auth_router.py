"""로그인 / 토큰 갱신 / 로그아웃 라우터."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.database import get_db
from models.user import User
from schemas.auth import (
    LoginRequest, LoginResponse, LogoutRequest, RefreshRequest, RefreshResponse, UserOut,
)
from services.auth_service import (
    authenticate_user, get_current_user, issue_tokens, refresh_access_token, revoke_refresh_token,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=LoginResponse, summary="로그인 (Access+Refresh Token 발급)")
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    user = authenticate_user(db, payload.username, payload.password)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="이메일 또는 비밀번호가 올바르지 않습니다.")
    access_token, refresh_token = issue_tokens(db, user)
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserOut(id=user.user_id, name=user.name, role=user.role),
    )


@router.post("/refresh", response_model=RefreshResponse, summary="Access Token 갱신")
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)) -> RefreshResponse:
    new_access_token = refresh_access_token(db, payload.refresh_token)
    if new_access_token is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="유효하지 않거나 만료된 refresh token입니다. 다시 로그인해주세요.")
    return RefreshResponse(access_token=new_access_token)


@router.post("/logout", summary="로그아웃 (Refresh Token 무효화)")
def logout(payload: LogoutRequest, db: Session = Depends(get_db)) -> dict:
    ok = revoke_refresh_token(db, payload.refresh_token)
    if not ok:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="유효하지 않은 요청입니다.")
    return {"message": "로그아웃 되었습니다."}


@router.get("/me", summary="현재 로그인한 사용자 정보 조회")
def get_me(current_user: User = Depends(get_current_user)) -> dict:
    return {
        "id": current_user.user_id,
        "name": current_user.name,
        "role": current_user.role,
    }