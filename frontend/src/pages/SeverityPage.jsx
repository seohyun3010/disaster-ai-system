import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import CaseStageHeader from '../components/case/CaseStageHeader';
import StageNavigation from '../components/case/StageNavigation';
import SeverityScoreTable from '../components/severity/SeverityScoreTable';
import UrgencySummary from '../components/severity/UrgencySummary';
import { ReviewGuidance } from '../components/persona/ReviewGuidance';
import { calculateSeverityTotal, DEFAULT_WORKFLOW, getUrgencyGrade } from '../mocks/workflow';
import { useAnalysisStore } from '../stores/analysisStore';
import { useCaseStore } from '../stores/caseStore';
import { useWorkflowStore } from '../stores/workflowStore';
import { isZeroSupportGrade } from '../utils/reviewRules';

const SeverityPage = () => {
  const { caseId } = useParams();
  const item = useCaseStore((state) => state.cases.find((entry) => entry.id === caseId));
  const analysis = useAnalysisStore((state) => state.analyses[caseId]);
  const saved = useWorkflowStore((state) => state.workflows[caseId] || DEFAULT_WORKFLOW);
  const saveSeverity = useWorkflowStore((state) => state.saveSeverity);
  const [scores, setScores] = useState(saved.severityScores);
  const [reason, setReason] = useState(saved.severityReason);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const reviewedDamageGrade = analysis?.reviewedGrade
    || saved.reviewedGrade
    || saved.confirmedGrade
    || saved.damageGrade
    || analysis?.result?.recommendedGrade;
  const hasZeroSupport = isZeroSupportGrade(reviewedDamageGrade);
  const calculatedTotal = useMemo(() => calculateSeverityTotal(scores), [scores]);
  const total = hasZeroSupport ? 0 : calculatedTotal;
  const urgency = hasZeroSupport
    ? { grade: '낮음', rank: '4순위' }
    : getUrgencyGrade(total);
  const hasUnappliedChanges = JSON.stringify(scores) !== JSON.stringify(saved.severityScores)
    || reason !== saved.severityReason;
  const canProceed = Boolean(saved.severityConfirmed) && !hasUnappliedChanges;

  if (!item) return <div className="case-page"><section className="case-card missing-case"><h1>신고 정보를 찾을 수 없습니다</h1></section></div>;
  const changed = JSON.stringify(scores) !== JSON.stringify(saved.severityScores);
  const save = () => { if (changed && !reason.trim()) { setError('점수 수정 사유를 입력해 주세요.'); return; } setError(''); saveSeverity(caseId, scores, reason.trim()); setReason(reason.trim()); setMessage('심각도 점수가 반영되었습니다. 지원금 심사 단계로 이동할 수 있습니다.'); };
  const updateScore = (factor, value) => { setScores((current) => ({ ...current, [factor.key]: Math.min(factor.maxScore, Math.max(0, Number(value))) })); setMessage(''); };

  return <div className="case-page"><CaseStageHeader item={item} breadcrumb="복구 심사 / 복구 긴급도" title="복구 긴급도" /><ReviewGuidance current="항목별 점수와 복구 긴급도 검토" next="점수 반영 후 지원금 산정 및 중복 수혜 확인" caution="AI 추천 점수를 변경하면 수정 사유가 필수이며 처리 이력에 남습니다." /><section className="stage-two-column severity-grid"><SeverityScoreTable scores={scores} onScoreChange={updateScore} reason={reason} onReasonChange={(value) => { setReason(value); setMessage(''); }} onSave={save} error={error} message={message} /><UrgencySummary total={total} urgency={urgency} /></section><StageNavigation previousPath={`/cases/${caseId}/analysis`} previousLabel="AI 분석" nextPath={`/cases/${caseId}/support`} nextLabel="지원금 심사" nextDisabled={!canProceed} nextHint="점수 반영 버튼을 눌러야 지원금 심사로 이동할 수 있습니다." /></div>;
};

export default SeverityPage;
