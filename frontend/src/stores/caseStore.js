import { create } from 'zustand';
import { getCaseDetail, getCases } from '../api/caseApi';

const upsertCase = (items, nextCase) => {
  const index = items.findIndex((item) => item.case_id === nextCase.case_id);
  if (index < 0) return [nextCase, ...items];
  return items.map((item) => item.case_id === nextCase.case_id ? nextCase : item);
};

export const useCaseStore = create((set, get) => ({
  cases: [],
  total: 0,
  loading: false,
  error: null,

  fetchCases: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const result = await getCases(params);
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
    const numericCaseId = Number(caseId);
    set({ loading: true, error: null });
    try {
      const item = await getCaseDetail(numericCaseId);
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
      item.case_id === Number(caseId) ? { ...item, ...updates } : item),
  })),

  deleteCase: (caseId) => set((state) => ({
    cases: state.cases.filter((item) => item.case_id !== Number(caseId)),
  })),

  getCase: (caseId) =>
    get().cases.find((item) => item.case_id === Number(caseId)),
}));
