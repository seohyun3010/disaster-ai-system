import { Card, PageHead } from '../components/common/Workflow';

const factors = [['피해 규모',92],['지역 밀집도',84],['복구 긴급성',88],['취약계층 영향',76]];
const StatisticsPage = () => <>
  <PageHead stage={2} title="피해 심각도 산정" description="AI 분석 결과와 관련 기준을 종합해 피해 심각도와 복구 긴급도 산정 근거를 확인합니다." badge="긴급도 산정" />
  <div className="three-col">
    <Card title="피해 심각도 및 복구 긴급도" sub="AI 피해조사 결과와 지역 지표를 종합한 산정"><div className="score">87.6 <small>점</small><em>긴급도 높음</em></div><p className="callout">피해 규모와 지역 밀집도가 높고 도로 접근성 영향이 있어 우선 검토가 필요합니다.</p>{factors.map(([n,v])=><div className="factor" key={n}><b>{n}</b><span>{v}점</span><i><u style={{width:`${v}%`}}/></i></div>)}</Card>
    <Card title="지역별 피해 밀집도" sub="신고 위치와 시설 결과를 지도 기반으로 집계"><div className="density"><div className="land"/><i/><i/><i/><i/></div><p className="card-note">지도에서 피해 밀집 지역을 확인하고 복구 긴급도 산정 근거로 활용합니다.</p></Card>
    <Card title="문서 RAG 반영 기준" sub="관련 기준은 판단 보조 근거로 표시"><div className="rag">{['사유재산 피해조사 기준','자연재난 복구비 산정기준','취약계층 지원 기준','복구사업 처리 기준'].map(x=><div key={x}><b>{x}</b><span>판단 근거 및 관련 규정 참조</span></div>)}</div></Card>
  </div>
  <Card title="복구사업 진행관리 정보" sub="심각도 산정 결과가 이후 복구사업 관리에 반영됨"><div className="management">{[['군산 대야면','긴급도 높음','현장 확인 필요','진행 전'],['상주 함창읍','긴급도 높음','교량 안전점검','지연'],['익산 용안면','긴급도 중간','주택 복구비 산정','진행 중']].map(r=><div key={r[0]}>{r.map(v=><span key={v}>{v}</span>)}</div>)}</div></Card>
</>;
export default StatisticsPage;
