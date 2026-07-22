import { create } from 'zustand';
import { createInitialWorkflow } from '../mocks/workflow';

const updateCaseWorkflow = (state, caseId, changes) => ({
  workflows: {
    ...state.workflows,
    [caseId]: {
      ...(state.workflows[caseId] || createInitialWorkflow()),
      ...changes,
    },
  },
});

export const useWorkflowStore = create((set) => ({
  workflows: {},
  saveSeverity: (caseId, scores, reason) => set((state) =>
    updateCaseWorkflow(state, caseId, { severityScores: scores, severityReason: reason })),
  saveSupport: (caseId, amount, reason) => set((state) =>
    updateCaseWorkflow(state, caseId, { supportAmount: amount, supportReason: reason })),
  submitApproval: (caseId, approval) => set((state) =>
    updateCaseWorkflow(state, caseId, {
      approvalStatus: approval.status,
      approvalReason: approval.reason,
      approvalAmount: approval.amount,
    })),
}));
