"""로그인/토큰 갱신/로그아웃 관련 요청·응답 스키마."""
from pydantic import BaseModel, ConfigDict

class LoginRequest(BaseModel):    
    username: str    
    password: str

class UserOut(BaseModel):
    id: int    
    name: str | None = None    
    role: str | None = None
    model_config = ConfigDict(from_attributes=True)

class LoginResponse(BaseModel):
    """로그인 성공 응답. Access Token + Refresh Token 둘 다 발급."""
    access_token: str    
    refresh_token: str    
    token_type: str = "bearer"    
    user: UserOut

    model_config = ConfigDict(from_attributes=True)

class RefreshRequest(BaseModel):    
    refresh_token: str

class RefreshResponse(BaseModel):    
    access_token: str    
    token_type: str = "bearer"

class LogoutRequest(BaseModel):    
    refresh_token: str