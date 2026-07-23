import { create } from 'zustand';
import {
  getAnalysisResult,
  getAnalysisStatus,
  requestAnalysis,
} from '../api/analysisApi';
import { getCurrentUser } from '../mocks/currentUser';

const initialAnalysis = {
  status: 'idle',
  jobId: null,
  result: null,
  error: null,
  stage: null,
  reviewStatus: '검토 전',
  reviewReason: '',
  requestedAt: null,
  completedAt: null,
};

export const useAnalysisStore = create((set, get) => ({
  analyses: {},
  getAnalysis: (caseId) => get().analyses[caseId] || initialAnalysis,
  requestAnalysis: async (caseId) => {
    const current = get().analyses[caseId];
    if (current && ['queued', 'processing'].includes(current.status)) return;

    set((state) => ({
      analyses: {
        ...state.analyses,
        [caseId]: { ...initialAnalysis, status: 'queued' },
      },
    }));

    try {
      const job = await requestAnalysis(caseId);
      set((state) => ({
        analyses: {
          ...state.analyses,
          [caseId]: {
            ...state.analyses[caseId],
            jobId: job.jobId,
            requestedAt: job.requestedAt,
          },
        },
      }));
    } catch (error) {
      set((state) => ({
        analyses: {
          ...state.analyses,
          [caseId]: {
            ...state.analyses[caseId],
            status: 'failed',
            error: error.message || 'AI 분석 중 오류가 발생했습니다.',
          },
        },
      }));
    }
  },
  refreshAnalysis: async (caseId) => {
    const current = get().analyses[caseId];
    if (!current?.jobId || !['queued', 'processing'].includes(current.status)) return;

    try {
      const statusResponse = await getAnalysisStatus(current.jobId);
      let result = current.result;
      if (statusResponse.status === 'completed') {
        result = await getAnalysisResult(current.jobId);
      }
      set((state) => ({
        analyses: {
          ...state.analyses,
          [caseId]: {
            ...state.analyses[caseId],
            status: statusResponse.status,
            stage: statusResponse.stage,
            result,
            completedAt: result?.completedAt || null,
          },
        },
      }));
    } catch (error) {
      set((state) => ({
        analyses: {
          ...state.analyses,
          [caseId]: {
            ...state.analyses[caseId],
            status: 'failed',
            error: error.message || '분석 상태를 확인하지 못했습니다.',
          },
        },
      }));
    }
  },
  submitReview: (caseId, review) => set((state) => ({
    analyses: {
      ...state.analyses,
      [caseId]: {
        ...state.analyses[caseId],
        reviewStatus: review.status,
        reviewReason: review.reason || '',
        reviewedGrade: review.grade || null,
        reviewedBy: { ...getCurrentUser() },
      },
    },
  })),
}));
