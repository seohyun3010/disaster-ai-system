import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AnalysisStatus from '../components/analysis/AnalysisStatus';
import CaseProgressStepper from '../components/case/CaseProgressStepper';
import { ReviewGuidance } from '../components/persona/ReviewGuidance';
import { ANALYSIS_POLLING_INTERVAL } from '../api/analysisApi';
import { useAnalysisStore } from '../stores/analysisStore';
import { useCaseStore } from '../stores/caseStore';

const EMPTY_ANALYSIS = { status: 'idle', jobId: null, result: null, error: null };

const AiAnalysisPage = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const item = useCaseStore((state) => state.cases.find((entry) => entry.id === caseId));
  const analysis = useAnalysisStore((state) => state.analyses[caseId] || EMPTY_ANALYSIS);
  const requestAnalysis = useAnalysisStore((state) => state.requestAnalysis);
  const refreshAnalysis = useAnalysisStore((state) => state.refreshAnalysis);
  const originalPhoto = item?.photos?.[0] || (item?.photoUrl ? { url: item.photoUrl, name: item.photoName || '원본 피해 사진' } : null);

  useEffect(() => {
    if (!analysis.jobId || !['queued', 'processing'].includes(analysis.status)) return undefined;
    refreshAnalysis(caseId);
    const intervalId = window.setInterval(() => refreshAnalysis(caseId), ANALYSIS_POLLING_INTERVAL);
    return () => window.clearInterval(intervalId);
  }, [analysis.jobId, analysis.status, caseId, refreshAnalysis]);

  if (!item) return <div className="case-page"><section className="case-card missing-case"><h1>신고 정보를 찾을 수 없습니다</h1><button type="button" className="secondary-action" onClick={() => navigate('/cases')}>신고 목록으로</button></section></div>;

  return <div className="case-page">
    <header className="case-page-head"><div><p>AI 분석 / 진행 상태</p><h1>AI 피해 분석</h1><span>신고 이미지의 피해 영역과 등급 분석 진행 상태를 확인합니다.</span></div><button type="button" className="secondary-action" onClick={() => navigate(`/cases/${caseId}`)}>신고 상세로 돌아가기</button></header>
    <CaseProgressStepper />
    <ReviewGuidance current="AI 분석 요청 및 진행 상태 확인" next="분석 완료 후 원본·분석 이미지와 판정 근거 검토" caution="진행 중에는 화면을 닫아도 작업이 유지되며, 완료 후 피해등급 검토로 이동합니다." />
    <section className="case-card analysis-case-summary"><div><span>사건번호</span><strong>{item.id}</strong></div><div><span>피해 위치</span><strong>{item.location}</strong></div><div><span>재난 유형</span><strong>{item.type}</strong></div></section>
    {originalPhoto && <section className="case-card analysis-original-preview"><div className="section-heading"><div><h2>AI 분석에 전달된 원본 이미지</h2><p>{originalPhoto.name}</p></div><span className="photo-count">원본 {item.photos?.length || 1}장</span></div><img src={originalPhoto.url} alt={`${item.id} 원본 피해 사진`} /></section>}
    <AnalysisStatus analysis={analysis} onRequest={() => requestAnalysis(caseId)} onReview={() => navigate(`/cases/${caseId}/review`)} />
  </div>;
};

export default AiAnalysisPage;
