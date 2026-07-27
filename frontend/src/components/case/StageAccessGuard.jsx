import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useWorkflowStageAccess } from '../../hooks/useWorkflowStageAccess';

const StageAccessGuard = ({ stage, children }) => {
  const { caseId } = useParams();
  const { search } = useLocation();
  const navigate = useNavigate();
  const access = useWorkflowStageAccess(caseId, stage);
  const historyReport = stage === 'reports' && new URLSearchParams(search).get('view') === 'history';

  if (access.allowed || historyReport) return children;

  return <div className="case-page">
    <section className="case-card workflow-locked-card" role="alert">
      <span>업무 단계 잠김</span>
      <h1>이 단계는 아직 진행할 수 없습니다.</h1>
      <p>{access.reason}</p>
      <button type="button" className="primary-action" onClick={() => navigate(access.fallbackPath)}>{access.fallbackLabel}</button>
    </section>
  </div>;
};

export default StageAccessGuard;
