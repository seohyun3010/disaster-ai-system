import { Card, PageHead } from '../components/common/Workflow';

const reports = [['NDMS-0048','김민수','주택','청주시','검토 필요'],['NDMS-0042','박서연','농경지','보은군','현장 확인'],['NDMS-0039','이정훈','상가','공주시','분석 대기'],['NDMS-0031','최유라','주택','천안시','분석 완료'],['NDMS-0028','장현우','도로','논산시','검토 필요']];

const DashboardPage = () => <>
  <PageHead stage={0} title="피해신고 현황" description="재난 유형·기간·지역과 업무 상태를 기준으로 오늘 우선 처리할 신고를 선별합니다." badge="현황 파악" />
  <Card title="검색 조건" sub="필터 변경 시 지도와 신고 목록이 함께 갱신됩니다." className="filters">
    {['재난 유형  집중호우','기간  2026.07.14 ~ 2026.07.16','지역  충청권','상태  검토 필요'].map(x => <button key={x}>{x}<span>⌄</span></button>)}
  </Card>
  <div className="metrics">
    {[['전체 피해신고','1,284건'],['검토 필요','96건'],['AI 분석 대기','412건'],['AI 분석 완료','872건']].map((x,i)=><Card key={x[0]} title={x[0]}><strong className={`metric m${i}`}>{x[1]}</strong><small>전일 대비 현황</small></Card>)}
    <Card title="오늘 처리해야 할 업무"><div className="todo"><span>검토 필요<br/><b>96건</b></span><span>현장 확인<br/><b>18건</b></span><span>중복 검증<br/><b>6건</b></span></div></Card>
  </div>
  <div className="dashboard-grid">
    <Card title="지도 기반 피해 현황" sub="지역별 피해 건수와 처리 상태를 함께 표시" className="map-card"><div className="korea-map"><div className="land" />{[['경기','96',28,18],['충청','128',24,48],['경상','74',68,50],['전라','58',20,70],['강원','42',68,20],['제주','18',60,83]].map(x=><span key={x[0]} style={{left:`${x[2]}%`,top:`${x[3]}%`}}><b>{x[0]}</b> {x[1]}</span>)}</div></Card>
    <Card title="충청권 피해신고 목록" sub="검토 필요 및 현장 확인 권고 건을 우선 표시"><div className="report-list">{reports.map((r,i)=><div key={r[0]} className={i===0?'selected':''}>{r.slice(0,4).map(v=><span key={v}>{v}</span>)}<em>{r[4]}</em></div>)}</div></Card>
  </div>
  <Card title="현황 파악 업무 흐름" className="flow-card"><div className="flow">{['업무 상태 확인','지도 지역 선택','신고 목록 필터링','신고건 선택'].map((x,i)=><div key={x}><b>{i+1}</b><span>{x}<small>다음 단계 업무를 확인합니다</small></span></div>)}</div></Card>
</>;
export default DashboardPage;
