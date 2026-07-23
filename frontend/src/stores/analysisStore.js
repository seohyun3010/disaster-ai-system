import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getAnalysisResult, getAnalysisStatus, requestAnalysis } from '../api/analysisApi';
import { getCurrentUser } from '../mocks/currentUser';

const initialAnalysis = { status: 'idle', jobId: null, result: null, error: null, stage: null, reviewStatus: '검토 전', reviewReason: '', requestedAt: null, completedAt: null, reviewedAt: null, reviewedBy: null };
const formatReviewedAt = () => {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const restorePersistedAnalyses = (analyses = {}) => Object.fromEntries(
  Object.entries(analyses).map(([caseId, analysis]) => [
    caseId,
    analysis.status === 'failed' && analysis.jobId
      ? { ...analysis, status: 'queued', error: null, stage: 'Restoring mock analysis job' }
      : analysis,
  ]),
);

export const useAnalysisStore = create(
  persist(
    (set, get) => ({
      analyses: {},
      getAnalysis: (caseId) => get().analyses[caseId] || initialAnalysis,
      requestAnalysis: async (caseId) => {
        const current = get().analyses[caseId];
        if (current && ['queued', 'processing'].includes(current.status)) return;
        set((state) => ({ analyses: { ...state.analyses, [caseId]: { ...initialAnalysis, status: 'queued' } } }));
        try {
          const job = await requestAnalysis(caseId);
          set((state) => ({ analyses: { ...state.analyses, [caseId]: { ...state.analyses[caseId], jobId: job.jobId, requestedAt: job.requestedAt } } }));
        } catch (error) {
          set((state) => ({ analyses: { ...state.analyses, [caseId]: { ...state.analyses[caseId], status: 'failed', error: error.message || 'AI 분석 중 오류가 발생했습니다.' } } }));
        }
      },
      refreshAnalysis: async (caseId) => {
        const current = get().analyses[caseId];
        if (!current?.jobId || !['queued', 'processing'].includes(current.status)) return;
        try {
          const statusResponse = await getAnalysisStatus(current.jobId);
          const result = statusResponse.status === 'completed' ? await getAnalysisResult(current.jobId) : current.result;
          set((state) => ({ analyses: { ...state.analyses, [caseId]: { ...state.analyses[caseId], status: statusResponse.status, stage: statusResponse.stage, result, completedAt: result?.completedAt || null } } }));
        } catch (error) {
          set((state) => ({ analyses: { ...state.analyses, [caseId]: { ...state.analyses[caseId], status: 'failed', error: error.message || '분석 상태를 확인하지 못했습니다.' } } }));
        }
      },
      submitReview: (caseId, review) => set((state) => ({ analyses: { ...state.analyses, [caseId]: { ...state.analyses[caseId], reviewStatus: review.status, reviewReason: review.reason || '', reviewedGrade: review.grade || null, reviewedBy: { ...getCurrentUser() }, reviewedAt: formatReviewedAt() } } })),
    }),
    {
      name: 'disaster-recovery.analyses',
      storage: createJSONStorage(() => localStorage),
      merge: (persisted, current) => ({
        ...current,
        ...persisted,
        analyses: restorePersistedAnalyses(persisted?.analyses),
      }),
    },
  ),
);
