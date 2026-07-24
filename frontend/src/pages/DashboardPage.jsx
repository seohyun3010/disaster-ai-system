import { useNavigate } from 'react-router-dom';
import { useCaseStore } from '../stores/caseStore';
import { ROUTES } from '../routes/routeConfig';
import SatelliteDamageMap from '../components/dashboard/SatelliteDamageMap';

const DashboardPage = () => {
  const navigate = useNavigate();
  const cases = useCaseStore((state) => state.cases);
  const metrics = [
    { label: '전체 신고', value: cases.length, note: '신고 목록 기준', tone: 'default' },
    { label: '검토 필요', value: cases.filter((item) => item.status === '검토 필요').length, note: '우선 확인 대상', tone: 'danger' },
    { label: 'AI 분석 대기', value: cases.filter((item) => item.status === 'AI 분석 대기').length, note: '분석 요청 순서 대기', tone: 'info' },
    { label: 'AI 분석 완료', value: cases.filter((item) => item.status === 'AI 분석 완료').length, note: '공무원 검토 가능', tone: 'success' },
  ];
  const priorityCases = cases.filter((item) => item.status === '검토 필요' || item.urgency === '긴급').slice(0, 4);

  return <div className="case-page">
    <header className="case-page-head"><div><p>업무 현황 / 신고 대시보드</p><h1>신고 대시보드</h1><span>처리 상태와 우선 확인이 필요한 재해 신고를 한눈에 확인합니다.</span></div><button className="primary-action" onClick={() => navigate(ROUTES.CASES)}>신고 목록 보기</button></header>
    <section className="case-metric-grid">{metrics.map((item) => <article key={item.label} className={`case-metric ${item.tone}`}><span>{item.label}</span><strong>{item.value}<small>건</small></strong><p>{item.note}</p></article>)}</section>
    <section className="dashboard-workspace">
      <article className="case-card dashboard-summary"><div className="section-heading"><div><h2>오늘 확인할 업무</h2><p>검토 필요 및 중복 의심 신고를 우선 처리해 주세요.</p></div><button className="text-action" onClick={() => navigate(ROUTES.CASES)}>전체 보기 →</button></div><div className="priority-stat"><div><span>검토 필요</span><b>{metrics[1].value}건</b></div><div><span>긴급 신고</span><b>{cases.filter((item) => item.urgency === '긴급').length}건</b></div><div><span>중복 의심</span><b>{cases.filter((item) => item.duplicate).length}건</b></div></div></article>
      <SatelliteDamageMap cases={cases} />
      <article className="case-card priority-table-card"><div className="section-heading"><div><h2>우선 확인 신고</h2><p>긴급도와 중복 의심 여부를 기준으로 표시합니다.</p></div></div><div className="case-table-wrap"><table className="case-table dashboard-priority-table"><thead><tr><th>사건번호</th><th>피해 위치</th><th>상태</th><th /></tr></thead><tbody>{priorityCases.map((item) => <tr key={item.id}><td><strong>{item.id}</strong><small>{item.reportedAt}</small></td><td>{item.location}</td><td><span className={`urgency-badge ${item.urgency}`}>{item.urgency}</span>{item.duplicate && <span className="duplicate-badge">의심</span>}</td><td><button className="row-action" onClick={() => navigate(`/cases/${item.id}`)}>상세</button></td></tr>)}</tbody></table></div></article>
    </section>
  </div>;
};

export default DashboardPage;
