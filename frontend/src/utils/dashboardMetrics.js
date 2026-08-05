const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const DEFAULT_DASHBOARD_RANGE = Object.freeze({
  startDate: '2025-07-30',
  endDate: '2026-07-30',
});

const parseDateOnly = (value, endOfDay = false) => {
  if (!value || typeof value !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const [, year, month, day] = match.map(Number);
  const date = new Date(
    year,
    month - 1,
    day,
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0,
  );

  if (
    date.getFullYear() !== year
    || date.getMonth() !== month - 1
    || date.getDate() !== day
  ) return null;

  return date;
};

const toTimestamp = (value) => {
  if (!value) return Number.NaN;
  if (value instanceof Date) return value.getTime();
  return new Date(value).getTime();
};

const toDateKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const getReportedAt = (item) => item?.reported_at || item?.received_at || item?.reportedAt;

export const validateDashboardRange = ({ startDate, endDate }) => {
  if (!startDate || !endDate) return '시작일과 종료일을 모두 입력해 주세요.';

  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate, true);
  if (!start || !end) return '올바른 조회 기간을 입력해 주세요.';
  if (start.getTime() > end.getTime()) return '시작일은 종료일보다 늦을 수 없습니다.';
  return '';
};

export const filterCasesByReportedRange = (cases, range) => {
  const start = parseDateOnly(range.startDate)?.getTime();
  const end = parseDateOnly(range.endDate, true)?.getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return [];

  return cases.filter((item) => {
    const reportedAt = toTimestamp(getReportedAt(item));
    return Number.isFinite(reportedAt) && reportedAt >= start && reportedAt <= end;
  });
};

export const filterEventsByOccurrenceRange = (events, range) => {
  const queryStart = parseDateOnly(range.startDate)?.getTime();
  const queryEnd = parseDateOnly(range.endDate, true)?.getTime();
  if (!Number.isFinite(queryStart) || !Number.isFinite(queryEnd)) return [];

  return events.filter((event) => {
    const eventStart = parseDateOnly(event.from)?.getTime();
    const eventEnd = parseDateOnly(event.to, true)?.getTime();
    return Number.isFinite(eventStart)
      && Number.isFinite(eventEnd)
      && eventStart <= queryEnd
      && eventEnd >= queryStart;
  });
};

const countCasesOnDate = (cases, dateKey) => cases.reduce(
  (count, item) => count + (toDateKey(getReportedAt(item)) === dateKey ? 1 : 0),
  0,
);

const countEventsStartingOnDate = (events, dateKey) => events.reduce(
  (count, event) => count + (event.from === dateKey ? 1 : 0),
  0,
);

const getPreviousDateKey = (dateKey) => {
  const date = parseDateOnly(dateKey);
  if (!date) return '';
  return toDateKey(date.getTime() - DAY_IN_MS);
};

const isGeneratedReport = (item) => (
  item.workflow_stage === '보고서'
  || item.processing_status === '최종 승인'
  || item.displayStatus === '최종 승인'
);

export const buildDashboardMetrics = ({ cases, events, disasterTypes, range }) => {
  const filteredCases = filterCasesByReportedRange(cases, range);
  const filteredEvents = filterEventsByOccurrenceRange(events, range);
  const reportTotal = filteredCases.length;
  const generatedReportCount = filteredCases.filter(isGeneratedReport).length;
  const previousDate = getPreviousDateKey(range.endDate);

  const typeStats = disasterTypes.map(({ key, label }) => {
    const count = filteredCases.filter((item) => item.disaster_type === key).length;
    return {
      key,
      label,
      count,
      percentage: reportTotal ? Math.round((count / reportTotal) * 100) : 0,
    };
  });

  return {
    cases: filteredCases,
    events: filteredEvents,
    disasterCount: filteredEvents.length,
    reportTotal,
    disasterChange: countEventsStartingOnDate(events, range.endDate)
      - countEventsStartingOnDate(events, previousDate),
    reportChange: countCasesOnDate(cases, range.endDate)
      - countCasesOnDate(cases, previousDate),
    generatedReportCount,
    pendingReportCount: Math.max(reportTotal - generatedReportCount, 0),
    typeStats,
  };
};

export const formatDashboardChange = (value) => `${value > 0 ? '+' : ''}${value.toLocaleString('ko-KR')}건`;

export const formatDashboardPeriod = ({ startDate, endDate }) => {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);
  if (!start || !end) return '-';

  const isRecentYear = end.getFullYear() === start.getFullYear() + 1
    && end.getMonth() === start.getMonth()
    && end.getDate() === start.getDate();
  if (isRecentYear) return '최근 1년 기준';

  return `${startDate.replaceAll('-', '.')} ~ ${endDate.replaceAll('-', '.')} 기준`;
};

export const sortCasesByReportedAt = (cases) => [...cases].sort((left, right) => (
  toTimestamp(getReportedAt(right)) - toTimestamp(getReportedAt(left))
  || Number(right.case_id || 0) - Number(left.case_id || 0)
));
