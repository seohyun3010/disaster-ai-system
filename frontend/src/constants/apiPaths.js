export const API_PATHS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
    PERMISSIONS: '/api/auth/permissions',
  },
  CASES: {
    LIST: '/cases',
    DETAIL: (caseId) => `/cases/${caseId}`,
    DUPLICATE: (caseId) => `/cases/${caseId}/duplicate`,
  },
  ANALYSIS: {
    JOBS: '/api/analysis/jobs',
    STATUS: (jobId) => `/api/analysis/jobs/${jobId}/status`,
    RESULT: (jobId) => `/api/analysis/jobs/${jobId}/result`,
    CASE_RESULT: (caseId) => `/api/analysis/cases/${caseId}/result`,
    REVIEW: (jobId) => `/api/analysis/jobs/${jobId}/review`,
  },
  RAG: {
    DOCUMENTS: '/api/rag/documents/search',
  },
  SEVERITY: {
    CALCULATE: (caseId) => `/cases/${caseId}/severity/calculate`,
    DETAIL: (caseId) => `/cases/${caseId}/severity`,
  },
  REVIEWS: {
    CREATE: (caseId) => `/cases/${caseId}/reviews`,
    LIST: (caseId) => `/cases/${caseId}/reviews`,
  },
  // SUBSIDY: {
  //   CALCULATE: '/api/subsidy/calculate',
  //   DUPLICATE: (caseId) => `/api/subsidy/duplicate/${caseId}`,
  //   CONFIRM: '/api/subsidy/confirm',
  //   HISTORY: (caseId) => `/api/subsidy/${caseId}/history`,
  // },
  SUBSIDY: {
    CALCULATE: (caseId) => `/subsidies/${caseId}/calculate`,
    CONFIRM: (caseId) => `/subsidies/${caseId}`,
    DETAIL: (caseId) => `/subsidies/${caseId}`,
    // DUPLICATE, HISTORY: 백엔드 미구현 (담당자 확인 필요)
  },
  REPORT: {
    // 기존 연동 전 주소는 삭제하지 않고 주석으로 보존합니다.
    // GENERATE: '/api/report/generate',
    // DETAIL: (reportId) => `/api/report/${reportId}`,
    // DOWNLOAD: (reportId) => `/api/report/download/${reportId}`,
    LIST: '/reports',
    GENERATE: (caseId) => `/reports/cases/${caseId}`,
    CASE_DETAIL: (caseId) => `/reports/cases/${caseId}`,
    DETAIL: (reportId) => `/reports/${reportId}`,
    DOWNLOAD: (reportId) => `/reports/${reportId}/download`,
  },
};
