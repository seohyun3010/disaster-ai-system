import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getAnalysisResult, getAnalysisStatus, requestAnalysis } from '../api/analysisApi';
import { formatOfficerName, getCurrentUser } from '../mocks/currentUser';
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
  reviewHistory: [],
};
const formatReviewedAt = () => {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const appendReviewHistory = (history = [], event) => (
  history.some((entry) => entry.dedupeKey === event.dedupeKey)
    ? history
    : [...history, event]
);

const createReviewHistoryEvent = ({ type, title, description, dedupeKey }) => ({
  id: `${type}-${Date.now()}`,
  type,
  title,
  description,
  actor: formatOfficerName(getCurrentUser()),
  occurred_at: new Date().toISOString(),
  dedupeKey,
});

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
        set((state) => ({ analyses: { ...state.analyses, [caseId]: { ...initialAnalysis, reviewHistory: current?.reviewHistory || [], status: 'queued' } } }));
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
        if (isHold && !reason) return state;
        const resolvesHold = current.reviewStatus === '보류' && ['승인', '수정 승인', '반려'].includes(review.status);
        const previousGrade = current.reviewedGrade
          || current.result?.recommendedGrade
          || review.previousGrade
          || review.grade
          || '-';
        let reviewHistory = current.reviewHistory || [];

        if (isHold) {
          reviewHistory = appendReviewHistory(reviewHistory, createReviewHistoryEvent({
            type: 'review_held',
            title: '피해등급 검토 보류',
            description: `기존 등급: ${previousGrade} · 보류 사유: ${reason}`,
            dedupeKey: `review_held:${reviewedAt}:${previousGrade}:${reason}`,
          }));
        }

        if (resolvesHold) {
          const isRejected = review.status === '반려';
          reviewHistory = appendReviewHistory(reviewHistory, createReviewHistoryEvent({
            type: isRejected ? 'review_rejected' : 'review_approved',
            title: isRejected ? '피해등급 검토 반려' : '피해등급 검토 승인',
            description: `${isRejected ? '반려' : '승인'} 등급: ${review.grade || previousGrade}${isRejected ? ` · 반려 사유: ${reason || '사유 미입력'}` : ''}`,
            dedupeKey: `review_resolved:${reviewedAt}:${review.status}:${review.grade || previousGrade}`,
          }));
        }
        const nextAnalysis = {
          ...current,
          reviewStatus: review.status,
          reviewReason: reason,
          reviewedGrade: review.grade || null,
          reviewedBy: { ...getCurrentUser() },
          reviewedAt,
          reviewHistory,
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
      startReview: (caseId, grade) => set((state) => {
        const current = state.analyses[caseId];
        if (!current || !['보류', '수정 승인'].includes(current.reviewStatus)) return state;
        const currentGrade = grade || current.reviewedGrade || current.result?.recommendedGrade || '-';
        const reviewHistory = appendReviewHistory(
          current.reviewHistory,
          createReviewHistoryEvent({
            type: 'review_restarted',
            title: '피해등급 재검토',
            description: `현재 수정 등급: ${currentGrade}`,
            dedupeKey: `review_restarted:${current.reviewedAt || current.heldAt}:${currentGrade}`,
          }),
        );
        if (reviewHistory === current.reviewHistory) return state;
        return {
          analyses: {
            ...state.analyses,
            [caseId]: { ...current, reviewHistory },
          },
        };
      }),
      confirmHeldReview: (caseId, review) => set((state) => {
        const current = state.analyses[caseId] || initialAnalysis;
        const reviewedAt = formatReviewedAt();
        const reason = review.reason?.trim() || '';
        if (!reason) return state;
        const previousGrade = current.reviewedGrade || current.result?.recommendedGrade || '-';
        const nextGrade = review.grade || previousGrade;
        let reviewHistory = current.reviewHistory || [];

        if (nextGrade !== previousGrade) {
          reviewHistory = appendReviewHistory(reviewHistory, createReviewHistoryEvent({
            type: 'grade_changed',
            title: '피해등급 수정',
            description: `기존 등급: ${previousGrade} · 수정 등급: ${nextGrade} · 수정 사유: ${reason}`,
            dedupeKey: `grade_changed:${reviewedAt}:${previousGrade}:${nextGrade}:${reason}`,
          }));
        }

        reviewHistory = appendReviewHistory(reviewHistory, createReviewHistoryEvent({
          type: 'review_restarted',
          title: '피해등급 재검토',
          description: `현재 수정 등급: ${nextGrade}`,
          dedupeKey: `review_restarted:${reviewedAt}:${nextGrade}`,
        }));
        reviewHistory = appendReviewHistory(reviewHistory, createReviewHistoryEvent({
          type: 'review_approved',
          title: '피해등급 검토 승인',
          description: `승인 등급: ${nextGrade}`,
          dedupeKey: `review_approved:${reviewedAt}:${nextGrade}`,
        }));
        return {
          analyses: {
            ...state.analyses,
            [caseId]: {
              ...current,
              reviewStatus: '수정 승인',
              reviewReason: reason,
              reviewedGrade: nextGrade,
              reviewedBy: { ...getCurrentUser() },
              reviewedAt,
              holdReason: current.holdReason,
              heldAt: current.heldAt,
              holdFieldVerified: true,
              fieldVisitReason: reason,
              fieldVisitedAt: reviewedAt,
              holdResolvedAt: reviewedAt,
              reviewHistory,
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
