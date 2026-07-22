import { useQuery } from '@tanstack/react-query';
import { getMe } from '../api/authApi';
import { getCases, getCaseDetail } from '../api/caseApi';
import { getAiResult } from '../api/aiApi';
import { getDamageStatistics } from '../api/statisticsApi';
import { getDisasterMap } from '../api/mapApi';
import { getDashboard } from '../api/dashboardApi';
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
    queryFn: () => getAiResult(caseId),
    enabled: Boolean(caseId),
  });

export const useDamageStatisticsQuery = (params = {}) =>
  useQuery({
    queryKey: QUERY_KEYS.statistics.damage(params),
    queryFn: () => getDamageStatistics(params),
  });

export const useDisasterMapQuery = (params = {}) =>
  useQuery({
    queryKey: QUERY_KEYS.map.disaster(params),
    queryFn: () => getDisasterMap(params),
  });

export const useDashboardQuery = (params = {}) =>
  useQuery({
    queryKey: QUERY_KEYS.dashboard(params),
    queryFn: () => getDashboard(params),
  });

export const useReportQuery = (reportId) =>
  useQuery({
    queryKey: QUERY_KEYS.report.detail(reportId),
    queryFn: () => getReport(reportId),
    enabled: Boolean(reportId),
  });
