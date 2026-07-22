import { create } from 'zustand';
import { CASES } from '../mocks/cases';

const formatReportedAt = (date) => new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
}).format(date).replace(/\. /g, '.').replace('.', '.').replace(',', '');

const createCaseId = (items, date) => {
  const day = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('');
  const largestSequence = items.reduce((max, item) => Math.max(max, Number(item.id.split('-').at(-1)) || 0), 0);
  return `NDMS-${day}-${String(largestSequence + 1).padStart(4, '0')}`;
};

export const useCaseStore = create((set) => ({
  cases: CASES,
  addCase: ({ reporter, type, facility, location, photoName, photoUrl }) => {
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
        description: '공무원이 직접 등록한 재해 신고입니다.',
        photoName: photoName || null,
        photoUrl: photoUrl || null,
      };
      return { cases: [createdCase, ...state.cases] };
    });
    return createdCase;
  },
}));
