import { useEffect } from 'react';
import { useCaseStore } from '../stores/caseStore';
import '../components/dashboard/dashboard.css';

const KPIS = [
  { icon: '☀', label: '재난 발생 (금일)', value: '5', unit: '건', change: '-1건', tone: 'blue' },
  { icon: '▤', label: '피해 신고 (누적)', value: '1,248', unit: '건', change: '+87건', tone: 'red' },
  { icon: '♙', label: '현장 확인 완료', value: '896', unit: '건', change: '+36건', tone: 'red' },
  { icon: '☑', label: '복구 승인 (누적)', value: '562', unit: '건', change: '+22건', tone: 'red' },
  { icon: '▱', label: '지급금 심사 중', value: '314', unit: '건', change: '+18건', tone: 'red' },
  { icon: '₩', label: '지급금 지급 완료', value: '128', unit: '건', change: '+9건', tone: 'red' },
];

const MARKERS = [
  ['서울', 21, 43, 17, 'navy'], ['인천', 17, 39, 22, 'gray'], ['경기', 38, 39, 30, 'navy'],
  ['강원', 25, 66, 26, 'navy'], ['충남', 18, 39, 47, 'gray'], ['세종', 17, 36, 55, 'gray'],
  ['충북', 52, 54, 44, 'red'], ['경북', 55, 64, 51, 'red'], ['전북', 47, 46, 59, 'navy'],
  ['대전', 17, 40, 50, 'gray'], ['전남', 19, 40, 73, 'gray'], ['광주', 29, 36, 80, 'navy'],
  ['경남', 61, 55, 68, 'red'], ['대구', 11, 63, 58, 'gray'], ['울산', 9, 74, 68, 'gray'],
  ['부산', 26, 65, 81, 'navy'], ['제주', 6, 25, 91, 'gray'], ['포항', 3, 78, 40, 'gray'],
];

const REGION_BARS = [
  ['호우', 138], ['태풍', 102], ['산불', 76], ['대설', 59], ['지진', 38],
];

const REPORTS = [
  ['R-0124', '수원시 영통구', '단독주택', 'D54', '2026.07.28 10:21', 'AI 분석 중'],
  ['R-0123', '용인시 처인구', '농경', 'D53', '2026.07.28 10:15', '현장 확인 필요'],
  ['R-0122', '용인시 처인구', '아파트', 'D52', '2026.07.28 10:12', '복구계획 심사'],
  ['R-0121', '울산시 남구', '상가', 'D51', '2026.07.28 10:05', '보완 요청'],
  ['R-0120', '안산시 상록구', '주택', 'D50', '2026.07.28 09:58', '접수 완료'],
];

const DashboardPage = () => {
  const fetchCases = useCaseStore((state) => state.fetchCases);

  useEffect(() => {
    fetchCases({ limit: 100, offset: 0 }).catch(() => {});
  }, [fetchCases]);

  return (
    <div className="dashboard-page light-dashboard">
      <section className="compact-query-panel" aria-labelledby="compact-query-title">
        <h1 id="compact-query-title">재난 현황 조회</h1>
        <form onSubmit={(event) => event.preventDefault()}>
          <label className="compact-date-field">
            <span>기간</span>
            <div>
              <input type="date" defaultValue="2026-07-17" aria-label="조회 시작일" />
              <em>~</em>
              <input type="date" defaultValue="2026-07-30" aria-label="조회 종료일" />
            </div>
          </label>
          <button type="submit">조회</button>
        </form>
      </section>

      <section className="dashboard-kpi-grid" aria-label="핵심 현황">
        {KPIS.map((kpi) => (
          <article className="dashboard-kpi" key={kpi.label}>
            <span className="dashboard-kpi-icon" aria-hidden="true">{kpi.icon}</span>
            <div><span>{kpi.label}</span><strong>{kpi.value}<small>{kpi.unit}</small></strong></div>
            <footer>전일 대비 <b className={kpi.tone}>{kpi.change}</b></footer>
          </article>
        ))}
      </section>

      <section className="dashboard-main-grid">
        <aside className="dashboard-left-column">
          <article className="dashboard-card recent-card">
            <CardTitle title="최근 접수" action="더보기 ›" />
            <ul className="recent-report-list">
              {REPORTS.slice(0, 4).map((row) => (
                <li key={row[0]}>
                  <strong>{row[0]}</strong>
                  <span>{row[2]} · {row[3]}</span>
                  <span>{row[1]}</span>
                  <em>{row[5]}</em>
                </li>
              ))}
            </ul>
          </article>

          <article className="dashboard-card shelter-card">
            <CardTitle title="임시 시설" />
            <div className="shelter-stats">
              <Metric label="운영 시설" value="4" unit="개소" />
              <Metric label="지원 필요" value="18" unit="가구" />
              <Metric label="배정 완료" value="12" unit="가구" />
              <Metric label="미배정" value="6" unit="가구" danger />
            </div>
          </article>

          <article className="dashboard-card report-summary-card">
            <CardTitle title="보고서" action="전체 보기 ›" />
            <div className="report-summary-list">
              <div><span>작성 대기</span><strong>12<small>건</small></strong></div>
              <div><span>검토 중</span><strong>8<small>건</small></strong></div>
              <div><span>작성 완료</span><strong>34<small>건</small></strong></div>
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
            <img src="/korea-administrative-map.png" alt="대한민국 지역별 피해 현황 지도" />
            {MARKERS.map(([name, count, x, y, tone]) => (
              <span className={`light-map-marker ${tone}`} style={{ left: `${x}%`, top: `${y}%` }} key={name}>
                <b>{count}</b><small>{name}</small>
              </span>
            ))}
            <div className="map-controls" aria-hidden="true"><button>＋</button><button>－</button><button>◎</button></div>
          </div>
        </article>

        <aside className="dashboard-right-column">
          <article className="dashboard-card disaster-chart-card">
            <CardTitle title="재난 유형별 누적 건수" meta="(건)" />
            <div className="disaster-chart-total"><span>전체 누적</span><strong>1,248<small>건</small></strong></div>
            <div className="vertical-chart">
              {REGION_BARS.map(([name, value]) => (
                <div key={name}><b>{value}</b><i style={{ height: `${(value / 138) * 100}%` }} /><span>{name}</span></div>
              ))}
            </div>
          </article>

          <article className="dashboard-card disaster-chart-card compact">
            <CardTitle title="재난 현황" meta="(건)" />
            <div className="disaster-pie-wrap">
              <div className="disaster-pie" role="img" aria-label="호우 28건, 태풍 20건, 산불 15건, 대설 12건">
                <strong>75<small>건</small></strong>
              </div>
              <ul className="disaster-pie-legend">
                <li><i />호우 <b>28건</b></li>
                <li><i />태풍 <b>20건</b></li>
                <li><i />산불 <b>15건</b></li>
                <li><i />대설 <b>12건</b></li>
              </ul>
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
};

const CardTitle = ({ title, action, meta }) => <header className="dashboard-card-title"><strong>{title}</strong><span>{action || meta || 'ⓘ'}</span></header>;
const Metric = ({ label, value, unit, danger = false }) => <div><span>{label}</span><strong className={danger ? 'danger' : ''}>{value}<small>{unit}</small></strong></div>;

export default DashboardPage;
