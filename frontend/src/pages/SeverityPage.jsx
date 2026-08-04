import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { calculateSeverity, getSeverity } from '../api/severityApi';
import CaseStageHeader from '../components/case/CaseStageHeader';
import StageNavigation from '../components/case/StageNavigation';
import { ReviewGuidance } from '../components/persona/ReviewGuidance';
import SeverityScoreTable from '../components/severity/SeverityScoreTable';
import UrgencySummary from '../components/severity/UrgencySummary';
import { useCaseStore } from '../stores/caseStore';
import { useWorkflowStore } from '../stores/workflowStore';

const getSeverityErrorMessage = (error) => {
  const status = error.response?.status;
  if (status === 404) return '복구 긴급도 계산 결과가 없습니다.';
  if (status === 409) return 'AI 분석 결과 또는 시설 유형 등 계산에 필요한 데이터가 부족합니다.';
  return error.response?.data?.detail || error.message || '복구 긴급도 결과를 불러오지 못했습니다.';
};

const SeverityPage = () => {
  const { caseId } = useParams();
  const item = useCaseStore((state) => (
    state.cases.find((entry) => entry.case_id === Number(caseId))
  ));
  const savedResult = useWorkflowStore((state) => state.workflows[caseId]?.severityResult);
  const saveSeverityResult = useWorkflowStore((state) => state.saveSeverityResult);
  const [result, setResult] = useState(savedResult || null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let ignore = false;
    calculateSeverity(caseId)
      .then((data) => {
        if (ignore) return;
        setResult(data);
        saveSeverityResult(caseId, data);
        setError('');
      })
      .catch((requestError) => {
        if (ignore) return;
        setResult(null);
        setError(getSeverityErrorMessage(requestError));
      })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [caseId, saveSeverityResult]);

  const runCalculate = async () => {
    setCalculating(true);
    setError('');
    setMessage('');
    try {
      const calculated = await calculateSeverity(caseId);
      const data = calculated?.recovery_urgency_score != null
        ? calculated
        : await getSeverity(caseId);
      setResult(data);
      saveSeverityResult(caseId, data);
      setMessage('복구 긴급도 계산이 완료되었습니다. 지원금 심사 단계로 이동할 수 있습니다.');
    } catch (requestError) {
      setError(getSeverityErrorMessage(requestError));
    } finally {
      setCalculating(false);
    }
  };

  if (!item) {
    return <div className="case-page"><section className="case-card missing-case"><h1>신고 정보를 찾을 수 없습니다</h1></section></div>;
  }

  return (
    <div className="case-page">
      <CaseStageHeader item={item} breadcrumb="복구 심사 / 복구 긴급도" title="복구 긴급도" />
      <ReviewGuidance
        current="서버 산출 점수와 복구 긴급도 확인"
        next="긴급도 계산 후 지원금 산정 및 중복 수혜 확인"
        caution="AI 분석 결과와 신고 정보가 최신 상태인지 확인해 주세요."
      />
      <section className="stage-two-column severity-grid">
        <SeverityScoreTable
          componentScores={result?.component_scores}
          loading={loading}
          calculating={calculating}
          onCalculate={runCalculate}
          error={error}
          message={message}
        />
        <UrgencySummary total={result?.recovery_urgency_score} />
      </section>
      <StageNavigation
        previousPath={`/cases/${caseId}/analysis`}
        previousLabel="AI 분석"
        nextPath={`/cases/${caseId}/support`}
        nextLabel="지원금 심사"
        nextDisabled={!result}
        nextHint="긴급도 계산을 완료해야 지원금 심사로 이동할 수 있습니다."
      />
    </div>
  );
};

export default SeverityPage;
