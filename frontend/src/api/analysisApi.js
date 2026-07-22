import {
  createMockAnalysisJob,
  readMockAnalysisResult,
  readMockAnalysisStatus,
} from '../mocks/analysis';

export const ANALYSIS_POLLING_INTERVAL = 500;

export const requestAnalysis = async (caseId) => createMockAnalysisJob(caseId);

export const getAnalysisStatus = async (jobId) => readMockAnalysisStatus(jobId);

export const getAnalysisResult = async (jobId) => readMockAnalysisResult(jobId);
