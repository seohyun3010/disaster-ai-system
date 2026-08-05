import { MOCK_DISASTER_EVENTS } from '../mocks/cases';

const toCaseDate = (item) => new Date(item.reported_at || item.received_at);
const parseLocalDate = (value, endOfDay = false) => {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, year, month, day] = match;
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0,
  );
};
const formatDate = (date) => Number.isNaN(date.getTime())
  ? '-'
  : new Intl.DateTimeFormat('ko-KR').format(date);
const formatMonthDay = (date) => `${date.getMonth() + 1}.${date.getDate()}`;
const formatPeriod = (from, to) => `${formatMonthDay(from)} ~ ${formatMonthDay(to)}`;
const isEventInRange = (event, range) => {
  if (!range?.from && !range?.to) return true;
  const eventStart = parseLocalDate(event.from)?.getTime();
  const rangeFrom = parseLocalDate(range.from)?.getTime() ?? Number.NEGATIVE_INFINITY;
  const rangeTo = parseLocalDate(range.to)?.getTime() ?? Number.POSITIVE_INFINITY;
  return eventStart >= rangeFrom && eventStart <= rangeTo;
};

const getCaseReportTimestamp = (item) => {
  const value = item?.reported_at || item?.received_at || item?.reportedAt;
  if (!value) return null;

  const timestamp = Date.parse(value);
  if (!Number.isNaN(timestamp)) return timestamp;

  const displayMatch = String(value).match(
    /^(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{1,2}):(\d{2})$/,
  );
  if (!displayMatch) return null;
  const [, year, month, day, hour, minute] = displayMatch.map(Number);
  return new Date(year, month - 1, day, hour, minute).getTime();
};

export const filterCasesByDisasterPeriod = (
  cases,
  { disasterType = '', startDate = '', endDate = '' } = {},
) => {
  const startAt = startDate
    ? parseLocalDate(startDate)?.getTime()
    : Number.NEGATIVE_INFINITY;
  const endAt = endDate
    ? parseLocalDate(endDate, true)?.getTime()
    : Number.POSITIVE_INFINITY;

  if (!Number.isFinite(startAt) && startAt !== Number.NEGATIVE_INFINITY) return [];
  if (!Number.isFinite(endAt) && endAt !== Number.POSITIVE_INFINITY) return [];

  return cases.filter((item) => {
    const reportedAt = getCaseReportTimestamp(item);
    if (reportedAt === null || reportedAt < startAt || reportedAt > endAt) return false;

    if (!disasterType) return true;
    const itemTypes = [item.disaster_type, item.type].filter(Boolean);
    return itemTypes.length === 0 || itemTypes.includes(disasterType);
  });
};

export const buildDisasterCaseListPath = (item) => {
  const reportedAt = getCaseReportTimestamp(item);
  const event = MOCK_DISASTER_EVENTS.find((candidate) => (
    candidate.id === item?.disaster_event_id
  )) || MOCK_DISASTER_EVENTS.find((candidate) => (
    reportedAt !== null
    && candidate.disasterType === item?.disaster_type
    && reportedAt >= parseLocalDate(candidate.from).getTime()
    && reportedAt <= parseLocalDate(candidate.to, true).getTime()
  ));

  if (!event) return '/cases';

  const params = new URLSearchParams({
    event: event.id,
    historyId: event.id,
    disasterType: event.label,
    startDate: event.from,
    endDate: event.to,
  });
  return `/cases?${params.toString()}`;
};

export const buildDisasterEvents = (cases, range) => {
  const casesByEvent = cases.reduce((groups, item) => {
    if (!item.disaster_event_id) return groups;
    const current = groups.get(item.disaster_event_id) || [];
    current.push(item);
    groups.set(item.disaster_event_id, current);
    return groups;
  }, new Map());

  return MOCK_DISASTER_EVENTS
    .filter((event) => isEventInRange(event, range))
    .map((event) => {
      const occurredFrom = parseLocalDate(event.from);
      const occurredTo = parseLocalDate(event.to);
      const deadlineFrom = parseLocalDate(event.deadlineFrom);
      const deadlineTo = parseLocalDate(event.deadlineTo);
      const eventCases = filterCasesByDisasterPeriod(
        casesByEvent.get(event.id) || [],
        {
          disasterType: event.disasterType,
          startDate: event.from,
          endDate: event.to,
        },
      );
      const dates = eventCases
        .map(toCaseDate)
        .filter((date) => !Number.isNaN(date.getTime()))
        .sort((left, right) => left - right);

      return {
        ...event,
        year: event.year,
        name: `${formatPeriod(occurredFrom, occurredTo)} ${event.label}`,
        occurredPeriod: formatPeriod(occurredFrom, occurredTo),
        filingPeriod: '-',
        deadlinePeriod: formatPeriod(deadlineFrom, deadlineTo),
        startAt: occurredFrom.getTime(),
        deadlineAt: deadlineTo.getTime(),
        period: dates.length
          ? `${formatDate(dates[0])} ~ ${formatDate(dates.at(-1))}`
          : '-',
        caseIds: eventCases.map((item) => item.frontendKey || item.id || String(item.case_id)),
        reportCount: eventCases.length,
      };
    })
    .sort((left, right) => right.startAt - left.startAt);
};
