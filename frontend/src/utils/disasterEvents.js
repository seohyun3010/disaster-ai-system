import { MOCK_DISASTER_EVENTS } from '../mocks/cases';
import { formatDisasterType } from './disasterTypeLabels';

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
const addCalendarDays = (value, days) => new Date(
  value.getFullYear(),
  value.getMonth(),
  value.getDate() + days,
);
const calculateDeadlineDates = (disasterEnd) => {
  const deadlineFrom = addCalendarDays(disasterEnd, 11);
  return {
    deadlineFrom,
    deadlineTo: addCalendarDays(deadlineFrom, 13),
  };
};
const formatInputDate = (date) => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, '0'),
  String(date.getDate()).padStart(2, '0'),
].join('-');
const buildCaseSearchText = (cases) => cases.map((item) => [
  item.case_number,
  item.caseNumber,
  item.external_report_id,
  item.externalReportId,
  item.reporter_name,
  item.reporter,
  item.address,
  item.location,
].filter(Boolean).join(' ')).join(' ');
const getCaseIdentity = (item) => item.frontendKey || item.id || String(item.case_id);
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
  const configuredEvent = MOCK_DISASTER_EVENTS.find((candidate) => (
    candidate.id === item?.disaster_event_id
  )) || MOCK_DISASTER_EVENTS.find((candidate) => (
    reportedAt !== null
    && candidate.disasterType === item?.disaster_type
    && reportedAt >= parseLocalDate(candidate.from).getTime()
    && reportedAt <= parseLocalDate(candidate.to, true).getTime()
  ));
  const event = configuredEvent || (
    item?.disaster_event_id && item?.disaster_start_date && item?.disaster_end_date
      ? {
        id: item.disaster_event_id,
        label: formatDisasterType(item.disaster_type || item.type),
        from: item.disaster_start_date,
        to: item.disaster_end_date,
      }
      : null
  );

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

  const configuredEvents = MOCK_DISASTER_EVENTS
    .filter((event) => isEventInRange(event, range))
    .map((event) => {
      const occurredFrom = parseLocalDate(event.from);
      const occurredTo = parseLocalDate(event.to);
      const calculatedDeadline = calculateDeadlineDates(occurredTo);
      const deadlineFrom = calculatedDeadline.deadlineFrom;
      const deadlineTo = calculatedDeadline.deadlineTo;
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
        deadlineFrom: formatInputDate(deadlineFrom),
        deadlineTo: formatInputDate(deadlineTo),
        deadlinePeriod: formatPeriod(deadlineFrom, deadlineTo),
        startAt: occurredFrom.getTime(),
        deadlineAt: deadlineTo.getTime(),
        period: dates.length
          ? `${formatDate(dates[0])} ~ ${formatDate(dates.at(-1))}`
          : '-',
        caseIds: eventCases.map((item) => item.frontendKey || item.id || String(item.case_id)),
        reportCount: eventCases.length,
        caseSearchText: buildCaseSearchText(eventCases),
      };
    });

  const configuredEventIds = new Set(MOCK_DISASTER_EVENTS.map((event) => event.id));
  const backendEvents = [...casesByEvent.entries()]
    .filter(([eventId, eventCases]) => (
      !configuredEventIds.has(eventId)
      && eventCases.some((item) => item.__source === 'backend')
    ))
    .flatMap(([eventId, eventCases]) => {
      const backendCases = eventCases.filter((item) => item.__source === 'backend');
      const dates = backendCases
        .map(toCaseDate)
        .filter((date) => !Number.isNaN(date.getTime()))
        .sort((left, right) => left - right);
      if (!dates.length) return [];

      const metadataCase = backendCases.find((item) => (
        item.disaster_start_date && item.disaster_end_date
      ));
      const from = parseLocalDate(metadataCase?.disaster_start_date) || dates[0];
      const to = parseLocalDate(metadataCase?.disaster_end_date) || dates.at(-1);
      const calculatedDeadline = calculateDeadlineDates(to);
      const deadlineFrom = parseLocalDate(metadataCase?.deadline_start_date)
        || calculatedDeadline.deadlineFrom;
      const deadlineTo = parseLocalDate(metadataCase?.deadline_end_date)
        || calculatedDeadline.deadlineTo;
      const disasterType = backendCases[0].disaster_type || backendCases[0].type;
      const label = formatDisasterType(disasterType);
      return [{
        id: eventId,
        year: from.getFullYear(),
        disasterType,
        label,
        name: `${formatPeriod(from, to)} ${label}`,
        from: formatInputDate(from),
        to: formatInputDate(to),
        occurredPeriod: formatPeriod(from, to),
        filingPeriod: '-',
        deadlineFrom: formatInputDate(deadlineFrom),
        deadlineTo: formatInputDate(deadlineTo),
        deadlinePeriod: formatPeriod(deadlineFrom, deadlineTo),
        status: '접수',
        startAt: from.getTime(),
        deadlineAt: deadlineTo.getTime(),
        period: `${formatDate(from)} ~ ${formatDate(to)}`,
        caseIds: backendCases.map(getCaseIdentity),
        reportCount: backendCases.length,
        caseSearchText: buildCaseSearchText(backendCases),
        sourceEventIds: [],
        usesCaseIds: true,
        __source: 'backend',
      }];
    });

  return [...configuredEvents, ...backendEvents]
    .sort((left, right) => right.startAt - left.startAt);
};
