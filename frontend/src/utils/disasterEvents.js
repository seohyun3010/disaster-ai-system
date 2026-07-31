const DISASTER_SCHEDULES = {
  HEAVY_RAIN: {
    name: '집중호우',
    occurredFrom: '2026-07-15',
    occurredTo: '2026-07-18',
  },
  LANDSLIDE: {
    name: '산사태',
    occurredFrom: '2026-04-03',
    occurredTo: '2026-04-05',
  },
  EARTHQUAKE: {
    name: '지진',
    occurredFrom: '2026-06-12',
    occurredTo: '2026-06-13',
  },
};

const toDate = (item) => new Date(item.reported_at || item.received_at);
const formatDate = (date) => Number.isNaN(date.getTime())
  ? '-'
  : new Intl.DateTimeFormat('ko-KR').format(date);
const parseLocalDate = (value) => new Date(`${value}T00:00:00`);
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};
const formatMonthDay = (date) => `${date.getMonth() + 1}.${date.getDate()}`;
const formatPeriod = (from, to) => `${formatMonthDay(from)} ~ ${formatMonthDay(to)}`;

export const buildDisasterEvents = (cases) => {
  const groups = new Map();
  cases.forEach((item) => {
    if (item.disaster_type === 'TYPHOON') return;
    const date = toDate(item);
    const year = Number.isNaN(date.getTime()) ? '미상' : date.getFullYear();
    const key = `${year}-${item.disaster_type || 'OTHER'}`;
    const schedule = DISASTER_SCHEDULES[item.disaster_type];
    const occurredFrom = schedule ? parseLocalDate(schedule.occurredFrom) : null;
    const occurredTo = schedule ? parseLocalDate(schedule.occurredTo) : null;
    const filingFrom = occurredTo ? addDays(occurredTo, 1) : null;
    const filingTo = filingFrom ? addDays(filingFrom, 9) : null;
    const deadlineFrom = filingTo ? addDays(filingTo, 1) : null;
    const deadlineTo = deadlineFrom ? addDays(deadlineFrom, 13) : null;
    const deadlineCompleted = deadlineTo
      ? Date.now() >= addDays(deadlineTo, 1).getTime()
      : false;
    const current = groups.get(key) || {
      id: key,
      year,
      name: schedule
        ? `${formatMonthDay(occurredFrom)} ~ ${formatMonthDay(occurredTo)} ${schedule.name}`
        : `${year}년 ${item.type}`,
      status: deadlineCompleted ? '완료' : '진행중',
      occurredPeriod: schedule ? formatPeriod(occurredFrom, occurredTo) : '-',
      filingPeriod: schedule ? formatPeriod(filingFrom, filingTo) : '-',
      deadlinePeriod: schedule ? formatPeriod(deadlineFrom, deadlineTo) : '-',
      deadlineAt: deadlineTo?.getTime() || 0,
      dates: [],
      caseIds: [],
    };
    if (!Number.isNaN(date.getTime())) current.dates.push(date);
    current.caseIds.push(item.case_id);
    groups.set(key, current);
  });

  return [...groups.values()]
    .map((event) => {
      const sorted = event.dates.sort((a, b) => a - b);
      return {
        ...event,
        period: sorted.length
          ? `${formatDate(sorted[0])} ~ ${formatDate(sorted.at(-1))}`
          : '-',
        reportCount: event.caseIds.length,
      };
    })
    .sort((a, b) => b.deadlineAt - a.deadlineAt);
};
