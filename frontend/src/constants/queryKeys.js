export const QUERY_KEYS = {
  auth: {
    me: ['auth', 'me'],
  },
  cases: {
    all: ['cases'],
    list: (params) => ['cases', 'list', params],
    detail: (caseId) => ['cases', 'detail', caseId],
  },
  ai: {
    result: (caseId) => ['ai', 'result', caseId],
  },
  report: {
    detail: (reportId) => ['report', reportId],
  },
};
