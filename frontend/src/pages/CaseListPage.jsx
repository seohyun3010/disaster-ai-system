import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAnalysisStore } from '../stores/analysisStore';
import { useCaseStore } from '../stores/caseStore';
import './case-list.css';

const PAGE_SIZE = 5;
const COMPLETED_STATUSES = ['AI 분석 완료', '처리 완료', '최종 승인'];
const STATUS_FILTERS = ['전체', '완료', '미완료', '보류'];

const getSimpleStatus = (status, reviewStatus) => {
  if (reviewStatus === '보류') return '보류';
  return COMPLETED_STATUSES.includes(status) ? '완료' : '미완료';
};

const toDate = (item) => new Date(item.reported_at || item.received_at);
const formatDate = (date) => Number.isNaN(date.getTime())
  ? '-'
  : new Intl.DateTimeFormat('ko-KR').format(date);

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

const parseLocalDate = (value) => new Date(`${value}T00:00:00`);
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};
const formatMonthDay = (date) => `${date.getMonth() + 1}.${date.getDate()}`;
const formatPeriod = (from, to) =>
  `${formatMonthDay(from)} ~ ${formatMonthDay(to)}`;

const buildDisasterEvents = (cases) => {
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
    const current = groups.get(key) || {
      id: key,
      year,
      name: schedule
        ? `${formatMonthDay(occurredFrom)} ~ ${formatMonthDay(occurredTo)} ${schedule.name}`
        : `${year}년 ${item.type}`,
      status: '진행중',
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

const FacilityFilter = ({ options, value, onChange }) => {
  const detailsRef = useRef(null);
  const selectFacility = (facility) => {
    onChange(facility);
    detailsRef.current?.removeAttribute('open');
  };

  return <div className="scroll-select-field">
    <span>시설 유형</span>
    <details ref={detailsRef} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) {
        event.currentTarget.removeAttribute('open');
      }
    }}>
      <summary aria-label={`시설 유형, 현재 선택 ${value}`}>{value}</summary>
      <div className="scroll-select-options" role="listbox" aria-label="시설 유형">
        {options.map((facility) => <button
          type="button"
          role="option"
          aria-selected={value === facility}
          className={value === facility ? 'selected' : ''}
          key={facility}
          onClick={() => selectFacility(facility)}
        >{facility}</button>)}
      </div>
    </details>
  </div>;
};

const DisasterEventSelection = ({ events, loading, error, onSelect }) =>
  <div className="case-page disaster-selection-page">
    <section className="case-card disaster-event-card">
      {loading && <p className="empty-case">신고 목록을 불러오는 중입니다.</p>}
      {error && <p className="empty-case">{error}</p>}
      {!loading && !error && <div className="disaster-event-table-wrap">
        <table className="disaster-event-table">
          <thead><tr><th>년도</th><th>재해명</th><th>마감 기간</th><th>신고</th><th /></tr></thead>
          <tbody>
            {events.map((event) => <tr key={event.id}>
              <td><strong>{event.year}</strong></td>
              <td><strong>{event.name}</strong><span className={`event-status ${event.status}`}>{event.status}</span></td>
              <td>{event.deadlinePeriod}</td>
              <td><b className="event-case-count">{event.reportCount}건</b></td>
              <td><button type="button" className="event-select-button" onClick={() => onSelect(event.id)}>신고목록 보기</button></td>
            </tr>)}
          </tbody>
        </table>
        {!events.length && <p className="empty-case">등록된 신고가 없습니다.</p>}
      </div>}
    </section>
  </div>;

const CaseListPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const analyses = useAnalysisStore((state) => state.analyses);
  const cases = useCaseStore((state) => state.cases);
  const loading = useCaseStore((state) => state.loading);
  const error = useCaseStore((state) => state.error);
  const fetchCases = useCaseStore((state) => state.fetchCases);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('전체');
  const [facility, setFacility] = useState('전체');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchCases({ limit: 100, offset: 0 }).catch(() => {});
  }, [fetchCases]);

  const events = useMemo(() => buildDisasterEvents(cases), [cases]);
  const selectedEventId = searchParams.get('event');
  const selectedEvent = events.find((event) => event.id === selectedEventId);
  const eventCases = useMemo(() => selectedEvent
    ? cases.filter((item) => selectedEvent.caseIds.includes(item.case_id))
    : [], [cases, selectedEvent]);
  const facilityOptions = useMemo(
    () => ['전체', ...new Set(eventCases.map((item) => item.facility))],
    [eventCases],
  );

  const filtered = useMemo(() => eventCases.filter((item) => {
    const reviewStatus = analyses[String(item.case_id ?? item.id)]?.reviewStatus;
    const simpleStatus = getSimpleStatus(item.status, reviewStatus);
    const matchesStatus = status === '전체' || simpleStatus === status;
    const matchesFacility = facility === '전체' || item.facility === facility;
    const keyword = `${item.case_number} ${item.reporter} ${item.address}`.toLowerCase();
    return matchesStatus &&
      matchesFacility &&
      keyword.includes(search.trim().toLowerCase());
  }), [analyses, eventCases, facility, search, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const resetFilters = () => {
    setSearch('');
    setStatus('전체');
    setFacility('전체');
    setPage(1);
  };

  if (!selectedEvent) {
    return <DisasterEventSelection
      events={events}
      loading={loading}
      error={error}
      onSelect={(eventId) => setSearchParams({ event: eventId })}
    />;
  }

  return <div className="case-page event-case-list-page">
    <header className="case-page-head">
      <div><p>자연재난 선택 / 신고목록</p><h1>{selectedEvent.name}</h1></div>
      <button type="button" className="secondary-action" onClick={() => {
        resetFilters();
        setSearchParams({});
      }}>← 자연재난 다시 선택</button>
    </header>

    <section className="event-selection-summary" aria-label="선택한 자연재난">
      <dl>
        <div><dt>재해 발생 기간</dt><dd>{selectedEvent.occurredPeriod}</dd></div>
        <div><dt>마감 기간</dt><dd>{selectedEvent.deadlinePeriod}</dd></div>
        <div><dt>진행 상태</dt><dd><span className={`event-status ${selectedEvent.status}`}>{selectedEvent.status}</span></dd></div>
        <div><dt>신고 건수</dt><dd>{eventCases.length}건</dd></div>
      </dl>
    </section>

    <section className="case-card list-filter">
      <div className="filter-grid">
        <label>검색<input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="사건번호, 신고자, 위치 검색" /></label>
        <label>처리 상태<select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>{STATUS_FILTERS.map((value) => <option key={value}>{value}</option>)}</select></label>
        <FacilityFilter options={facilityOptions} value={facility} onChange={(value) => { setFacility(value); setPage(1); }} />
        <button type="button" className="filter-reset" onClick={resetFilters}>초기화</button>
      </div>
    </section>

    <section className="case-card">
      <div className="list-title"><div><h2>신고 목록</h2><span>총 <b>{filtered.length}</b>건</span></div></div>
      <div className="case-table-wrap">
        <table className="case-table case-list-table">
          <thead><tr><th>사건번호 / 신고일시</th><th>피해 위치</th><th>신고자</th><th>시설 유형</th><th>상태</th></tr></thead>
          <tbody>{rows.map((item) => {
            const reviewStatus = analyses[String(item.case_id ?? item.id)]?.reviewStatus;
            const simpleStatus = getSimpleStatus(item.status, reviewStatus);
            return <tr key={item.case_id} className="clickable-row" onClick={() => navigate(`/cases/${item.case_id}`)}>
              <td><strong>{item.case_number}</strong><small>{item.reportedAt}</small></td>
              <td>{item.address}</td>
              <td>{item.reporter}</td>
              <td>{item.facility}</td>
              <td><span className={`status-badge ${simpleStatus}`}>{simpleStatus}</span></td>
            </tr>;
          })}</tbody>
        </table>
        {!rows.length && <p className="empty-case">선택한 재난에 등록된 신고가 없습니다.</p>}
      </div>
      {totalPages > 1 && <nav className="pagination" aria-label="목록 페이지">{Array.from({ length: totalPages }, (_, index) => <button type="button" key={index + 1} className={page === index + 1 ? 'current' : ''} onClick={() => setPage(index + 1)}>{index + 1}</button>)}</nav>}
    </section>
  </div>;
};

export default CaseListPage;
