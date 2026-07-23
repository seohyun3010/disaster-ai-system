import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createInitialWorkflow } from '../mocks/workflow';
import { getCurrentUser } from '../mocks/currentUser';

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
      saveSeverity: (caseId, scores, reason) => set((state) => updateCaseWorkflow(state, caseId, { severityScores: scores, severityReason: reason })),
      saveSupport: (caseId, amount, reason) => set((state) => updateCaseWorkflow(state, caseId, { supportAmount: amount, supportReason: reason })),
      submitApproval: (caseId, approval) => set((state) => ({
        ...updateCaseWorkflow(state, caseId, {
          approvalStatus: approval.status,
          approvalReason: approval.reason,
          approvalAmount: approval.amount,
          approvedAt: formatApprovedAt(),
          approvedBy: { ...getCurrentUser() },
        }),
        deletedApprovalHistoryIds: state.deletedApprovalHistoryIds.filter((id) => id !== caseId),
      })),
      deleteApprovalHistory: (caseId) => set((state) => ({
        deletedApprovalHistoryIds: state.deletedApprovalHistoryIds.includes(caseId)
          ? state.deletedApprovalHistoryIds
          : [...state.deletedApprovalHistoryIds, caseId],
      })),
    }),
    { name: 'disaster-recovery.workflows', storage: createJSONStorage(() => localStorage) },
  ),
);
