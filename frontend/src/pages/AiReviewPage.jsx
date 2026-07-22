import { useNavigate, useParams } from 'react-router-dom';
import AnalysisDecisionPanel from '../components/analysis/AnalysisDecisionPanel';
import AnalysisResultCard from '../components/analysis/AnalysisResultCard';
import ImageComparisonViewer from '../components/analysis/ImageComparisonViewer';
import CaseProgressStepper from '../components/case/CaseProgressStepper';
import StageNavigation from '../components/case/StageNavigation';
import { useAnalysisStore } from '../stores/analysisStore';
import { useCaseStore } from '../stores/caseStore';

const AiReviewPage = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const item = useCaseStore((state) => state.cases.find((entry) => entry.id === caseId));
  const analysis = useAnalysisStore((state) => state.analyses[caseId]);
  const submitReview = useAnalysisStore((state) => state.submitReview);

  if (!item) return <div className="case-page"><section className="case-card missing-case"><h1>신고 정보를 찾을 수 없습니다</h1><button type="button" className="secondary-action" onClick={() => navigate('/cases')}>신고 목록으로</button></section></div>;

  if (!analysis || analysis.status !== 'completed' || !analysis.result) return <div className="case-page"><header className="case-page-head"><div><p>AI 분석 / 결과 검토</p><h1>AI 결과 검토</h1></div></header><CaseProgressStepper /><section className="case-card review-unavailable"><h2>완료된 분석 결과가 없습니다</h2><p>AI 분석을 먼저 완료한 뒤 결과를 검토할 수 있습니다.</p><button type="button" className="primary-action" onClick={() => navigate(`/cases/${caseId}/analysis`)}>분석 페이지로 이동</button></section></div>;

  return <div className="case-page">
    <header className="case-page-head"><div><p>AI 분석 / 결과 검토</p><h1>AI 분석 결과 검토</h1><span>AI 판정 근거와 피해 영역을 확인하고 피해등급을 검토합니다.</span></div><button type="button" className="secondary-action" onClick={() => navigate(`/cases/${caseId}/analysis`)}>분석 상태로 돌아가기</button></header>
    <CaseProgressStepper />
    <section className="case-card analysis-case-summary"><div><span>사건번호</span><strong>{item.id}</strong></div><div><span>jobId</span><strong>{analysis.jobId}</strong></div><div><span>검토 상태</span><strong><i className={`review-status-badge ${analysis.reviewStatus.replaceAll(' ', '-')}`}>{analysis.reviewStatus}</i></strong></div></section>
    <section className="analysis-review-grid"><ImageComparisonViewer item={item} result={analysis.result} /><AnalysisResultCard analysis={analysis} /></section>
    <AnalysisDecisionPanel recommendedGrade={analysis.result.recommendedGrade} reviewStatus={analysis.reviewStatus} onSubmit={(review) => submitReview(caseId, review)} />
    <StageNavigation previousPath={`/cases/${caseId}/analysis`} previousLabel="분석 상태" nextPath={`/cases/${caseId}/severity`} nextLabel="심각도·복구 긴급도" />
  </div>;
};

export default AiReviewPage;
