import { useNavigate, useParams } from 'react-router-dom';
import { useAnalysisStore } from '../../stores/analysisStore';

const APPROVED_REVIEW_STATUSES = ['승인', '수정 승인'];

const ReviewCompletionGuard = ({ children }) => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const analysis = useAnalysisStore((state) => state.analyses[caseId]);

  if (APPROVED_REVIEW_STATUSES.includes(analysis?.reviewStatus)
    || (analysis?.reviewStatus === '보류' && analysis?.holdFieldVerified)) return children;

  return <div className="case-page"><section className="case-card review-stage-locked" role="alert"><span>피해등급 검토 필요</span><h1>피해등급 검토를 먼저 완료해 주세요.</h1><p>AI 분석 화면에서 피해등급을 <b>승인</b>하거나, 보류 건의 현장 확인 보고를 완료해야 복구 긴급도 단계로 이동할 수 있습니다.</p><button type="button" className="primary-action" onClick={() => navigate(`/cases/${caseId}/analysis`)}>AI 분석 화면으로 이동</button></section></div>;
};

export default ReviewCompletionGuard;
