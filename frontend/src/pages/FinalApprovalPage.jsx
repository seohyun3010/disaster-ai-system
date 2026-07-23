import { useParams } from 'react-router-dom';
import FinalApprovalPanel from '../components/approval/FinalApprovalPanel';
import CaseStageHeader from '../components/case/CaseStageHeader';
import StageNavigation from '../components/case/StageNavigation';
import { calculateSeverityTotal, DEFAULT_WORKFLOW, getUrgencyGrade, SUPPORT_STANDARD } from '../mocks/workflow';
import { useAnalysisStore } from '../stores/analysisStore';
import { useCaseStore } from '../stores/caseStore';
import { useWorkflowStore } from '../stores/workflowStore';

const FinalApprovalPage = () => {
  const { caseId } = useParams();
  const item = useCaseStore((state) => state.cases.find((entry) => entry.id === caseId));
  const analysis = useAnalysisStore((state) => state.analyses[caseId]);
  const workflow = useWorkflowStore((state) => state.workflows[caseId] || DEFAULT_WORKFLOW);
  const submitApproval = useWorkflowStore((state) => state.submitApproval);
  const urgency = getUrgencyGrade(calculateSeverityTotal(workflow.severityScores));

  if (!item) return <div className="case-page"><section className="case-card missing-case"><h1>신고 정보를 찾을 수 없습니다</h1></section></div>;

  return <div className="case-page"><CaseStageHeader item={item} breadcrumb="복구 심사 / 최종 승인" title="최종 승인" description="AI 분석부터 지원금 산정까지의 검토 결과를 최종 확인합니다." /><section className="case-card final-summary-card"><div className="section-heading"><div><h2>최종 검토 요약</h2><p>이전 단계에서 확정하거나 수정한 내용을 표시합니다.</p></div></div><dl className="final-summary-grid"><div><dt>사건번호</dt><dd>{item.id}</dd></div><div><dt>AI 분석 결과</dt><dd>{analysis?.result ? `${analysis.result.recommendedGrade} · 신뢰도 ${analysis.result.confidence}%` : 'Mock 결과 · 반파'}</dd></div><div><dt>피해등급</dt><dd>{analysis?.reviewedGrade || analysis?.result?.recommendedGrade || item.damage}</dd></div><div><dt>긴급도 등급</dt><dd><span className={`urgency-badge ${urgency.grade}`}>{urgency.grade}</span> {urgency.rank}</dd></div><div><dt>최종 지원금</dt><dd>{workflow.supportAmount.toLocaleString('ko-KR')}원</dd></div><div><dt>중복 수혜 검증</dt><dd><span className={item.duplicate ? 'duplicate-badge' : 'analysis-state-badge completed'}>{item.duplicate ? '추가 확인 필요' : SUPPORT_STANDARD.duplicateResult}</span></dd></div></dl><div className="reason-summary"><h3>이전 단계 수정 사유</h3><p><b>피해등급:</b> {analysis?.reviewReason || '수정 없음'}</p><p><b>긴급도:</b> {workflow.severityReason || '수정 없음'}</p><p><b>지원금:</b> {workflow.supportReason || '수정 없음'}</p></div></section><FinalApprovalPanel amount={workflow.supportAmount} status={workflow.approvalStatus} onSubmit={(approval) => submitApproval(caseId, approval)} /><StageNavigation previousPath={`/cases/${caseId}/support`} previousLabel="지원금 심사" nextPath={`/cases/${caseId}/reports`} nextLabel="보고서 및 이력" /></div>;
};

export default FinalApprovalPage;
