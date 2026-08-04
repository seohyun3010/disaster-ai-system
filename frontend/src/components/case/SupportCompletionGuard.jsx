import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getSubsidy } from '../../api/subsidyApi';

const SupportCompletionGuard = ({ children }) => {
  const { caseId } = useParams();
  const { search } = useLocation();
  const navigate = useNavigate();
  const historyView = new URLSearchParams(search).get('view') === 'history';
  const [supportState, setSupportState] = useState({ caseId: null, confirmed: false });
  const loading = Boolean(caseId && !historyView && supportState.caseId !== caseId);
  const supportConfirmed = supportState.caseId === caseId && supportState.confirmed;

  useEffect(() => {
    if (!caseId || historyView) return undefined;
    let ignore = false;
    getSubsidy(caseId)
      .then((data) => {
        if (!ignore) setSupportState({ caseId, confirmed: data.status === 'CONFIRMED' });
      })
      .catch(() => {
        if (!ignore) setSupportState({ caseId, confirmed: false });
      });
    return () => { ignore = true; };
  }, [caseId, historyView]);

  if (loading) return null;
  if (supportConfirmed || historyView) return children;

  return (
    <div className="case-page">
      <section className="case-card review-stage-locked" role="alert">
        <span>지원금 반영 필요</span>
        <h1>지원금 심사 금액을 먼저 반영해 주세요.</h1>
        <p>
          지원금 심사 화면에서 산정 금액을 확인하고 <b>금액 확정</b> 버튼을 눌러야
          최종 확인 단계로 이동할 수 있습니다.
        </p>
        <button
          type="button"
          className="primary-action"
          onClick={() => navigate(`/cases/${caseId}/support`)}
        >
          지원금 심사로 이동
        </button>
      </section>
    </div>
  );
};

export default SupportCompletionGuard;
