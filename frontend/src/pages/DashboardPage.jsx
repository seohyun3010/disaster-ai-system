// import { useEffect } from 'react';
// import CaseMap from '../components/dashboard/CaseMap';
// import { useCaseStore } from '../stores/caseStore';
// import '../components/dashboard/dashboard.css';

// const KPIS = [
//   { icon: '☀', label: '재난 발생 (금일)', value: '5', unit: '건', change: '-1건', tone: 'blue' },
//   { icon: '▤', label: '피해 신고 (누적)', value: '1,248', unit: '건', change: '+87건', tone: 'red' },
//   { icon: '♙', label: '현장 확인 완료', value: '896', unit: '건', change: '+36건', tone: 'red' },
//   { icon: '☑', label: '복구 승인 (누적)', value: '562', unit: '건', change: '+22건', tone: 'red' },
//   { icon: '▱', label: '지급금 심사 중', value: '314', unit: '건', change: '+18건', tone: 'red' },
//   { icon: '₩', label: '지급금 지급 완료', value: '128', unit: '건', change: '+9건', tone: 'red' },
// ];

// const MARKERS = [
//   ['서울', 21, 30, 19.5, 'navy'],
//   ['인천', 17, 22.5, 19.5, 'gray'],
//   ['경기', 38, 31, 23, 'navy'],
//   ['강원', 25, 56, 15.5, 'navy'],
//   ['충북', 52, 47, 33, 'red'],
//   ['충남', 18, 28, 37.5, 'gray'],
//   ['세종', 17, 37, 39.5, 'gray'],
//   ['대전', 17, 39.5, 42.5, 'gray'],
//   ['전북', 47, 39.5, 51, 'navy'],
//   ['광주', 29, 28.5, 62, 'navy'],
//   ['전남', 19, 29, 67, 'gray'],
//   ['경북', 55, 64, 39, 'red'],
//   ['대구', 11, 61, 50, 'gray'],
//   ['경남', 61, 56, 58, 'red'],
//   ['울산', 9, 74, 55, 'gray'],
//   ['부산', 26, 69, 61.5, 'navy'],
//   ['제주', 6, 21, 95, 'gray'],
// ];

// const DISASTER_YEAR_STATS = [
//   ['호우', 412],
//   ['태풍', 286],
//   ['산불', 214],
//   ['대설', 183],
//   ['지진', 153],
// ];

// const REPORTS = [
//   ['R-0124', '수원시 영통구', '단독주택', '2026.07.28 10:21'],
//   ['R-0123', '용인시 처인구', '농경지', '2026.07.28 10:15'],
//   ['R-0122', '용인시 처인구', '아파트', '2026.07.28 10:12'],
//   ['R-0121', '울산시 남구', '상가', '2026.07.28 10:05'],
//   ['R-0120', '안산시 상록구', '주택', '2026.07.28 09:58'],
// ];

// const DashboardPage = () => {
//   const fetchCases = useCaseStore((state) => state.fetchCases);
//   const mapRef = useRef(null);

//   useEffect(() => {
//     fetchCases({ limit: 100, offset: 0 }).catch(() => {});
//   }, [fetchCases]);

//   return (
//     <div className="dashboard-page light-dashboard">
//       <section className="compact-query-panel" aria-labelledby="compact-query-title">
//         <h1 id="compact-query-title">재난 현황 조회</h1>
//         <form onSubmit={(event) => event.preventDefault()}>
//           <label className="compact-date-field">
//             <span>기간</span>
//             <div>
//               <input type="date" defaultValue="2025-07-30" aria-label="조회 시작일" />
//               <em>~</em>
//               <input type="date" defaultValue="2026-07-30" aria-label="조회 종료일" />
//             </div>
//           </label>
//           <button type="submit">조회</button>
//         </form>
//       </section>

//       <section className="dashboard-kpi-grid" aria-label="핵심 현황">
//         {KPIS.map((kpi) => (
//           <article className="dashboard-kpi" key={kpi.label}>
//             <span className="dashboard-kpi-icon" aria-hidden="true">{kpi.icon}</span>
//             <div><span>{kpi.label}</span><strong>{kpi.value}<small>{kpi.unit}</small></strong></div>
//             <footer>전일 대비 <b className={kpi.tone}>{kpi.change}</b></footer>
//           </article>
//         ))}
//       </section>

//       <section className="dashboard-main-grid">
//         <aside className="dashboard-left-column">
//           <article className="dashboard-card recent-card">
//             <CardTitle title="최근 접수" action="더보기 ›" />
//             <ul className="recent-report-list">
//               {REPORTS.slice(0, 4).map((row) => (
//                 <li key={row[0]}>
//                   <strong>{row[0]}</strong>
//                   <span>{row[2]}</span>
//                   <span>{row[1]}</span>
//                 </li>
//               ))}
//             </ul>
//           </article>

//           <article className="dashboard-card report-summary-card">
//             <CardTitle title="보고서" action="전체 보기 ›" />
//             <div className="report-summary-list">
//               <div><span>작성 대기</span><strong>12<small>건</small></strong></div>
//               <div><span>검토 중</span><strong>8<small>건</small></strong></div>
//               <div><span>작성 완료</span><strong>34<small>건</small></strong></div>
//             </div>
//           </article>
//         </aside>

//         <article className="dashboard-card dashboard-map-card">
//           <CardTitle title="지역별 피해 현황 지도" />
//           <div className="dashboard-map-body">
//             <div className="dashboard-map-legend">
//               <span><i className="red" />50건 이상</span>
//               <span><i className="navy" />20~49건</span>
//               <span><i className="gray" />5~19건</span>
//               <span><i className="light" />5건 미만</span>
//             </div>
//             <div className="dashboard-map-canvas">
//               <CaseMap ref={mapRef}
//             </div>
//             <div className="map-controls" aria-hidden="true"><button>＋</button><button>－</button><button>◎</button></div>
//           </div>
//         </article>

//         <aside className="dashboard-right-column">
//           <article className="dashboard-card annual-disaster-card">
//             <CardTitle title="재난 유형 현황" meta="최근 1년 기준" />
//             <div className="annual-donut-content">
//               <div
//                 className="annual-disaster-donut"
//                 role="img"
//                 aria-label="최근 1년 전체 1,248건 중 호우 412건, 태풍 286건, 산불 214건, 대설 183건, 지진 153건"
//               >
//                 <div><strong>1,248</strong><span>전체 누적</span></div>
//               </div>
//               <ul className="annual-donut-legend">
//                 {DISASTER_YEAR_STATS.map(([name, value]) => (
//                   <li key={name}><i /><span>{name}</span><b>{value.toLocaleString('ko-KR')}건</b></li>
//                 ))}
//               </ul>
//             </div>
//           </article>
//         </aside>
//       </section>
//     </div>
//   );
// };

// const CardTitle = ({ title, action, meta }) => <header className="dashboard-card-title"><strong>{title}</strong><span>{action || meta || 'ⓘ'}</span></header>;

// export default DashboardPage;

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArcElement, Chart as ChartJS, Tooltip } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import CaseMap from '../components/dashboard/CaseMap';
import { ROUTES } from '../routes/routeConfig';
import { useCaseStore } from '../stores/caseStore';
import { useDashboardStore } from '../stores/dashboardStore';
import { buildDisasterEvents } from '../utils/disasterEvents';
import { formatFacilityType } from '../utils/disasterTypeLabels';
import { MOCK_DISASTER_CONFIG, MOCK_DISASTER_EVENTS } from '../mocks/cases';
import {
  buildDashboardMetrics,
  DASHBOARD_REFERENCE_DATE,
  DEFAULT_DASHBOARD_RANGE,
  formatDashboardPeriod,
  migrateLegacyDashboardRange,
  sortCasesByReportedAt,
  validateDashboardRange,
} from '../utils/dashboardMetrics';
import '../components/dashboard/dashboard.css';

ChartJS.register(ArcElement, Tooltip);

const DISASTER_YEAR_COLORS = ['#6FA8FF', '#72D4C8', '#FFB26B', '#B79CFF', '#D8BC92', '#9AA6B2'];
const DISASTER_YEAR_HOVER_COLORS = ['#6599E8', '#68C1B6', '#E8A261', '#A78EE8', '#C5AB85', '#8B97A3'];
const DISASTER_YEAR_CHART_OPTIONS = {
  cutout: '72%',
  radius: '98%',
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { enabled: true },
  },
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DEADLINE_NOTICE_WINDOW_DAYS = 14;
const NOTIFICATION_TYPE_LABELS = {
  deadline: '마감 임박',
  work: '업무 안내',
  ai: 'AI 분석',
  field: '현장 조사',
  report: '보고서',
  system: '시스템',
  emergency: '긴급 알림',
};
const OPERATIONAL_NOTICES = [
  {
    id: 'approval-pending',
    noticeType: 'work',
    message: '최종 승인 대기 신고가 5건 있습니다.',
    meta: '처리 필요',
  },
  {
    id: 'ai-review',
    noticeType: 'ai',
    message: 'AI 분석 완료 후 검토가 필요한 신고가 8건 있습니다.',
    meta: '검토 필요',
  },
  {
    id: 'field-review',
    noticeType: 'field',
    message: '현장 방문 검토 대상이 3건 있습니다.',
    meta: '현장 확인',
  },
  {
    id: 'weekly-report',
    noticeType: 'report',
    message: '이번 주 복구 현황 보고서 제출 마감 D-2',
    meta: '제출 기한',
  },
];
const formatDeadlineDate = (timestamp) => {
  const date = new Date(timestamp);
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
};

const getValidRange = (startDate, endDate) => {
  const range = { startDate, endDate };
  return validateDashboardRange(range) ? null : range;
};

const DashboardPage = () => {
  const { key: locationKey } = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const fetchCases = useCaseStore((state) => state.fetchCases);
  const cases = useCaseStore((state) => state.cases);
  const appliedStartDate = useDashboardStore((state) => state.appliedStartDate);
  const appliedEndDate = useDashboardStore((state) => state.appliedEndDate);
  const setAppliedRange = useDashboardStore((state) => state.setAppliedRange);
  const resetAppliedRange = useDashboardStore((state) => state.resetAppliedRange);
  const mapRef = useRef(null);
  const noticeIntervalRef = useRef(null);
  const [noticeIndex, setNoticeIndex] = useState(0);
  const [noticeCycleKey, setNoticeCycleKey] = useState(0);
  const urlStartDate = searchParams.get('startDate') || '';
  const urlEndDate = searchParams.get('endDate') || '';
  const appliedRange = useMemo(() => (
    migrateLegacyDashboardRange(getValidRange(urlStartDate, urlEndDate))
    || getValidRange(appliedStartDate, appliedEndDate)
    || DEFAULT_DASHBOARD_RANGE
  ), [appliedEndDate, appliedStartDate, urlEndDate, urlStartDate]);
  const appliedRangeKey = `${appliedRange.startDate}:${appliedRange.endDate}`;
  const rangeContextKey = `${locationKey}:${appliedRangeKey}`;
  const [draftRangeState, setDraftRangeState] = useState(() => ({
    ...appliedRange,
    contextKey: rangeContextKey,
  }));
  const [rangeErrorState, setRangeErrorState] = useState({
    contextKey: rangeContextKey,
    message: '',
  });
  const draftStartDate = draftRangeState.contextKey === rangeContextKey
    ? draftRangeState.startDate
    : appliedRange.startDate;
  const draftEndDate = draftRangeState.contextKey === rangeContextKey
    ? draftRangeState.endDate
    : appliedRange.endDate;
  const rangeError = rangeErrorState.contextKey === rangeContextKey
    ? rangeErrorState.message
    : '';
  const dashboardMetrics = useMemo(() => buildDashboardMetrics({
    cases,
    events: MOCK_DISASTER_EVENTS,
    disasterTypes: MOCK_DISASTER_CONFIG,
    range: appliedRange,
  }), [cases, appliedRange]);
  const currentTotal = dashboardMetrics.reportTotal;
  const periodLabel = formatDashboardPeriod(appliedRange);
  const kpis = useMemo(() => [
    {
      icon: '☀',
      label: '기간 내 재난 발생',
      value: dashboardMetrics.disasterCount.toLocaleString('ko-KR'),
      unit: '건',
    },
    {
      icon: '▤',
      label: '기간 내 피해 신고',
      value: currentTotal.toLocaleString('ko-KR'),
      unit: '건',
    },
  ], [currentTotal, dashboardMetrics.disasterCount]);
  const recentReports = useMemo(
    () => sortCasesByReportedAt(dashboardMetrics.cases).slice(0, 6),
    [dashboardMetrics.cases],
  );
  const disasterYearTotal = currentTotal;
  const disasterYearMax = Math.max(0, ...dashboardMetrics.typeStats.map((item) => item.count));
  const disasterYearChartData = useMemo(() => ({
    labels: dashboardMetrics.typeStats.map((item) => item.label),
    datasets: [{
      data: dashboardMetrics.typeStats.map((item) => item.count),
      backgroundColor: DISASTER_YEAR_COLORS,
      hoverBackgroundColor: DISASTER_YEAR_HOVER_COLORS,
      borderWidth: 0,
      spacing: 0,
    }],
  }), [dashboardMetrics.typeStats]);
  const openDisasterTypeCases = useCallback((disasterType) => {
    const params = new URLSearchParams({
      disasterType,
      startDate: appliedRange.startDate,
      endDate: appliedRange.endDate,
    });
    navigate(`${ROUTES.CASES}?${params.toString()}`);
  }, [appliedRange.endDate, appliedRange.startDate, navigate]);
  const disasterYearChartOptions = useMemo(() => ({
    ...DISASTER_YEAR_CHART_OPTIONS,
    onClick: (_, elements) => {
      const selectedIndex = elements[0]?.index;
      const selectedType = dashboardMetrics.typeStats[selectedIndex]?.label;
      if (selectedType) openDisasterTypeCases(selectedType);
    },
    onHover: (event, elements) => {
      if (event.native?.target) {
        event.native.target.style.cursor = elements.length ? 'pointer' : 'default';
      }
    },
  }), [dashboardMetrics.typeStats, openDisasterTypeCases]);
  const deadlineNotices = useMemo(() => {
    const today = new Date(`${DASHBOARD_REFERENCE_DATE}T00:00:00`);
    today.setHours(0, 0, 0, 0);
    return buildDisasterEvents(cases)
      .map((event) => ({
        ...event,
        daysRemaining: Math.ceil((event.deadlineAt - today.getTime()) / DAY_IN_MS),
      }))
      .filter((event) => event.deadlineAt && event.daysRemaining >= 0 && event.daysRemaining <= DEADLINE_NOTICE_WINDOW_DAYS)
      .sort((left, right) => left.daysRemaining - right.daysRemaining);
  }, [cases]);
  const dashboardNotices = useMemo(() => [
    ...deadlineNotices.map((event) => ({
      ...event,
      id: `deadline-${event.id}`,
      noticeType: 'deadline',
      message: `${event.name} 사유재산 피해신고 마감까지 ${event.daysRemaining === 0 ? '오늘 마감' : `D-${event.daysRemaining}`}`,
      meta: `신고 기한 ${formatDeadlineDate(event.deadlineAt)}`,
    })),
    ...OPERATIONAL_NOTICES,
  ], [deadlineNotices]);
  const activeNotice = dashboardNotices.length
    ? dashboardNotices[noticeIndex % dashboardNotices.length]
    : null;
  const activeNotificationType = activeNotice?.noticeType || 'work';
  const moveNotice = (direction) => {
    if (dashboardNotices.length <= 1) return;
    if (noticeIntervalRef.current !== null) {
      window.clearInterval(noticeIntervalRef.current);
      noticeIntervalRef.current = null;
    }
    setNoticeIndex((current) => (
      current + direction + dashboardNotices.length
    ) % dashboardNotices.length);
    setNoticeCycleKey((current) => current + 1);
  };

  useEffect(() => {
    fetchCases({ limit: 100, offset: 0 }).catch(() => {});
  }, [fetchCases]);

  useEffect(() => {
    const originalUrlRange = getValidRange(urlStartDate, urlEndDate);
    const urlRange = migrateLegacyDashboardRange(originalUrlRange);
    const storedRange = getValidRange(appliedStartDate, appliedEndDate)
      || DEFAULT_DASHBOARD_RANGE;
    const nextRange = urlRange || storedRange;

    if (
      appliedStartDate !== nextRange.startDate
      || appliedEndDate !== nextRange.endDate
    ) setAppliedRange(nextRange.startDate, nextRange.endDate);

    if (!originalUrlRange || urlRange !== originalUrlRange) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('startDate', nextRange.startDate);
      nextParams.set('endDate', nextRange.endDate);
      setSearchParams(nextParams, { replace: true });
    }
  }, [
    appliedEndDate,
    appliedStartDate,
    searchParams,
    setAppliedRange,
    setSearchParams,
    urlEndDate,
    urlStartDate,
  ]);

  useEffect(() => {
    if (dashboardNotices.length <= 1) return undefined;
    const intervalId = window.setInterval(() => {
      setNoticeIndex((current) => (current + 1) % dashboardNotices.length);
    }, 5000);
    noticeIntervalRef.current = intervalId;
    return () => {
      window.clearInterval(intervalId);
      if (noticeIntervalRef.current === intervalId) noticeIntervalRef.current = null;
    };
  }, [dashboardNotices.length, noticeCycleKey]);

  const handleRangeSubmit = (event) => {
    event.preventDefault();
    const draftRange = { startDate: draftStartDate, endDate: draftEndDate };
    const validationMessage = validateDashboardRange(draftRange);
    setRangeErrorState({ contextKey: rangeContextKey, message: validationMessage });
    if (validationMessage) return;
    setDraftRangeState({
      startDate: draftStartDate,
      endDate: draftEndDate,
      contextKey: rangeContextKey,
    });
    setRangeErrorState({ contextKey: rangeContextKey, message: '' });
    setAppliedRange(draftStartDate, draftEndDate);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('startDate', draftStartDate);
    nextParams.set('endDate', draftEndDate);
    setSearchParams(nextParams);
  };

  const handleRangeReset = () => {
    const { startDate, endDate } = DEFAULT_DASHBOARD_RANGE;
    setDraftRangeState({ startDate, endDate, contextKey: rangeContextKey });
    setRangeErrorState({ contextKey: rangeContextKey, message: '' });
    resetAppliedRange();
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('startDate', startDate);
    nextParams.set('endDate', endDate);
    setSearchParams(nextParams);
  };

  return (
    <div className="dashboard-page light-dashboard">
      {activeNotice && <section className="dashboard-deadline-notice" role="status" aria-live="polite" aria-label="업무 알림">
        <span className={`dashboard-deadline-badge dashboard-notification-badge type-${activeNotificationType}`}>
          {NOTIFICATION_TYPE_LABELS[activeNotificationType] || NOTIFICATION_TYPE_LABELS.work}
        </span>
        <div className="dashboard-deadline-marquee">
          <strong className="dashboard-deadline-message" key={`${activeNotice.id}-${noticeIndex}`}>
            {activeNotice.message}
          </strong>
        </div>
        <div className="dashboard-deadline-meta">
          <span className="dashboard-deadline-date">{activeNotice.meta}</span>
          {dashboardNotices.length > 1 && <div className="dashboard-deadline-navigation" aria-label="업무 안내 이동">
            <button type="button" onClick={() => moveNotice(-1)} aria-label="이전 업무 안내">‹</button>
            <span className="dashboard-deadline-position">{noticeIndex % dashboardNotices.length + 1} / {dashboardNotices.length}</span>
            <button type="button" onClick={() => moveNotice(1)} aria-label="다음 업무 안내">›</button>
          </div>}
        </div>
      </section>}

      <section className="compact-query-panel" aria-labelledby="compact-query-title">
        <div className="compact-query-toolbar">
          <h1 id="compact-query-title">조회 기간</h1>
          <form onSubmit={handleRangeSubmit}>
            <label className="compact-date-field">
              <div>
                <input
                  type="date"
                  value={draftStartDate}
                  onChange={(event) => {
                    setDraftRangeState({
                      startDate: event.target.value,
                      endDate: draftEndDate,
                      contextKey: rangeContextKey,
                    });
                    setRangeErrorState({ contextKey: rangeContextKey, message: '' });
                  }}
                  aria-label="조회 시작일"
                />
                <em>~</em>
                <input
                  type="date"
                  value={draftEndDate}
                  onChange={(event) => {
                    setDraftRangeState({
                      startDate: draftStartDate,
                      endDate: event.target.value,
                      contextKey: rangeContextKey,
                    });
                    setRangeErrorState({ contextKey: rangeContextKey, message: '' });
                  }}
                  aria-label="조회 종료일"
                />
              </div>
            </label>
            <div className="compact-query-actions">
              <button type="submit">조회</button>
              <button type="button" className="compact-query-reset" onClick={handleRangeReset}>초기화</button>
            </div>
          </form>
          {rangeError && <p className="compact-query-error" role="alert">{rangeError}</p>}
        </div>
        <p className="compact-query-meta">조회 결과 <strong>{currentTotal.toLocaleString('ko-KR')}건</strong> · {periodLabel}</p>
      </section>

      <section className="dashboard-main-grid">
        <aside className="dashboard-left-column" aria-label="핵심 현황 및 최근 업무">
          <section className="dashboard-kpi-grid" aria-label="핵심 현황">
            {kpis.map((kpi) => (
              <article className="dashboard-kpi" key={kpi.label}>
                <span className="dashboard-kpi-icon" aria-hidden="true">{kpi.icon}</span>
                <div><span>{kpi.label}</span><strong>{kpi.value}<small>{kpi.unit}</small></strong></div>
              </article>
            ))}
          </section>

          <article className="dashboard-card recent-card">
            <CardTitle title="최근 접수" action="더보기 ›" actionTo={ROUTES.CASES} />
            <ul className="recent-report-list">
              {recentReports.map((item) => (
                <li key={item.frontendKey || item.id || item.case_id}>
                  <strong>{item.case_number}</strong>
                  <span>{formatFacilityType(item.facility)}</span>
                  <span>{item.address}</span>
                </li>
              ))}
              {recentReports.length === 0 && (
                <li className="recent-report-empty">선택한 기간에 접수된 신고가 없습니다.</li>
              )}
            </ul>
          </article>

          <article className="dashboard-card report-summary-card">
            <CardTitle title="보고서" action="전체 보기 ›" actionTo={ROUTES.REPORT_MANAGEMENT} />
            <div className="report-summary-list">
              <div><span>생성 대기</span><strong>{dashboardMetrics.pendingReportCount}<small>건</small></strong></div>
              <div><span>생성 완료</span><strong>{dashboardMetrics.generatedReportCount}<small>건</small></strong></div>
            </div>
          </article>
        </aside>

        <article className="dashboard-card dashboard-map-card">
          <CardTitle title="지역별 피해 현황 지도" />
          <div className="dashboard-map-body">
            <div className="dashboard-map-legend">
              <span><i className="red" />50건 이상</span>
              <span><i className="navy" />20~49건</span>
              <span><i className="gray" />5~19건</span>
              <span><i className="light" />5건 미만</span>
            </div>
            <div className="dashboard-map-canvas">
              <CaseMap ref={mapRef} cases={dashboardMetrics.cases} />
            </div>
            <div className="map-controls">
              <button onClick={() => mapRef.current?.zoomIn()}>＋</button>
              <button onClick={() => mapRef.current?.zoomOut()}>－</button>
              <button onClick={() => mapRef.current?.reset()}>◎</button>
            </div>
          </div>
        </article>

        <aside className="dashboard-right-column">
          <article className="dashboard-card annual-disaster-card">
            <CardTitle title="재난 유형 현황" meta={periodLabel} />
            <div className="annual-donut-content">
              <div
                className="annual-disaster-donut"
                role="img"
                aria-label={`${periodLabel} 전체 ${disasterYearTotal.toLocaleString('ko-KR')}건, ${dashboardMetrics.typeStats.map((item) => `${item.label} ${item.count.toLocaleString('ko-KR')}건`).join(', ')}`}
              >
                <Doughnut data={disasterYearChartData} options={disasterYearChartOptions} />
                <div className="annual-donut-center" aria-hidden="true">
                  <strong>{disasterYearTotal.toLocaleString('ko-KR')}</strong>
                  <span>{disasterYearTotal ? '전체 누적' : '데이터 없음'}</span>
                </div>
              </div>
              <ul className="annual-donut-legend">
                {dashboardMetrics.typeStats.map((item, index) => (
                    <li
                      className={disasterYearTotal > 0 && item.count === disasterYearMax ? 'is-leading' : undefined}
                      key={item.key}
                      role="link"
                      tabIndex={0}
                      aria-label={`${item.label} 신고목록으로 이동`}
                      onClick={() => openDisasterTypeCases(item.label)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          openDisasterTypeCases(item.label);
                        }
                      }}
                      style={{
                        '--annual-legend-color': DISASTER_YEAR_COLORS[index],
                        '--annual-legend-hover-color': DISASTER_YEAR_HOVER_COLORS[index],
                      }}
                    >
                      <i />
                      <span className="annual-legend-name">{item.label}</span>
                      <b>{item.count.toLocaleString('ko-KR')}건</b>
                      <em>{item.percentage}%</em>
                      <span className="annual-legend-bar" aria-hidden="true">
                        <span style={{ width: `${item.percentage}%` }} />
                      </span>
                    </li>
                ))}
              </ul>
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
};

const CardTitle = ({ title, action, meta, actionTo }) => <header className="dashboard-card-title"><strong>{title}</strong><span>{action && actionTo ? <Link to={actionTo} style={{ color: 'inherit', textDecoration: 'none' }}>{action}</Link> : action || meta || 'ⓘ'}</span></header>;

export default DashboardPage;
