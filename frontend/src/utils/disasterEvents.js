import { MOCK_DISASTER_EVENTS } from '../mocks/cases';

const toCaseDate = (item) => new Date(item.reported_at || item.received_at);
const parseLocalDate = (value) => {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
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
      const eventCases = casesByEvent.get(event.id) || [];
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
