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
      saveSeverity: (caseId, scores, reason) => set((state) => {
        const current = state.workflows[caseId] || createInitialWorkflow();
        return updateCaseWorkflow(state, caseId, {
          severityScores: scores,
          severityReason: reason,
          severityConfirmed: true,
          maxUnlockedStage: Math.max(current.maxUnlockedStage || 1, 4),
        });
      }),
      saveSupport: (caseId, amount, reason) => set((state) => {
        const current = state.workflows[caseId] || createInitialWorkflow();
        return updateCaseWorkflow(state, caseId, {
          supportAmount: amount,
          supportReason: reason,
          supportConfirmed: true,
          maxUnlockedStage: Math.max(current.maxUnlockedStage || 1, 5),
        });
      }),
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
