export const API_PATHS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
    PERMISSIONS: '/api/auth/permissions',
  },
  CASES: {
    LIST: '/api/cases',
    DETAIL: (caseId) => `/api/cases/${caseId}`,
    DUPLICATE: (caseId) => `/api/cases/${caseId}/duplicate`,
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
    CALCULATE: '/api/severity/calculate',
    SEVERITY: (caseId) => `/api/severity/${caseId}`,
    POLICY_VERSIONS: '/api/rag/policies/versions',
  },
  SUBSIDY: {
    CALCULATE: '/api/subsidy/calculate',
    DUPLICATE: (caseId) => `/api/subsidy/duplicate/${caseId}`,
    CONFIRM: '/api/subsidy/confirm',
    HISTORY: (caseId) => `/api/subsidy/${caseId}/history`,
  },
  REPORT: {
    GENERATE: '/api/report/generate',
    DETAIL: (reportId) => `/api/report/${reportId}`,
    DOWNLOAD: (reportId) => `/api/report/download/${reportId}`,
  },
};
