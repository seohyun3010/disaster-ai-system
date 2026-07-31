import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getAnalysisResult, getAnalysisStatus, requestAnalysis } from '../api/analysisApi';
import { getCurrentUser } from '../mocks/currentUser';
import { DELETED_DEMO_CASE_IDS } from '../mocks/cases';

const DELETED_DEMO_CASE_ID_SET = new Set(DELETED_DEMO_CASE_IDS);

const initialAnalysis = {
  status: 'idle',
  jobId: null,
  result: null,
  error: null,
  stage: null,
  reviewStatus: '검토 전',
  reviewReason: '',
  reviewedGrade: null,
  requestedAt: null,
  completedAt: null,
  reviewedAt: null,
  reviewedBy: null,
  holdReason: '',
  heldAt: null,
  holdFieldVerified: false,
  fieldVisitReason: '',
  fieldVisitedAt: null,
  holdResolvedAt: null,
};
const formatReviewedAt = () => {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const restorePersistedAnalyses = (analyses = {}) => Object.fromEntries(
  Object.entries(analyses)
    .filter(([caseId]) => !DELETED_DEMO_CASE_ID_SET.has(caseId))
    .map(([caseId, analysis]) => {
      const normalized = analysis.reviewStatus === '보류' && analysis.holdFieldVerified
        ? {
          ...analysis,
          reviewStatus: '수정 승인',
          holdResolvedAt: analysis.holdResolvedAt || analysis.fieldVisitedAt || analysis.reviewedAt,
        }
        : analysis;
      return [
        caseId,
        normalized.status === 'failed' && normalized.jobId
          ? { ...normalized, status: 'queued', error: null, stage: '분석 상태 다시 확인 중' }
          : normalized,
      ];
    }),
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
      submitReview: (caseId, review) => set((state) => {
        const current = state.analyses[caseId] || initialAnalysis;
        const reviewedAt = formatReviewedAt();
        const reason = review.reason?.trim() || '';
        const isHold = review.status === '보류';
        const resolvesHold = current.reviewStatus === '보류' && ['승인', '수정 승인'].includes(review.status);
        const nextAnalysis = {
          ...current,
          reviewStatus: review.status,
          reviewReason: reason,
          reviewedGrade: review.grade || null,
          reviewedBy: { ...getCurrentUser() },
          reviewedAt,
        };

        if (isHold) {
          Object.assign(nextAnalysis, {
            holdReason: reason,
            heldAt: reviewedAt,
            holdFieldVerified: false,
            fieldVisitReason: '',
            fieldVisitedAt: null,
            holdResolvedAt: null,
          });
        }

        if (resolvesHold) {
          Object.assign(nextAnalysis, {
            fieldVisitReason: reason,
            fieldVisitedAt: reviewedAt,
            holdFieldVerified: true,
            holdResolvedAt: reviewedAt,
          });
        }

        return {
          analyses: {
            ...state.analyses,
            [caseId]: nextAnalysis,
          },
        };
      }),
      confirmHeldReview: (caseId, review) => set((state) => {
        const current = state.analyses[caseId] || initialAnalysis;
        const reviewedAt = formatReviewedAt();
        const reason = review.reason?.trim() || '';
        return {
          analyses: {
            ...state.analyses,
            [caseId]: {
              ...current,
              reviewStatus: '수정 승인',
              reviewReason: reason,
              reviewedGrade: review.grade || current.reviewedGrade,
              reviewedBy: { ...getCurrentUser() },
              reviewedAt,
              holdFieldVerified: true,
              fieldVisitReason: reason,
              fieldVisitedAt: reviewedAt,
              holdResolvedAt: reviewedAt,
            },
          },
        };
      }),
      finalizeHeldReview: (caseId) => set((state) => {
        const current = state.analyses[caseId];
        if (!current || current.reviewStatus !== '보류' || !current.holdFieldVerified) return state;
        return {
          analyses: {
            ...state.analyses,
            [caseId]: {
              ...current,
              reviewStatus: '수정 승인',
              reviewedAt: formatReviewedAt(),
              holdResolvedAt: formatReviewedAt(),
            },
          },
        };
      }),
      deleteAnalysis: (caseId) => set((state) => {
        const analyses = { ...state.analyses };
        delete analyses[caseId];
        return { analyses };
      }),
    }),
    {
      name: 'disaster-recovery.analyses',
      version: 3,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted) => ({
        ...persisted,
        analyses: restorePersistedAnalyses(persisted?.analyses),
      }),
      merge: (persisted, current) => ({
        ...current,
        analyses: restorePersistedAnalyses(persisted?.analyses),
      }),
    },
  ),
);
