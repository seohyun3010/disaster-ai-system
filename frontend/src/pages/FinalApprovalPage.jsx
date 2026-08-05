import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import FinalApprovalPanel from '../components/approval/FinalApprovalPanel';
import CaseStageHeader from '../components/case/CaseStageHeader';
import StageNavigation from '../components/case/StageNavigation';
import { DEFAULT_WORKFLOW } from '../mocks/workflow';
import { useAnalysisStore } from '../stores/analysisStore';
import { useCaseStore } from '../stores/caseStore';
import { useWorkflowStore } from '../stores/workflowStore';
import { confirmSubsidy, getSubsidy } from '../api/subsidyApi';
import { getSeverity } from '../api/severityApi';
import {
  formatDamageGradeLabel,
  getDamageGradeCode,
  isDs2Grade,
  isZeroSupportGrade,
} from '../utils/reviewRules';

const AUTOMATIC_CHANGE_MESSAGES = [
  '변경 내역 없음',
  '수정 없음',
  '자동 재산정',
  '서버 자동 재산정',
  '확정 피해등급 기준 자동 재산정',
];

const getUserChangeReason = (value) => {
  const text = String(value ?? '').trim();
  if (!text || /^(undefined|null)$/i.test(text) || /[□�]/.test(text)) return '-';
  if (AUTOMATIC_CHANGE_MESSAGES.some((message) => text.includes(message))) return '-';
  return text;
};

const FinalApprovalPage = () => {
  const { caseId } = useParams();
  const { search } = useLocation();
  const navigate = useNavigate();
  const historyView = new URLSearchParams(search).get('view') === 'history';
  const item = useCaseStore((state) => state.cases.find((entry) => entry.id === caseId));
  const analysis = useAnalysisStore((state) => state.analyses[caseId]);
  const finalizeHeldReview = useAnalysisStore((state) => state.finalizeHeldReview);
  const workflow = useWorkflowStore((state) => state.workflows[caseId] || DEFAULT_WORKFLOW);
  const submitApproval = useWorkflowStore((state) => state.submitApproval);
  const localDamageGrade = analysis?.reviewedGrade
    || workflow?.reviewedGrade
    || workflow?.confirmedGrade
    || workflow?.damageGrade
    || analysis?.result?.recommendedGrade;
  const [subsidy, setSubsidy] = useState(null);
  const [severity, setSeverity] = useState(null);
  const [loadError, setLoadError] = useState('');
  const damageGrade = subsidy?.damage_grade
    || severity?.applied_damage_grade
    || localDamageGrade
    || item?.damage;
  const damageGradeLabel = formatDamageGradeLabel(damageGrade);
  const previousDamageGradeCode = getDamageGradeCode(analysis?.result?.recommendedGrade);
  const finalDamageGradeCode = getDamageGradeCode(analysis?.reviewedGrade || damageGrade);
  const damageGradeChange = previousDamageGradeCode
    && finalDamageGradeCode
    && previousDamageGradeCode !== finalDamageGradeCode
    ? `${previousDamageGradeCode} → ${finalDamageGradeCode}`
    : '';
  const damageGradeChangeSummary = damageGradeChange || '-';
  const severityReason = getUserChangeReason(workflow.severityReason);
  const supportReason = getUserChangeReason(workflow.supportReason);
  const isHeldGrade = isDs2Grade(damageGrade);
  const hasZeroSupport = isZeroSupportGrade(damageGrade);
  const urgencyScore = severity?.recovery_urgency_score ?? null;

  useEffect(() => {
    if (!caseId) return;
    let ignore = false;
    Promise.all([getSubsidy(caseId), getSeverity(caseId)])
      .then(([subsidyData, severityData]) => {
        if (ignore) return;
        setSubsidy(subsidyData);
        setSeverity(severityData);
        setLoadError('');
      })
      .catch((error) => {
        if (!ignore) setLoadError(error.message || '최종 검토 정보를 불러오지 못했습니다.');
      });
    return () => { ignore = true; };
  }, [caseId]);
  const finalSupportAmount = hasZeroSupport || isHeldGrade
    ? 0
    : Math.round(Number(subsidy?.confirmed_amount ?? subsidy?.estimated_amount ?? 0));
  const approvalStatus = subsidy?.status === 'APPROVED'
    ? '최종 승인'
    : subsidy?.status === 'HOLD'
      ? '보류'
      : '승인 대기';

  const handleApproval = async (approval) => {
    const approvedSubsidy = await confirmSubsidy(caseId, {
      estimated_amount: subsidy?.estimated_amount ?? null,
      confirmed_amount: finalSupportAmount,
      status: 'APPROVED',
    });
    setSubsidy(approvedSubsidy);
    submitApproval(caseId, approval);
    if (['최종 승인', '금액 수정 후 승인'].includes(approval.status)) finalizeHeldReview(caseId);
    navigate(`/cases/${caseId}/reports${historyView ? '?view=history' : ''}`);
  };

  if (!item) return <div className="case-page"><section className="case-card missing-case"><h1>신고 정보를 찾을 수 없습니다</h1></section></div>;

  return (
    <div className="case-page">
      <CaseStageHeader item={item} breadcrumb="복구 심사 / 최종 승인" title="최종 승인" progressHistoryView={historyView} />
      {loadError && <p className="form-error" role="alert">{loadError}</p>}
      <section className="case-card final-summary-card">
        <div className="section-heading"><div><h2>최종 검토 요약</h2></div></div>
        <dl className="final-summary-grid">
          <div><dt>사건번호</dt><dd>{item.id}</dd></div>
          <div><dt>AI 분석 결과</dt><dd>{analysis?.result ? `${formatDamageGradeLabel(analysis.result.recommendedGrade)} · 신뢰도 ${analysis.result.confidence}%` : 'AI 원본 결과 확인 필요'}</dd></div>
          <div className="summary-emphasis"><dt>최종 피해등급</dt><dd>{damageGradeLabel || '-'}</dd></div>
          <div className="summary-emphasis"><dt>복구 긴급도</dt><dd>{urgencyScore == null ? '미산출' : `${urgencyScore}점`}</dd></div>
          <div className="summary-emphasis summary-support-amount"><dt>최종 지원금</dt><dd>{finalSupportAmount.toLocaleString('ko-KR')}원</dd></div>
        </dl>
        <div className="reason-summary">
          <h3>이전 단계 수정 사유</h3>
          <p><b>피해등급:</b> {damageGradeChangeSummary}</p>
          <p><b>긴급도:</b> {severityReason}</p>
          <p><b>지원금:</b> {supportReason}</p>
        </div>
      </section>
      <FinalApprovalPanel amount={finalSupportAmount} status={approvalStatus} onSubmit={handleApproval} />
      {!historyView && <StageNavigation previousPath={`/cases/${caseId}/support`} previousLabel="지원금 심사" />}
    </div>
  );
};

export default FinalApprovalPage;
