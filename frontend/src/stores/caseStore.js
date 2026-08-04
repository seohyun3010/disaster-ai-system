import { create } from 'zustand';
import { getCaseDetail, getCases } from '../api/caseApi';
import { TOTAL_MOCK_REPORTS } from '../mocks/cases';

const getCaseIdentity = (item) => item.frontendKey || item.id || String(item.case_id);
const matchesCaseId = (item, caseId) => (
  getCaseIdentity(item) === String(caseId)
  || item.id === String(caseId)
);

const upsertCase = (items, nextCase) => {
  const nextIdentity = getCaseIdentity(nextCase);
  const index = items.findIndex((item) => getCaseIdentity(item) === nextIdentity);
  if (index < 0) return [nextCase, ...items];
  return items.map((item) => getCaseIdentity(item) === nextIdentity ? nextCase : item);
};

export const useCaseStore = create((set, get) => ({
  cases: [],
  total: 0,
  loading: false,
  error: null,

  fetchCases: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const result = await getCases({ ...params, limit: TOTAL_MOCK_REPORTS, offset: 0 });
      set({
        cases: result.items,
        total: result.total,
        loading: false,
      });
      return result.items;
    } catch (error) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  fetchCaseDetail: async (caseId) => {
    set({ loading: true, error: null });
    try {
      const item = await getCaseDetail(caseId);
      set((state) => ({
        cases: upsertCase(state.cases, item),
        loading: false,
      }));
      return item;
    } catch (error) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  addCase: (item) => {
    set((state) => ({ cases: upsertCase(state.cases, item) }));
    return item;
  },

  updateCase: (caseId, updates) => set((state) => ({
    cases: state.cases.map((item) =>
      matchesCaseId(item, caseId) ? { ...item, ...updates } : item),
  })),

  deleteCase: (caseId) => set((state) => ({
    cases: state.cases.filter((item) => !matchesCaseId(item, caseId)),
  })),

  getCase: (caseId) =>
    get().cases.find((item) => matchesCaseId(item, caseId)),
}));
