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

import { useEffect, useRef } from 'react';
import CaseMap from '../components/dashboard/CaseMap';
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

const DISASTER_YEAR_STATS = [
  ['호우', 412],
  ['태풍', 286],
  ['산불', 214],
  ['대설', 183],
  ['지진', 153],
];

const REPORTS = [
  ['R-0124', '수원시 영통구', '단독주택', '2026.07.28 10:21'],
  ['R-0123', '용인시 처인구', '농경지', '2026.07.28 10:15'],
  ['R-0122', '용인시 처인구', '아파트', '2026.07.28 10:12'],
  ['R-0121', '울산시 남구', '상가', '2026.07.28 10:05'],
  ['R-0120', '안산시 상록구', '주택', '2026.07.28 09:58'],
];

const DashboardPage = () => {
  const fetchCases = useCaseStore((state) => state.fetchCases);
  const mapRef = useRef(null);

  useEffect(() => {
    fetchCases({ limit: 100, offset: 0 }).catch(() => {});
  }, [fetchCases]);

  return (
    <div className="dashboard-page light-dashboard">
      <section className="dashboard-deadline-notice" role="status" aria-label="사유재산 피해신고 마감기한 안내">
        <span className="dashboard-deadline-badge">마감 임박</span>
        <strong>7.17 ~ 7.24 호우 사유재산 피해신고 마감까지 3일 남았습니다.</strong>
        <span className="dashboard-deadline-date">신고 기한 2026.08.03</span>
      </section>

      <section className="compact-query-panel" aria-labelledby="compact-query-title">
        <h1 id="compact-query-title">재난 현황 조회</h1>
        <form onSubmit={(event) => event.preventDefault()}>
          <label className="compact-date-field">
            <span>기간</span>
            <div>
              <input type="date" defaultValue="2025-07-30" aria-label="조회 시작일" />
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
                  <span>{row[2]}</span>
                  <span>{row[1]}</span>
                </li>
              ))}
            </ul>
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
            <div className="dashboard-map-canvas">
              <CaseMap ref={mapRef} />
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
            <CardTitle title="재난 유형 현황" meta="최근 1년 기준" />
            <div className="annual-donut-content">
              <div
                className="annual-disaster-donut"
                role="img"
                aria-label="최근 1년 전체 1,248건 중 호우 412건, 태풍 286건, 산불 214건, 대설 183건, 지진 153건"
              >
                <div><strong>1,248</strong><span>전체 누적</span></div>
                {DISASTER_YEAR_STATS.map(([name, value], index) => (
                  <span
                    className={`annual-donut-percent annual-donut-percent-${index + 1}`}
                    key={`${name}-percent`}
                    aria-hidden="true"
                  >
                    {Math.round((value / 1248) * 100)}%
                  </span>
                ))}
              </div>
              <ul className="annual-donut-legend">
                {DISASTER_YEAR_STATS.map(([name, value]) => (
                  <li key={name}><i /><span>{name}</span><b>{value.toLocaleString('ko-KR')}건</b></li>
                ))}
              </ul>
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
};

const CardTitle = ({ title, action, meta }) => <header className="dashboard-card-title"><strong>{title}</strong><span>{action || meta || 'ⓘ'}</span></header>;

export default DashboardPage;