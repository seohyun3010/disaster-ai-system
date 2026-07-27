import { useNavigate, useParams } from 'react-router-dom';
import { useAnalysisStore } from '../../stores/analysisStore';

const APPROVED_REVIEW_STATUSES = ['승인', '수정 승인'];

const ReviewCompletionGuard = ({ children }) => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const reviewStatus = useAnalysisStore((state) => state.analyses[caseId]?.reviewStatus);

  if (APPROVED_REVIEW_STATUSES.includes(reviewStatus)) return children;

  return <div className="case-page"><section className="case-card review-stage-locked" role="alert"><span>피해등급 검토 필요</span><h1>피해등급 검토를 먼저 완료해 주세요.</h1><p>AI 추천 등급을 확인한 뒤 <b>추천 등급 승인</b> 또는 <b>등급 수정 후 승인</b> 처리해야 심각도·복구 긴급도 단계로 이동할 수 있습니다.</p><button type="button" className="primary-action" onClick={() => navigate(`/cases/${caseId}/review`)}>피해등급 검토로 이동</button></section></div>;
};

export default ReviewCompletionGuard;
