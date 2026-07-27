import {
  createMockAnalysisJob,
  MOCK_ANALYSIS_RESULT,
  readMockAnalysisResult,
  readMockAnalysisStatus,
} from '../mocks/analysis';

// 현재는 Mock 분석이므로 빠르게 상태 변화를 확인합니다.
export const ANALYSIS_POLLING_INTERVAL = 500;

export const requestAnalysis = async (caseId) => {
  return createMockAnalysisJob(caseId);

  /* TODO(BE): 백엔드 연동 시 위 return을 제거하고 아래 코드를 활성화합니다.
  const response = await axiosInstance.post(API_PATHS.ANALYSIS.JOBS, { caseId });
  return response.data;
  */
};

export const getAnalysisStatus = async (jobId) => {
  return readMockAnalysisStatus(jobId);

  /* TODO(BE): 백엔드 연동 시 위 return을 제거하고 아래 코드를 활성화합니다.
  const response = await axiosInstance.get(API_PATHS.ANALYSIS.STATUS(jobId));
  return response.data;
  */
};

export const getAnalysisResult = async (jobId) => {
  return readMockAnalysisResult(jobId);

  /* TODO(BE): 백엔드 연동 시 위 return을 제거하고 아래 코드를 활성화합니다.
  const response = await axiosInstance.get(API_PATHS.ANALYSIS.RESULT(jobId));
  return response.data;
  */
};

export const getCaseAnalysisResult = async () => {
  return { ...MOCK_ANALYSIS_RESULT };

  /* TODO(BE): 백엔드 연동 시 caseId 인자를 받고 아래 코드를 활성화합니다.
  const response = await axiosInstance.get(API_PATHS.ANALYSIS.CASE_RESULT(caseId));
  return response.data;
  */
};

export const saveAnalysisResult = async (_jobId, data) => {
  return { ...data, saved: true };

  /* TODO(BE): 백엔드 연동 시 아래 코드를 활성화합니다.
  const response = await axiosInstance.put(API_PATHS.ANALYSIS.RESULT(jobId), data);
  return response.data;
  */
};

export const submitAnalysisReview = async (_jobId, review) => {
  return { ...review, reviewed: true };

  /* TODO(BE): 백엔드 연동 시 아래 코드를 활성화합니다.
  const response = await axiosInstance.post(API_PATHS.ANALYSIS.REVIEW(jobId), review);
  return response.data;
  */
};

/*
TODO(BE): 백엔드 연동 시 파일 상단에 추가합니다.
import axiosInstance from './axiosInstance';
import { API_PATHS } from '../constants/apiPaths';
*/
