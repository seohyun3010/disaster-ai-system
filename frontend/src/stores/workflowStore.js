import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createInitialWorkflow } from '../mocks/workflow';
import { getCurrentUser } from '../mocks/currentUser';
import { DELETED_DEMO_CASE_IDS } from '../mocks/cases';

const DELETED_DEMO_CASE_ID_SET = new Set(DELETED_DEMO_CASE_IDS);

const sanitizeRecordMap = (records = {}) => Object.fromEntries(
  Object.entries(records).filter(([caseId]) => !DELETED_DEMO_CASE_ID_SET.has(caseId)),
);

const formatApprovedAt = () => {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const updateCaseWorkflow = (state, caseId, changes) => ({
  workflows: {
    ...state.workflows,
    [caseId]: {
      ...(state.workflows[caseId] || createInitialWorkflow()),
      ...changes,
    },
  },
});

export const useWorkflowStore = create(
  persist(
    (set) => ({
      workflows: {},
      deletedApprovalHistoryIds: [],
      unlockStage: (caseId, stage) => set((state) => {
        const current = state.workflows[caseId] || createInitialWorkflow();
        return updateCaseWorkflow(state, caseId, {
          maxUnlockedStage: Math.max(current.maxUnlockedStage || 1, stage),
        });
      }),
      saveSeverityResult: (caseId, result) => set((state) => {
        const current = state.workflows[caseId] || createInitialWorkflow();
        const appliedGrade = result?.applied_damage_grade || '피해등급 미확인';
        const urgencyScore = result?.recovery_urgency_score;
        return updateCaseWorkflow(state, caseId, {
          severityResult: result,
          recoveryUrgencyScore: urgencyScore ?? null,
          severityReason: urgencyScore == null
            ? ''
            : `확정 피해등급 ${appliedGrade} 반영으로 복구 긴급도 ${urgencyScore}점 산정`,
          severityConfirmed: true,
          maxUnlockedStage: Math.max(current.maxUnlockedStage || 1, 4),
        });
      }),
      saveSupport: (caseId, amount, reason) => set((state) => {
        const current = state.workflows[caseId] || createInitialWorkflow();
        const subsidy = amount && typeof amount === 'object' ? amount : null;
        const confirmedAmount = subsidy
          ? Number(subsidy.confirmed_amount ?? subsidy.estimated_amount ?? 0)
          : Number(amount || 0);
        return updateCaseWorkflow(state, caseId, {
          supportAmount: confirmedAmount,
          supportEstimatedAmount: subsidy?.estimated_amount ?? current.supportEstimatedAmount ?? null,
          supportResult: subsidy || current.supportResult || null,
          supportReason: String(reason || '').trim(),
          supportConfirmed: true,
          maxUnlockedStage: Math.max(current.maxUnlockedStage || 1, 5),
        });
      }),
      clearSeverityResult: (caseId) => set((state) => {
        const current = state.workflows[caseId] || createInitialWorkflow();
        return updateCaseWorkflow(state, caseId, {
          severityResult: null,
          recoveryUrgencyScore: null,
          severityReason: '',
          severityConfirmed: false,
          maxUnlockedStage: Math.min(current.maxUnlockedStage || 1, 3),
        });
      }),
      hydrateSupport: (caseId, subsidy) => set((state) => {
        if (!subsidy) return state;
        const current = state.workflows[caseId] || createInitialWorkflow();
        const confirmed = ['CONFIRMED', 'APPROVED'].includes(subsidy.status);
        return updateCaseWorkflow(state, caseId, {
          supportAmount: Number(subsidy.confirmed_amount ?? subsidy.estimated_amount ?? 0),
          supportEstimatedAmount: subsidy.estimated_amount ?? null,
          supportResult: subsidy,
          supportConfirmed: confirmed,
          maxUnlockedStage: confirmed
            ? Math.max(current.maxUnlockedStage || 1, 5)
            : Math.min(current.maxUnlockedStage || 1, 4),
          approvalStatus: confirmed ? current.approvalStatus : '',
          approvalReason: confirmed ? current.approvalReason : '',
          approvalAmount: confirmed ? current.approvalAmount : 0,
        });
      }),
      resetDownstream: (caseId) => set((state) => updateCaseWorkflow(state, caseId, {
        severityResult: null,
        recoveryUrgencyScore: null,
        severityReason: '',
        severityConfirmed: false,
        supportAmount: 0,
        supportEstimatedAmount: null,
        supportResult: null,
        supportReason: '',
        supportConfirmed: false,
        approvalStatus: '',
        approvalReason: '',
        approvalAmount: 0,
        approvedAt: null,
        approvedBy: null,
        maxUnlockedStage: 3,
      })),
      submitApproval: (caseId, approval) => set((state) => ({
        ...updateCaseWorkflow(state, caseId, {
          approvalStatus: approval.status,
          approvalReason: approval.reason,
          approvalAmount: approval.amount,
          approvedAt: formatApprovedAt(),
          approvedBy: { ...getCurrentUser() },
          maxUnlockedStage: Math.max(
            state.workflows[caseId]?.maxUnlockedStage || 1,
            6,
          ),
        }),
        deletedApprovalHistoryIds: state.deletedApprovalHistoryIds.filter((id) => id !== caseId),
      })),
      deleteWorkflow: (caseId) => set((state) => {
        const workflows = { ...state.workflows };
        delete workflows[caseId];
        return {
          workflows,
          deletedApprovalHistoryIds: state.deletedApprovalHistoryIds.filter((id) => id !== caseId),
        };
      }),
    }),
    {
      name: 'disaster-recovery.workflows',
      version: 3,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted) => ({
        ...persisted,
        workflows: sanitizeRecordMap(persisted?.workflows),
        deletedApprovalHistoryIds: (persisted?.deletedApprovalHistoryIds || [])
          .filter((caseId) => !DELETED_DEMO_CASE_ID_SET.has(caseId)),
      }),
      merge: (persisted, current) => ({
        ...current,
        ...persisted,
        workflows: sanitizeRecordMap(persisted?.workflows),
        deletedApprovalHistoryIds: (persisted?.deletedApprovalHistoryIds || [])
          .filter((caseId) => !DELETED_DEMO_CASE_ID_SET.has(caseId)),
      }),
    },
  ),
);
