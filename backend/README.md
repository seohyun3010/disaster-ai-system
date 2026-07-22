# 재난 피해조사·지급심사 검증 플랫폼 — 백엔드

## 폴더 구조
```
disaster-backend
├── main.py       # 시작점
├── routers       # API 주소 관리
├── services      # 실제 로직 (지금은 비어있음, ERD 확정 후 채움)
├── models        # DB 테이블 (지금은 비어있음, ERD 확정 후 SQLAlchemy 모델 작성)
├── schemas       # 요청/응답 JSON 형태 (지금은 비어있음)
├── database      # DB 연결 코드
└── ai            # AI 모델 관련 코드 (지금은 비어있음)
```
(개념 정리 문서의 구조 그대로)

## 1. 처음 설치할 때

```bash
# 1) 가상환경 생성
python3 -m venv venv

# 2) 가상환경 켜기
source venv/bin/activate      # Mac/Linux
venv\Scripts\activate         # Windows

# 3) 라이브러리 설치
pip install -r requirements.txt

# 4) 환경변수 파일 만들기
cp .env.example .env
# .env 파일 열어서 DATABASE_URL, JWT_SECRET_KEY 채워넣기
```

## 2. 서버 실행

```bash
uvicorn main:app --reload
```

- 서버: http://localhost:8000
- Swagger(API 문서 자동생성): http://localhost:8000/docs
- 헬스체크: http://localhost:8000/health
- DB 연결확인: http://localhost:8000/health/db

`.env`에 `DATABASE_URL`을 안 채우면 자동으로 SQLite(`dev.db`)로 켜지니까,
PostgreSQL 세팅 전에도 서버가 도는지 먼저 확인할 수 있습니다.

## 3. PostgreSQL 연결하려면

`.env`의 `DATABASE_URL`을 실제 PostgreSQL 접속정보로 채우면 됩니다:
```
DATABASE_URL=postgresql+psycopg://사용자명:비밀번호@호스트:5432/DB이름
```
그 다음 `http://localhost:8000/health/db` 다시 호출해서 `"db": "connected"` 뜨는지 확인.

## 4. 다음 할 일 (ERD 확정되면)

1. `models/` 안에 ERD 테이블별로 SQLAlchemy 모델 파일 작성 (예: `models/case.py`, `models/user.py`)
2. `schemas/` 안에 각 API 요청/응답 Pydantic 스키마 작성
3. `routers/` 안에 팀원별로 담당 기능 라우터 작성 (예: `routers/auth.py`, `routers/cases.py`)
4. `main.py`에 `app.include_router(...)`로 새 라우터 등록
5. `services/` 안에 실제 비즈니스 로직 (DB 조회, AI 호출 등) 작성

## 5. Git 작업 시 주의
- `.env`는 절대 커밋하지 않기 (`.gitignore`에 이미 포함)
- 브랜치 규칙은 팀 Git 가이드라인 문서 참고 (`feat/기능명` 브랜치에서만 작업)

## 6. Alembic (DB 테이블 생성/변경)

models/ 에 모델을 작성한 뒤 아래 명령어로 실제 DB에 반영합니다.

```bash
# 변경사항 감지해서 마이그레이션 파일 생성
alembic revision --autogenerate -m "메시지"

# 실제 DB에 반영
alembic upgrade head

# 현재 적용된 버전 확인
alembic current
```

## 7. 자주 겪는 오류

- PowerShell에서 가상환경 활성화 실패 (UnauthorizedAccess)
  → 관리자 권한 PowerShell에서 1회 실행:
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

- ModuleNotFoundError: No module named 'psycopg2'
  → .env의 DATABASE_URL이 postgresql+psycopg:// 인지 확인 (psycopg2 아님)

- /health/db 에서 500 에러
  → Docker 실행 여부 확인 (docker compose ps)
  → backend/.env 비밀번호가 루트 .env의 POSTGRES_PASSWORD와 같은지 확인
