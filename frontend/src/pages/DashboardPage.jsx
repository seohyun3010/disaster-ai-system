import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DISASTER_EVENTS, isCaseInDisasterEvent } from '../mocks/disasterEvents';
import { ROUTES } from '../routes/routeConfig';
import { useAnalysisStore } from '../stores/analysisStore';
import { useCaseStore } from '../stores/caseStore';
import { useWorkflowStore } from '../stores/workflowStore';
import { buildFinalReportRecords } from '../utils/reportRecords';
import '../components/dashboard/dashboard.css';

const EVENT_DASHBOARD_META = {
  'rain-2026-0717': {
    reviewRate: 40,
    locations: ['충북 청주시 상당구', '충북 제천시 봉양읍', '충북 보은군 마로면'],
    reportDates: ['2026.07.22 14:00', '2026.07.20 11:35'],
  },
  'wildfire-2026-0324': {
    totalCount: 68,
    reviewRate: 100,
    locations: ['경북 의성군 안평면', '경북 안동시 길안면', '경남 산청군 시천면'],
    scores: [96, 91, 84],
    reportDates: ['2026.04.07 17:20', '2026.04.07 15:45'],
  },
  'rain-2025-0716': {
    reviewRate: 100,
    locations: ['충남 예산군', '전북 익산시', '경기 파주시'],
    scores: [94, 88, 80],
    reportDates: ['2025.07.30 18:10', '2025.07.30 16:40'],
  },
  'typhoon-2025-0830': {
    reviewRate: 100,
    locations: ['부산광역시 강서구', '경남 창원시', '제주특별자치도 서귀포시'],
    scores: [93, 87, 78],
    reportDates: ['2025.09.12 17:30', '2025.09.12 14:20'],
  },
  'wildfire-2025-0406': {
    reviewRate: 100,
    locations: ['경북 영덕군', '울산광역시 울주군', '강원특별자치도 삼척시'],
    scores: [95, 89, 82],
    reportDates: ['2025.04.20 18:00', '2025.04.20 15:10'],
  },
  'typhoon-2025-0919': {
    reviewRate: 100,
    locations: ['전남 여수시', '경남 통영시', '부산광역시 기장군'],
    scores: [92, 86, 79],
    reportDates: ['2025.10.03 17:45', '2025.10.03 13:25'],
  },
  'heavy-snow-2025-0203': {
    reviewRate: 100,
    locations: ['강원특별자치도 평창군', '충북 제천시', '경북 봉화군'],
    scores: [90, 85, 77],
    reportDates: ['2025.02.17 16:50', '2025.02.17 14:05'],
  },
  'earthquake-2025-0612': {
    reviewRate: 100,
    locations: ['충북 옥천군', '대전광역시 동구', '충남 금산군'],
    scores: [91, 83, 76],
    reportDates: ['2025.06.24 17:10', '2025.06.24 15:30'],
  },
};

const REGION_MARKERS = [
  { name: '서울', x: 27, y: 21 },
  { name: '부산', x: 69, y: 60 },
  { name: '대구', x: 62, y: 49 },
  { name: '인천', x: 19, y: 22 },
  { name: '광주', x: 31, y: 63 },
  { name: '대전', x: 40, y: 41 },
  { name: '울산', x: 73, y: 55 },
  { name: '세종', x: 35, y: 36 },
  { name: '경기', x: 32, y: 16 },
  { name: '강원', x: 59, y: 17 },
  { name: '충북', x: 49, y: 33 },
  { name: '충남', x: 27, y: 38 },
  { name: '전북', x: 41, y: 51 },
  { name: '전남', x: 26, y: 69 },
  { name: '경북', x: 65, y: 39 },
  { name: '경남', x: 55, y: 58 },
  { name: '제주', x: 21, y: 94 },
];

const REGION_ALIASES = [
  { name: '서울', prefixes: ['서울특별시', '서울시', '서울'] },
  { name: '부산', prefixes: ['부산광역시', '부산시', '부산'] },
  { name: '대구', prefixes: ['대구광역시', '대구시', '대구'] },
  { name: '인천', prefixes: ['인천광역시', '인천시', '인천'] },
  { name: '광주', prefixes: ['광주광역시', '광주시', '광주'] },
  { name: '대전', prefixes: ['대전광역시', '대전시', '대전'] },
  { name: '울산', prefixes: ['울산광역시', '울산시', '울산'] },
  { name: '세종', prefixes: ['세종특별자치시', '세종시', '세종'] },
  { name: '경기', prefixes: ['경기도', '경기'] },
  { name: '강원', prefixes: ['강원특별자치도', '강원도', '강원'] },
  { name: '충북', prefixes: ['충청북도', '충북'] },
  { name: '충남', prefixes: ['충청남도', '충남'] },
  { name: '전북', prefixes: ['전북특별자치도', '전라북도', '전북'] },
  { name: '전남', prefixes: ['전라남도', '전남'] },
  { name: '경북', prefixes: ['경상북도', '경북'] },
  { name: '경남', prefixes: ['경상남도', '경남'] },
  { name: '제주', prefixes: ['제주특별자치도', '제주도', '제주'] },
];

const URGENCY_FALLBACK_SCORES = { 긴급: 85, 높음: 70, 보통: 50, 낮음: 30 };
const RANK_LABELS = ['금', '은', '동'];

const resolveRegionName = (location = '') => {
  const normalizedLocation = location.trim();
  return REGION_ALIASES.find(({ prefixes }) => (
    prefixes.some((prefix) => normalizedLocation.startsWith(prefix))
  ))?.name || null;
};

const getCompactEventCode = (event) => event.id
  .replace(/[^0-9]/g, '')
  .slice(-6)
  .padStart(6, '0');

const buildLinkedPriorities = (event, meta) => {
  const eventCode = getCompactEventCode(event);
  return (meta.locations || []).map((location, index) => ({
    id: `NDMS-${event.year}-${eventCode}-${String(index + 1).padStart(4, '0')}`,
    type: event.name.split(' ').slice(-1)[0],
    facility: meta.facilities?.[index] || ['주택', '도로', '농경지'][index] || '기타',
    location,
    urgencyScore: meta.scores?.[index] || [92, 86, 78][index],
    status: event.status === '진행중' ? '검토 필요' : '처리 완료',
    linkedPreview: true,
  }));
};

const buildRegionCounts = (eventCases, priorities, totalCount) => {
  const counts = Object.fromEntries(REGION_MARKERS.map(({ name }) => [name, 0]));

  if (eventCases.length > 0) {
    eventCases.forEach((item) => {
      const region = resolveRegionName(item.location);
      if (region) counts[region] += 1;
    });
    return counts;
  }

  const affectedRegions = [...new Set(
    priorities.map((item) => resolveRegionName(item.location)).filter(Boolean),
  )];
  if (affectedRegions.length === 0 || totalCount === 0) return counts;

  const weights = [0.46, 0.32, 0.22];
  let allocated = 0;
  affectedRegions.forEach((region, index) => {
    const isLast = index === affectedRegions.length - 1;
    const count = isLast
      ? totalCount - allocated
      : Math.round(totalCount * (weights[index] || 1 / affectedRegions.length));
    counts[region] = Math.max(count, 0);
    allocated += count;
  });
  return counts;
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const cases = useCaseStore((state) => state.cases);
  const analyses = useAnalysisStore((state) => state.analyses);
  const workflows = useWorkflowStore((state) => state.workflows);
  const [selectedEventId, setSelectedEventId] = useState(DISASTER_EVENTS[0].id);
  const [regionView, setRegionView] = useState('map');

  const selectedEvent = useMemo(
    () => DISASTER_EVENTS.find((event) => event.id === selectedEventId) || DISASTER_EVENTS[0],
    [selectedEventId],
  );

  const eventCases = useMemo(
    () => cases.filter((item) => isCaseInDisasterEvent(item, selectedEvent)),
    [cases, selectedEvent],
  );

  const finalReports = useMemo(
    () => buildFinalReportRecords({ cases, analyses, workflows }),
    [analyses, cases, workflows],
  );

  const dashboardData = useMemo(() => {
    const meta = EVENT_DASHBOARD_META[selectedEvent.id] || {
      reviewRate: selectedEvent.status === '진행완료' ? 100 : 0,
      locations: [],
    };
    const actualPriorities = eventCases
      .map((item) => ({
        ...item,
        urgencyScore: Number(
          item.urgencyScore
          ?? item.severityScore
          ?? URGENCY_FALLBACK_SCORES[item.urgency]
          ?? 0,
        ),
      }))
      .sort((a, b) => b.urgencyScore - a.urgencyScore)
      .slice(0, 5);
    const totalCount = eventCases.length > 0
      ? eventCases.length
      : Number(selectedEvent.reportCount ?? meta.totalCount ?? 0);
    const priorities = totalCount === 0
      ? []
      : actualPriorities.length > 0
        ? actualPriorities
        : buildLinkedPriorities(selectedEvent, meta);
    const reviewRate = meta.reviewRate;

    return {
      totalCount,
      reviewRate,
      reviewedCount: Math.round(totalCount * reviewRate / 100),
      priorities,
      reports: finalReports
        .filter((report) => eventCases.some((item) => item.id === report.caseId))
        .slice(0, 2),
      regionCounts: buildRegionCounts(eventCases, priorities, totalCount),
    };
  }, [eventCases, finalReports, selectedEvent]);

  const ongoingEvent = DISASTER_EVENTS.find((event) => event.status === '진행중') || DISASTER_EVENTS[0];
  const maxRegionCount = Math.max(...Object.values(dashboardData.regionCounts), 1);

  return (
    <div className="case-page dashboard-page">
      <section className="dashboard-deadline-notice" aria-label="사유재산 피해신고 기한 안내">
        <span className="dashboard-deadline-icon" aria-hidden="true">!</span>
        <div className="dashboard-deadline-copy">
          <strong>사유재산 피해신고 기한 임박</strong>
          <span>
            {ongoingEvent.name} 관련 신고는 {ongoingEvent.filingDeadline}까지 접수해야 합니다.
          </span>
        </div>
        <span className="dashboard-deadline-dday">마감 D-5</span>
      </section>

      <section className="dashboard-event-selector">
        <div>
          <span className="dashboard-eyebrow">연동 자연재난</span>
          <h1>재난별 처리 현황</h1>
        </div>
        <label className="dashboard-event-field">
          <span>조회 재난</span>
          <select
            value={selectedEvent.id}
            onChange={(event) => setSelectedEventId(event.target.value)}
          >
            {DISASTER_EVENTS.map((event) => (
              <option key={event.id} value={event.id}>
                {event.year} · {event.name}
              </option>
            ))}
          </select>
        </label>
        <span className={`dashboard-event-status ${selectedEvent.status === '진행중' ? 'is-active' : ''}`}>
          {selectedEvent.status}
        </span>
      </section>

      <section className="dashboard-overview-grid">
        <article className="dashboard-panel dashboard-map-panel">
          <header className="dashboard-panel-header">
            <div>
              <h2>지역별 신고 현황</h2>
            </div>
            <div className="dashboard-view-toggle" role="tablist" aria-label="지역 현황 보기 방식">
              <button
                type="button"
                role="tab"
                aria-selected={regionView === 'map'}
                className={regionView === 'map' ? 'is-active' : ''}
                onClick={() => setRegionView('map')}
              >
                지도
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={regionView === 'chart'}
                className={regionView === 'chart' ? 'is-active' : ''}
                onClick={() => setRegionView('chart')}
              >
                그래프
              </button>
            </div>
          </header>

          {regionView === 'map' ? (
            <div className="dashboard-map-content" role="tabpanel">
              <div className="dashboard-map-stage">
                <img
                  src="/korea-administrative-map.png"
                  alt="대한민국 광역자치단체 행정구역 지도"
                />
                {REGION_MARKERS.map((region) => {
                  const count = dashboardData.regionCounts[region.name] || 0;
                  return (
                    <span
                      key={region.name}
                      className={`dashboard-region-marker ${count > 0 ? 'has-cases' : ''}`}
                      style={{ left: `${region.x}%`, top: `${region.y}%` }}
                      title={`${region.name} ${count.toLocaleString()}건`}
                    >
                      <b>{region.name}</b>
                      <em>{count.toLocaleString()}</em>
                    </span>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="dashboard-column-chart" role="tabpanel">
              <span className="dashboard-chart-y-title">건수</span>
              <div className="dashboard-column-scroll">
                <div className="dashboard-column-plot">
                  <div className="dashboard-chart-y-labels" aria-hidden="true">
                    <span>{maxRegionCount.toLocaleString()}</span>
                    <span>{Math.round(maxRegionCount * 0.75).toLocaleString()}</span>
                    <span>{Math.round(maxRegionCount * 0.5).toLocaleString()}</span>
                    <span>{Math.round(maxRegionCount * 0.25).toLocaleString()}</span>
                    <span>0</span>
                  </div>
                  <div className="dashboard-chart-bars">
                    {REGION_MARKERS.map((region) => {
                      const count = dashboardData.regionCounts[region.name] || 0;
                      const height = count === 0
                        ? 0
                        : Math.max((count / maxRegionCount) * 100, 3);
                      return (
                        <div className="dashboard-chart-column" key={region.name}>
                          <span>{count.toLocaleString()}</span>
                          <div aria-hidden="true">
                            <i
                              className={count > 0 ? 'has-cases' : ''}
                              style={{ height: `${height}%` }}
                            />
                          </div>
                          <strong>{region.name}</strong>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <span className="dashboard-chart-x-title">지역</span>
            </div>
          )}
        </article>

        <aside className="dashboard-overview-aside">
          <div className="dashboard-side-kpis">
            <article className="dashboard-side-kpi">
              <span>전체 사건수</span>
              <strong>{dashboardData.totalCount.toLocaleString()}<small>건</small></strong>
              <p>{selectedEvent.name} 기준</p>
            </article>
            <article className="dashboard-side-kpi dashboard-review-kpi">
              <div>
                <span>검토율</span>
                <b>{dashboardData.reviewRate}%</b>
              </div>
              <strong>{dashboardData.reviewedCount.toLocaleString()}<small>건 검토</small></strong>
              <div className="dashboard-rate-track" aria-hidden="true">
                <span style={{ width: `${dashboardData.reviewRate}%` }} />
              </div>
            </article>
          </div>

          <article className="dashboard-panel dashboard-priority-panel">
            <header className="dashboard-panel-header">
              <div>
                <span className="dashboard-eyebrow">긴급도 점수 기준</span>
                <h2>우선 처리 순위</h2>
              </div>
              <span className="dashboard-panel-count">상위 3건</span>
            </header>
            {dashboardData.priorities.length > 0 ? (
              <ol className="dashboard-priority-list">
                {dashboardData.priorities.slice(0, 3).map((item, index) => (
                  <li
                    key={item.id}
                    className={item.linkedPreview ? '' : 'is-clickable'}
                    onClick={() => {
                      if (!item.linkedPreview) navigate(`/cases/${item.id}`);
                    }}
                  >
                    <span className={`dashboard-rank rank-${index + 1}`}>{index + 1}</span>
                    {RANK_LABELS[index] && <span className="sr-only">{RANK_LABELS[index]}</span>}
                    <div>
                      <strong>{item.facility || '기타'}</strong>
                      <span>{item.location}</span>
                    </div>
                    <b className="dashboard-score">{item.urgencyScore}점</b>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="dashboard-empty-state">등록된 신고가 없습니다.</p>
            )}
          </article>

          <article className="dashboard-panel dashboard-report-panel">
            <header className="dashboard-panel-header">
              <div>
                <span className="dashboard-eyebrow">보고서 관리</span>
                <h2>최근 보고서 이력</h2>
              </div>
              <button type="button" onClick={() => navigate(ROUTES.REPORT_MANAGEMENT)}>
                전체 보기
              </button>
            </header>
            {dashboardData.reports.length > 0 ? (
              <ul className="dashboard-report-list">
                {dashboardData.reports.map((report) => (
                  <li key={report.id}>
                    <button
                      type="button"
                      className="dashboard-report-entry"
                      onClick={() => navigate(`/cases/${report.caseId}/reports`)}
                    >
                      <span className="dashboard-report-icon" aria-hidden="true">문서</span>
                      <div>
                        <strong>{report.title}</strong>
                        <span>{report.caseId}</span>
                        <time>{report.createdAt}</time>
                      </div>
                      <span className="dashboard-report-status">{report.status}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="dashboard-empty-state">생성된 보고서가 없습니다.</p>
            )}
          </article>
        </aside>
      </section>
    </div>
  );
};

export default DashboardPage;
