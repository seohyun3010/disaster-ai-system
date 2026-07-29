import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { CASES, DELETED_DEMO_CASE_IDS } from '../mocks/cases';

const STORAGE_KEY = 'disaster-recovery.cases';
const DELETED_DEMO_CASE_ID_SET = new Set(DELETED_DEMO_CASE_IDS);

const formatReportedAt = (date) => {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const normalizeCase = (item) => ({
  ...item,
  description: item.description || '',
  photos: item.photos || (item.photoUrl ? [{ name: item.photoName || '현장 사진', url: item.photoUrl }] : []),
});

const sanitizeCases = (items = []) => items
  .filter((item) => !DELETED_DEMO_CASE_ID_SET.has(item.id))
  .map(normalizeCase);

const seedMockCases = (items = []) => {
  const sanitized = sanitizeCases(items);
  const savedIds = new Set(sanitized.map((item) => item.id));
  return [
    ...sanitized,
    ...CASES.filter((item) => !savedIds.has(item.id)).map(normalizeCase),
  ];
};

const createCaseId = (items, date) => {
  const day = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const largestSequence = items.reduce((max, item) => Math.max(max, Number(item.id.split('-').at(-1)) || 0), 0);
  return `NDMS-${day}-${String(largestSequence + 1).padStart(4, '0')}`;
};

export const useCaseStore = create(
  persist(
    (set) => ({
      cases: sanitizeCases(CASES),
      addCase: ({ reporter, type, facility, location, description = '', photos = [], source = 'manual', externalReport = null }) => {
        const createdAt = new Date();
        let createdCase;
        set((state) => {
          createdCase = {
            id: createCaseId(state.cases, createdAt),
            reporter,
            type,
            facility,
            location,
            reportedAt: formatReportedAt(createdAt),
            status: '접수 완료',
            urgency: '보통',
            duplicate: false,
            damage: '확인 전',
            description: description || '공무원이 직접 등록한 재해 신고입니다.',
            photos,
            source,
            externalReport,
          };
          return { cases: [createdCase, ...state.cases] };
        });
        return createdCase;
      },
      updateCase: (caseId, updates) => set((state) => ({
        cases: state.cases.map((item) => item.id === caseId ? normalizeCase({ ...item, ...updates }) : item),
      })),
      deleteCase: (caseId) => set((state) => ({
        cases: state.cases.filter((item) => item.id !== caseId),
      })),
    }),
    {
      name: STORAGE_KEY,
      version: 3,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ cases: state.cases }),
      migrate: (persisted) => ({
        ...persisted,
        cases: seedMockCases(persisted?.cases),
      }),
      merge: (persisted, current) => ({
        ...current,
        ...persisted,
        cases: sanitizeCases(persisted?.cases || current.cases),
      }),
    },
  ),
);
