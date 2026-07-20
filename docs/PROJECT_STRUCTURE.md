# React + FastAPI 프로젝트 구조

이 구조는 `PROJECT_LOGIC.md`의 재난 피해 신고 → AI 분석 → 담당자 검토 →
심각도/복구 → 지원금 → 보고서 흐름을 구현하기 위한 기준 구조다.

## 1. 최상위 구조

```text
disaster-ai-system/
├─ frontend/                    React + Vite
├─ backend/                     FastAPI
├─ docs/                        기획·설계 문서
│  ├─ PROJECT_LOGIC.md
│  └─ PROJECT_STRUCTURE.md
├─ .gitignore
├─ .env.example                 환경 설정 
├─ docker-compose.yml           로컬 통합 실행용
└─ README.md
```

`frontend`와 `backend`는 서로 독립적으로 실행하고, REST API로 통신한다.

---

## 2. Frontend 구조

```text
frontend/
├─ public/
│  ├─ favicon.svg
│  └─ manifest.json
│
├─ src/
│  ├─ assets/
│  │  ├─ images/
│  │  └─ icons/
│  │
│  ├─ components/               재사용 가능한 ui 컴포넌트 
│  │  ├─ layout/
│  │  │  ├─ AppLayout.jsx
│  │  │  ├─ Sidebar.jsx
│  │  │  ├─ Header.jsx
│  │  │  └─ ProtectedRoute.jsx  로그인
│  │  │
│  │  ├─ common/
│  │  │  ├─ Card.jsx
│  │  │  ├─ Button.jsx
│  │  │  ├─ Badge.jsx
│  │  │  ├─ Modal.jsx
│  │  │  ├─ SearchBar.jsx
│  │  │  ├─ Pagination.jsx
│  │  │  ├─ LoadingSpinner.jsx  
│  │  │  ├─ ErrorMessage.jsx
│  │  │  └─ EmptyState.jsx
│  │  │
│  │  ├─ dashboard/
│  │  │  ├─ SummaryCards.jsx
│  │  │  ├─ StageProgress.jsx
│  │  │  ├─ RegionDamageMap.jsx
│  │  │  └─ RecentCaseTable.jsx
│  │  │
│  │  ├─ case/
│  │  │  ├─ CaseForm.jsx
│  │  │  ├─ CaseTable.jsx
│  │  │  ├─ CaseFilter.jsx
│  │  │  ├─ CaseSummary.jsx
│  │  │  ├─ CaseStatusBar.jsx
│  │  │  └─ DuplicateWarning.jsx
│  │  │
│  │  ├─ upload/
│  │  │  ├─ EvidenceUploadBox.jsx
│  │  │  ├─ EvidencePreview.jsx
│  │  │  ├─ UploadProgress.jsx
│  │  │  └─ EvidenceList.jsx
│  │  │
│  │  ├─ analysis/
│  │  │  ├─ AnalysisStatus.jsx
│  │  │  ├─ DamageImageViewer.jsx
│  │  │  ├─ DetectionOverlay.jsx
│  │  │  ├─ ModelResultCard.jsx
│  │  │  ├─ ConfidenceBadge.jsx
│  │  │  └─ AnalysisRationale.jsx
│  │  │
│  │  ├─ review/
│  │  │  ├─ GradeReviewForm.jsx
│  │  │  ├─ FieldVisitForm.jsx
│  │  │  ├─ ReviewDecisionPanel.jsx
│  │  │  └─ RevisionReasonInput.jsx
│  │  │
│  │  ├─ severity/
│  │  │  ├─ SeverityScore.jsx
│  │  │  ├─ SeverityFactorChart.jsx
│  │  │  └─ RecoveryPriorityCard.jsx
│  │  │
│  │  ├─ grant/
│  │  │  ├─ GrantCalculation.jsx
│  │  │  ├─ GrantBreakdown.jsx
│  │  │  ├─ DuplicateBenefitCheck.jsx
│  │  │  └─ GrantDecisionForm.jsx
│  │  │
│  │  ├─ report/
│  │  │  ├─ ReportPreview.jsx
│  │  │  ├─ ReportVersionList.jsx
│  │  │  └─ ReportDownloadButton.jsx
│  │  │
│  │  ├─ audit/
│  │  │  └─ AuditTimeline.jsx
│  │  │
│  │  ├─ chat/
│  │  │  ├─ ChatBox.jsx
│  │  │  ├─ ChatBubble.jsx
│  │  │  ├─ ChatInput.jsx
│  │  │  └─ SuggestionChips.jsx
│  │  │
│  │  ├─ alarm/
│  │  │  ├─ AlarmButton.jsx
│  │  │  ├─ AlarmList.jsx
│  │  │  └─ AlarmItem.jsx
│  │  │
│  │  └─ settings/
│  │     ├─ SettingMenu.jsx
│  │     ├─ AccountForm.jsx
│  │     ├─ PolicyVersionTable.jsx
│  │     └─ ModelVersionTable.jsx
│  │
│  ├─ pages/
│  │  ├─ LoginPage.jsx
│  │  ├─ DashboardPage.jsx
│  │  ├─ CaseListPage.jsx
│  │  ├─ CaseCreatePage.jsx
│  │  ├─ CaseDetailPage.jsx
│  │  ├─ AnalysisReviewPage.jsx
│  │  ├─ SeverityPage.jsx
│  │  ├─ RecoveryPage.jsx
│  │  ├─ GrantPage.jsx
│  │  ├─ ReportPage.jsx
│  │  ├─ HistoryPage.jsx
│  │  ├─ QuestionPage.jsx
│  │  ├─ SettingsPage.jsx
│  │  └─ NotFoundPage.jsx
│  │
│  ├─ routes/
│  │  ├─ AppRoutes.jsx
│  │  └─ routeConfig.js
│  │
│  ├─ data/
│  │  ├─ dummyUser.js
│  │  ├─ dummyCases.js
│  │  ├─ dummyAnalysis.js
│  │  ├─ dummyGrant.js
│  │  └─ dummyDashboard.js
│  │
│  ├─ hooks/
│  │  ├─ useAuth.js
│  │  ├─ useSidebar.js
│  │  ├─ useLanguage.js
│  │  ├─ usePagination.js
│  │  ├─ useFileUpload.js
│  │  └─ usePolling.js
│  │
│  ├─ services/
│  │  ├─ apiClient.js
│  │  ├─ authApi.js
│  │  ├─ dashboardApi.js
│  │  ├─ caseApi.js
│  │  ├─ fileApi.js
│  │  ├─ analysisApi.js
│  │  ├─ reviewApi.js
│  │  ├─ severityApi.js
│  │  ├─ recoveryApi.js
│  │  ├─ grantApi.js
│  │  ├─ reportApi.js
│  │  ├─ historyApi.js
│  │  ├─ chatApi.js
│  │  ├─ regulationApi.js
│  │  └─ alarmApi.js
│  │
│  ├─ store/
│  │  ├─ authStore.js
│  │  ├─ uiStore.js
│  │  └─ caseStore.js
│  │
│  ├─ constants/
│  │  ├─ routes.js
│  │  ├─ caseStatus.js
│  │  ├─ userRoles.js
│  │  └─ damageGrades.js
│  │
│  ├─ utils/
│  │  ├─ formatDate.js
│  │  ├─ formatCurrency.js
│  │  ├─ fileValidation.js
│  │  └─ errorMessage.js
│  │
│  ├─ styles/
│  │  ├─ global.css
│  │  ├─ variables.css
│  │  ├─ layout.css
│  │  ├─ auth.css
│  │  ├─ dashboard.css
│  │  ├─ case.css
│  │  ├─ analysis.css
│  │  ├─ severity.css
│  │  ├─ grant.css
│  │  ├─ report.css
│  │  ├─ chat.css
│  │  └─ settings.css
│  │
│  ├─ App.jsx
│  └─ main.jsx
│
├─ .env.example
├─ eslint.config.js
├─ index.html
├─ package.json
└─ vite.config.js
```

### Frontend 폴더 역할

| 폴더 | 역할 |
|---|---|
| `pages` | URL에 대응하는 실제 화면 |
| `components` | 여러 화면에서 재사용하는 UI 조각 |
| `routes` | URL, 접근 권한, 레이아웃 연결 |
| `data` | 백엔드 연결 전 사용하는 임시 데이터 |
| `hooks` | 로그인, 업로드, 폴링 등의 공통 React 로직 |
| `services` | FastAPI 호출만 담당 |
| `store` | 여러 화면이 공유하는 클라이언트 상태 |
| `constants` | 상태값·권한·라우트 문자열 |
| `utils` | 날짜·금액 표시와 파일 검증 |
| `styles` | 공통 및 도메인별 CSS |

### Frontend 데이터 관리 원칙

- API 호출은 컴포넌트에서 직접 `fetch`하지 않고 `services`를 사용한다.
- 서버 데이터는 API 응답을 기준으로 하며, 지원금과 심각도 공식 결과를
  프론트에서 임의로 확정하지 않는다.
- `data/dummy*.js`는 Mock API가 준비되면 제거한다.
- 인증 토큰 처리는 `apiClient.js` 한곳에서 담당한다.
- AI 분석 중 상태 갱신은 `usePolling.js`로 관리한다.

---

## 3. Frontend URL 구조

```text
/login
/
/cases
/cases/new
/cases/:caseId
/cases/:caseId/analysis
/cases/:caseId/severity
/cases/:caseId/recovery
/cases/:caseId/grant
/cases/:caseId/report
/history
/questions
/settings
/*
```

| URL | Page | 설명 |
|---|---|---|
| `/login` | `LoginPage` | 로그인 |
| `/` | `DashboardPage` | 전체 처리 현황 |
| `/cases` | `CaseListPage` | 피해 신고 목록 |
| `/cases/new` | `CaseCreatePage` | 신규 피해 신고 |
| `/cases/:caseId` | `CaseDetailPage` | 사건 종합 정보 |
| `/cases/:caseId/analysis` | `AnalysisReviewPage` | AI 분석 및 등급 검토 |
| `/cases/:caseId/severity` | `SeverityPage` | 심각도 확인 |
| `/cases/:caseId/recovery` | `RecoveryPage` | 복구계획 관리 |
| `/cases/:caseId/grant` | `GrantPage` | 지원금 계산·검토 |
| `/cases/:caseId/report` | `ReportPage` | 보고서 생성·다운로드 |
| `/history` | `HistoryPage` | 처리 및 감사 이력 |
| `/questions` | `QuestionPage` | 규정 질의 챗봇 |
| `/settings` | `SettingsPage` | 계정·정책·모델 설정 |

로그인을 제외한 화면은 `ProtectedRoute`로 보호한다. 페이지별로 역할 권한을
추가 검사한다.

---

## 4. Backend 구조

FastAPI는 기능별 모듈을 분리하고, 각 모듈 안에서 HTTP 처리, 업무 로직,
DB 접근을 구분한다.

```text
backend/
├─ app/
│  ├─ main.py
│  │
│  ├─ core/
│  │  ├─ config.py
│  │  ├─ database.py
│  │  ├─ security.py
│  │  ├─ permissions.py
│  │  ├─ exceptions.py
│  │  ├─ logging.py
│  │  └─ middleware.py
│  │
│  ├─ api/
│  │  ├─ dependencies.py
│  │  └─ v1/
│  │     ├─ router.py
│  │     └─ endpoints/
│  │        ├─ auth.py
│  │        ├─ dashboard.py
│  │        ├─ cases.py
│  │        ├─ files.py
│  │        ├─ analysis.py
│  │        ├─ reviews.py
│  │        ├─ severity.py
│  │        ├─ recovery.py
│  │        ├─ grants.py
│  │        ├─ reports.py
│  │        ├─ history.py
│  │        ├─ chat.py
│  │        ├─ regulations.py
│  │        ├─ languages.py
│  │        └─ alarms.py
│  │
│  ├─ models/
│  │  ├─ base.py
│  │  ├─ user.py
│  │  ├─ case.py
│  │  ├─ evidence_file.py
│  │  ├─ duplicate_check.py
│  │  ├─ analysis.py
│  │  ├─ review.py
│  │  ├─ severity.py
│  │  ├─ recovery.py
│  │  ├─ grant.py
│  │  ├─ report.py
│  │  ├─ policy.py
│  │  ├─ alarm.py
│  │  └─ audit_log.py
│  │
│  ├─ schemas/
│  │  ├─ common.py
│  │  ├─ auth.py
│  │  ├─ dashboard.py
│  │  ├─ case.py
│  │  ├─ file.py
│  │  ├─ analysis.py
│  │  ├─ review.py
│  │  ├─ severity.py
│  │  ├─ recovery.py
│  │  ├─ grant.py
│  │  ├─ report.py
│  │  ├─ chat.py
│  │  └─ alarm.py
│  │
│  ├─ repositories/
│  │  ├─ base.py
│  │  ├─ user_repository.py
│  │  ├─ case_repository.py
│  │  ├─ file_repository.py
│  │  ├─ analysis_repository.py
│  │  ├─ grant_repository.py
│  │  └─ audit_repository.py
│  │
│  ├─ services/
│  │  ├─ auth_service.py
│  │  ├─ dashboard_service.py
│  │  ├─ case_service.py
│  │  ├─ file_service.py
│  │  ├─ duplicate_service.py
│  │  ├─ analysis_service.py
│  │  ├─ review_service.py
│  │  ├─ severity_service.py
│  │  ├─ recovery_service.py
│  │  ├─ grant_service.py
│  │  ├─ report_service.py
│  │  ├─ chat_service.py
│  │  ├─ regulation_service.py
│  │  ├─ alarm_service.py
│  │  └─ audit_service.py
│  │
│  ├─ integrations/
│  │  ├─ object_storage.py
│  │  ├─ ai_client.py
│  │  ├─ geocoding_client.py
│  │  ├─ regulation_search.py
│  │  └─ notification_client.py
│  │
│  ├─ policies/
│  │  ├─ case_state_machine.py
│  │  ├─ severity_policy.py
│  │  ├─ recovery_policy.py
│  │  └─ grant_policy.py
│  │
│  ├─ workers/
│  │  ├─ analysis_worker.py
│  │  ├─ report_worker.py
│  │  └─ notification_worker.py
│  │
│  └─ utils/
│     ├─ file_hash.py
│     ├─ pagination.py
│     └─ datetime.py
│
├─ migrations/
│  ├─ versions/
│  └─ env.py
│
├─ tests/
│  ├─ unit/
│  │  ├─ test_severity_policy.py
│  │  ├─ test_grant_policy.py
│  │  └─ test_duplicate_service.py
│  ├─ integration/
│  │  ├─ test_case_api.py
│  │  ├─ test_analysis_api.py
│  │  └─ test_grant_api.py
│  └─ conftest.py
│
├─ storage/                     로컬 개발용 파일 저장
├─ .env.example
├─ alembic.ini
├─ pyproject.toml
└─ Dockerfile
```

### Backend 계층 역할

| 계층 | 역할 |
|---|---|
| `api/endpoints` | URL, 요청 파싱, 응답 코드 |
| `schemas` | Pydantic 요청·응답 형식 |
| `services` | 업무 순서와 트랜잭션 |
| `repositories` | 데이터베이스 조회·저장 |
| `models` | SQLAlchemy 테이블 모델 |
| `policies` | 심각도·지원금·상태 전이 규칙 |
| `integrations` | AI, 스토리지, 지도, 외부 기관 연결 |
| `workers` | 오래 걸리는 비동기 작업 |
| `core` | 설정, 보안, DB, 공통 예외 |

### Backend 호출 순서

```text
React
  → FastAPI endpoint
  → Pydantic schema 검증
  → 로그인·권한 확인
  → service 업무 처리
  → policy 규칙 계산
  → repository DB 저장
  → audit service 이력 기록
  → response schema 반환
```

`endpoint`에서 지원금이나 심각도를 직접 계산하지 않는다. 계산은 `policies`,
처리 순서는 `services`, DB 접근은 `repositories`가 담당한다.

---

## 5. API 구조

### 기본·인증

```http
GET    /
GET    /health
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
```

### 대시보드

```http
GET    /api/v1/dashboard/summary
GET    /api/v1/dashboard/stages
GET    /api/v1/dashboard/regions
```

### 피해 사건

```http
POST   /api/v1/cases
GET    /api/v1/cases
GET    /api/v1/cases/{case_id}
PATCH  /api/v1/cases/{case_id}
POST   /api/v1/cases/{case_id}/submit
POST   /api/v1/cases/{case_id}/cancel
GET    /api/v1/cases/{case_id}/duplicates
```

### 증빙 파일

기존의 단순 `/files`보다 사건 소속이 URL에서 드러나도록 구성한다.

```http
POST   /api/v1/cases/{case_id}/files
GET    /api/v1/cases/{case_id}/files
GET    /api/v1/files/{file_id}
GET    /api/v1/files/{file_id}/download
DELETE /api/v1/files/{file_id}
```

### AI 분석

```http
POST   /api/v1/cases/{case_id}/analysis-jobs
GET    /api/v1/analysis-jobs/{job_id}
GET    /api/v1/cases/{case_id}/analysis-results
GET    /api/v1/analysis-results/{analysis_id}
GET    /api/v1/analysis-results/{analysis_id}/highlights
```

`POST /analysis-jobs`는 오래 걸리는 AI 작업을 시작하고 `202 Accepted`와
`job_id`를 반환한다. React는 작업 조회 API를 주기적으로 호출한다.

### 담당자 검토

```http
POST   /api/v1/cases/{case_id}/review-decisions
GET    /api/v1/cases/{case_id}/review-decisions
GET    /api/v1/review-decisions/{review_id}
```

검토 요청에는 `APPROVE`, `MODIFY`, `REQUEST_EVIDENCE`,
`REQUEST_FIELD_VISIT` 중 하나와 사유를 넣는다.

### 심각도·복구

```http
POST   /api/v1/cases/{case_id}/severity-assessments
GET    /api/v1/cases/{case_id}/severity-assessments/latest
POST   /api/v1/cases/{case_id}/recovery-plans
GET    /api/v1/cases/{case_id}/recovery-plans
PATCH  /api/v1/recovery-plans/{plan_id}
```

### 지원금

```http
POST   /api/v1/cases/{case_id}/grant-calculations
GET    /api/v1/cases/{case_id}/grant-calculations/latest
POST   /api/v1/cases/{case_id}/grant-decisions
GET    /api/v1/cases/{case_id}/grant-decisions
```

지원금 계산과 최종 승인/반려를 다른 API로 분리한다.

### 보고서·이력

```http
POST   /api/v1/cases/{case_id}/reports
GET    /api/v1/cases/{case_id}/reports
GET    /api/v1/reports/{report_id}
GET    /api/v1/reports/{report_id}/download
GET    /api/v1/cases/{case_id}/history
GET    /api/v1/cases/{case_id}/audit-logs
```

### 챗봇·규정 검색

```http
POST   /api/v1/chat/messages
POST   /api/v1/regulations/search
GET    /api/v1/languages
```

챗봇 답변은 사용한 규정 문서 ID와 조항을 함께 반환한다.

### 알림

```http
POST   /api/v1/alarms
GET    /api/v1/alarms
PATCH  /api/v1/alarms/{alarm_id}
DELETE /api/v1/alarms/{alarm_id}
```

---

## 6. Page와 API 연결

| React Page | 사용하는 주요 API |
|---|---|
| `LoginPage` | `POST /auth/login`, `GET /auth/me` |
| `DashboardPage` | `GET /dashboard/*` |
| `CaseListPage` | `GET /cases` |
| `CaseCreatePage` | `POST /cases`, `POST /cases/{id}/files` |
| `CaseDetailPage` | `GET /cases/{id}`, `GET /cases/{id}/history` |
| `AnalysisReviewPage` | 분석 작업·결과·검토 API |
| `SeverityPage` | 심각도 산정 API |
| `RecoveryPage` | 복구계획 API |
| `GrantPage` | 지원금 계산·승인 API |
| `ReportPage` | 보고서 생성·다운로드 API |
| `HistoryPage` | 사건 이력·감사 로그 API |
| `QuestionPage` | 채팅·규정 검색 API |
| `SettingsPage` | 사용자·정책·모델 설정 API |

---

## 7. 환경변수

### Frontend `.env.example`

```dotenv
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_APP_NAME=AI 재난 피해 통합관리
VITE_ENABLE_MOCK=true
```

### Backend `.env.example`

```dotenv
APP_NAME=AI 재난 피해 통합관리 API
APP_ENV=development
API_V1_PREFIX=/api/v1
DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/disaster
JWT_SECRET=change-me
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=http://localhost:5173
STORAGE_ENDPOINT=
STORAGE_BUCKET=disaster-evidence
AI_SERVICE_URL=
REGULATION_SEARCH_URL=
```

실제 비밀번호와 키가 들어간 `.env`는 Git에 올리지 않는다.

---

## 8. 초기 개발 범위

### 1차 MVP

- 로그인 Mock 또는 개발용 계정
- 대시보드
- 피해 사건 CRUD
- 증빙 파일 업로드
- Mock AI 분석
- 담당자 등급 확정
- 심각도 계산
- 지원금 계산
- HTML/PDF 보고서
- 사건 이력

### 2차

- 실제 YOLO·ConvNeXt·VLM 연결
- PostgreSQL/PostGIS와 지도
- 규정 RAG 검색
- 알림
- 현장 조사 모바일 화면
- 외부 보험·지원 이력 연동

### 3차

- 전자결재와 공공 SSO
- 공식 문서 시스템 연계
- 다기관 제출 양식
- 실시간 피해 현황
- 모델 성능·편향 모니터링

---

## 9. 구현 규칙

1. 프론트엔드의 폴더명은 실제 생성 시 소문자 `frontend`, 백엔드는 `backend`로
   통일한다.
2. React 컴포넌트는 화면 표현에 집중하고 API 호출은 `services`에 둔다.
3. FastAPI endpoint는 얇게 유지하고 업무 로직은 `services`에 둔다.
4. 상태값과 피해등급은 프론트·백엔드에 문자열로 흩어놓지 않는다.
5. AI 제안값과 담당자 확정값을 덮어쓰지 않고 별도로 저장한다.
6. 정책 계산 결과에는 항상 정책 버전과 세부 계산 근거를 저장한다.
7. 파일은 DB에 직접 넣지 않고 저장소에 보관하며 DB에는 메타데이터를 저장한다.
8. 변경, 승인, 다운로드 행위는 감사 로그에 기록한다.
9. AI 분석과 보고서 생성은 비동기 작업으로 설계한다.
10. 기능 구현 전 API 명세와 DB ERD를 먼저 합의한다.
