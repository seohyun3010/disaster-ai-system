import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  DEFAULT_DASHBOARD_RANGE,
  migrateLegacyDashboardRange,
} from '../utils/dashboardMetrics';

export const useDashboardStore = create(
  persist(
    (set) => ({
      appliedStartDate: DEFAULT_DASHBOARD_RANGE.startDate,
      appliedEndDate: DEFAULT_DASHBOARD_RANGE.endDate,
      setAppliedRange: (startDate, endDate) => set({
        appliedStartDate: startDate,
        appliedEndDate: endDate,
      }),
      resetAppliedRange: () => set({
        appliedStartDate: DEFAULT_DASHBOARD_RANGE.startDate,
        appliedEndDate: DEFAULT_DASHBOARD_RANGE.endDate,
      }),
    }),
    {
      name: 'disaster-recovery.dashboard-query',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState) => migrateLegacyDashboardRange(persistedState),
      partialize: ({ appliedStartDate, appliedEndDate }) => ({
        appliedStartDate,
        appliedEndDate,
      }),
    },
  ),
);
