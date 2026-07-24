import { useQuery } from '@tanstack/react-query';
import { getMe } from '../api/authApi';
import { getCases, getCaseDetail } from '../api/caseApi';
import { getCaseAnalysisResult } from '../api/analysisApi';
import { getReport } from '../api/reportApi';
import { QUERY_KEYS } from '../constants/queryKeys';

export const useMeQuery = () =>
  useQuery({ queryKey: QUERY_KEYS.auth.me, queryFn: getMe });

export const useCasesQuery = (params = {}) =>
  useQuery({
    queryKey: QUERY_KEYS.cases.list(params),
    queryFn: () => getCases(params),
  });

export const useCaseDetailQuery = (caseId) =>
  useQuery({
    queryKey: QUERY_KEYS.cases.detail(caseId),
    queryFn: () => getCaseDetail(caseId),
    enabled: Boolean(caseId),
  });

export const useAiResultQuery = (caseId) =>
  useQuery({
    queryKey: QUERY_KEYS.ai.result(caseId),
    queryFn: () => getCaseAnalysisResult(caseId),
    enabled: Boolean(caseId),
  });

export const useReportQuery = (reportId) =>
  useQuery({
    queryKey: QUERY_KEYS.report.detail(reportId),
    queryFn: () => getReport(reportId),
    enabled: Boolean(reportId),
  });
