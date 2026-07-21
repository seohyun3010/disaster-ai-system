export const API_PATHS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
  },
  CASES: {
    LIST: '/api/cases',
    DETAIL: (caseId) => `/api/cases/${caseId}`,
    DUPLICATE: (caseId) => `/api/cases/${caseId}/duplicate`,
  },
  AI: {
    JOBS: '/api/ai/jobs',
    RESULT: (caseId) => `/api/ai/result/${caseId}`,
  },
  REVIEW: {
    APPROVE: '/api/review/approve',
    REJECT: '/api/review/reject',
  },
  SEVERITY: {
    CALCULATE: '/api/severity/calculate',
    DETAIL: (caseId) => `/api/severity/${caseId}`,
  },
  SUBSIDY: {
    CALCULATE: '/api/subsidy/calculate',
    DUPLICATE: (caseId) => `/api/subsidy/duplicate/${caseId}`,
    CONFIRM: '/api/subsidy/confirm',
  },
  STATISTICS: {
    DAMAGE: '/api/statistics/damage',
  },
  MAP: {
    DISASTER: '/api/map/disaster',
  },
  DASHBOARD: '/api/dashboard',
  REPORT: {
    GENERATE: '/api/report/generate',
    DETAIL: (reportId) => `/api/report/${reportId}`,
    DOWNLOAD: (reportId) => `/api/report/download/${reportId}`,
  },
};
