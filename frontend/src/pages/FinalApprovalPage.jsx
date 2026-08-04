import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import FinalApprovalPanel from '../components/approval/FinalApprovalPanel';
import CaseStageHeader from '../components/case/CaseStageHeader';
import StageNavigation from '../components/case/StageNavigation';
import { calculateSeverityTotal, DEFAULT_WORKFLOW, SUPPORT_STANDARD } from '../mocks/workflow';
import { useAnalysisStore } from '../stores/analysisStore';
import { useCaseStore } from '../stores/caseStore';
import { useWorkflowStore } from '../stores/workflowStore';
import { getSubsidy } from '../api/subsidyApi';
import { isDs2Grade, isZeroSupportGrade } from '../utils/reviewRules';

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
  const savedDamageGrade = analysis?.reviewedGrade
    || workflow?.reviewedGrade
    || workflow?.confirmedGrade
    || workflow?.damageGrade
    || analysis?.result?.recommendedGrade;
  const isHeldGrade = isDs2Grade(savedDamageGrade);
  const hasZeroSupport = isZeroSupportGrade(savedDamageGrade);
  const urgencyScore = hasZeroSupport
    ? null
    : isHeldGrade ? 0 : calculateSeverityTotal(workflow.severityScores);

  const [subsidy, setSubsidy] = useState(null);
  useEffect(() => {
    if (!caseId || hasZeroSupport || isHeldGrade) return;
    let ignore = false;
    getSubsidy(caseId).then((data) => { if (!ignore) setSubsidy(data); }).catch(() => {});
    return () => { ignore = true; };
  }, [caseId, hasZeroSupport, isHeldGrade]);
  const damageGrade = savedDamageGrade || subsidy?.damage_grade || item?.damage;
  const finalSupportAmount = hasZeroSupport || isHeldGrade
    ? 0
    : Math.round(Number(subsidy?.confirmed_amount ?? subsidy?.estimated_amount ?? 0));

  const handleApproval = (approval) => {
    submitApproval(caseId, approval);
    if (['최종 승인', '금액 수정 후 승인'].includes(approval.status)) finalizeHeldReview(caseId);
    navigate(`/cases/${caseId}/reports${historyView ? '?view=history' : ''}`);
  };

  if (!item) return <div className="case-page"><section className="case-card missing-case"><h1>신고 정보를 찾을 수 없습니다</h1></section></div>;

  return <div className="case-page"><CaseStageHeader item={item} breadcrumb="복구 심사 / 최종 승인" title="최종 승인" progressHistoryView={historyView} /><section className="case-card final-summary-card"><div className="section-heading"><div><h2>최종 검토 요약</h2></div></div><dl className="final-summary-grid"><div><dt>사건번호</dt><dd>{item.id}</dd></div><div><dt>AI 분석 결과</dt><dd>{analysis?.result ? `${analysis.result.recommendedGrade} · 신뢰도 ${analysis.result.confidence}%` : 'Mock 결과 · 반파'}</dd></div><div><dt>피해등급</dt><dd>{damageGrade}</dd></div><div><dt>복구 긴급도</dt><dd>{hasZeroSupport ? '미산출' : `${urgencyScore}점`}</dd></div><div><dt>최종 지원금</dt><dd>{finalSupportAmount.toLocaleString('ko-KR')}원</dd></div><div><dt>중복 수혜 검증</dt><dd><span className={item.duplicate ? 'duplicate-badge' : 'analysis-state-badge completed'}>{item.duplicate ? '추가 확인 필요' : SUPPORT_STANDARD.duplicateResult}</span></dd></div></dl><div className="reason-summary"><h3>이전 단계 수정 사유</h3><p><b>피해등급:</b> {analysis?.reviewReason || '수정 없음'}</p><p><b>긴급도:</b> {workflow.severityReason || (hasZeroSupport ? '산출 없음' : '수정 없음')}</p><p><b>지원금:</b> {workflow.supportReason || '수정 없음'}</p></div></section><FinalApprovalPanel amount={finalSupportAmount} status={workflow.approvalStatus} onSubmit={handleApproval} />{!historyView && <StageNavigation previousPath={`/cases/${caseId}/support`} previousLabel="지원금 심사" />}</div>;
};

export default FinalApprovalPage;
