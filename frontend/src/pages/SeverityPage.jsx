import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import CaseStageHeader from '../components/case/CaseStageHeader';
import StageNavigation from '../components/case/StageNavigation';
import SeverityScoreTable from '../components/severity/SeverityScoreTable';
import UrgencySummary from '../components/severity/UrgencySummary';
import { calculateSeverityTotal, DEFAULT_WORKFLOW, getUrgencyGrade } from '../mocks/workflow';
import { useCaseStore } from '../stores/caseStore';
import { useWorkflowStore } from '../stores/workflowStore';

const SeverityPage = () => {
  const { caseId } = useParams();
  const item = useCaseStore((state) => state.cases.find((entry) => entry.id === caseId));
  const saved = useWorkflowStore((state) => state.workflows[caseId] || DEFAULT_WORKFLOW);
  const saveSeverity = useWorkflowStore((state) => state.saveSeverity);
  const [scores, setScores] = useState(saved.severityScores);
  const [reason, setReason] = useState(saved.severityReason);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const total = useMemo(() => calculateSeverityTotal(scores), [scores]);
  const urgency = getUrgencyGrade(total);

  if (!item) return <div className="case-page"><section className="case-card missing-case"><h1>신고 정보를 찾을 수 없습니다</h1></section></div>;
  const changed = JSON.stringify(scores) !== JSON.stringify(Object.fromEntries(Object.entries(saved.severityScores)));
  const save = () => { if (changed && !reason.trim()) { setError('점수 수정 사유를 입력해 주세요.'); return; } setError(''); saveSeverity(caseId, scores, reason.trim()); setMessage('심각도 점수가 반영되었습니다.'); };
  const updateScore = (factor, value) => setScores((current) => ({ ...current, [factor.key]: Math.min(factor.maxScore, Math.max(0, Number(value))) }));

  return <div className="case-page"><CaseStageHeader item={item} breadcrumb="복구 심사 / 심각도·복구 긴급도" title="심각도·복구 긴급도" description="항목별 피해 점수를 검토하고 복구 우선순위를 산정합니다." /><section className="stage-two-column"><SeverityScoreTable scores={scores} onScoreChange={updateScore} reason={reason} onReasonChange={setReason} onSave={save} error={error} message={message} /><UrgencySummary total={total} urgency={urgency} /></section><StageNavigation previousPath={`/cases/${caseId}/review`} previousLabel="AI 결과 검토" nextPath={`/cases/${caseId}/support`} nextLabel="지원금 심사" /></div>;
};

export default SeverityPage;
