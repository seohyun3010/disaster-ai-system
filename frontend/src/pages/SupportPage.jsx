import { useState } from 'react';
import { useParams } from 'react-router-dom';
import CaseStageHeader from '../components/case/CaseStageHeader';
import StageNavigation from '../components/case/StageNavigation';
import DuplicateBenefitCheck from '../components/support/DuplicateBenefitCheck';
import SupportCalculationCard from '../components/support/SupportCalculationCard';
import { DEFAULT_WORKFLOW, SUPPORT_STANDARD } from '../mocks/workflow';
import { useCaseStore } from '../stores/caseStore';
import { useWorkflowStore } from '../stores/workflowStore';

const SupportPage = () => {
  const { caseId } = useParams();
  const item = useCaseStore((state) => state.cases.find((entry) => entry.id === caseId));
  const saved = useWorkflowStore((state) => state.workflows[caseId] || DEFAULT_WORKFLOW);
  const saveSupport = useWorkflowStore((state) => state.saveSupport);
  const [amount, setAmount] = useState(saved.supportAmount);
  const [reason, setReason] = useState(saved.supportReason);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  if (!item) return <div className="case-page"><section className="case-card missing-case"><h1>신고 정보를 찾을 수 없습니다</h1></section></div>;
  const save = () => { if (Number(amount) !== saved.supportAmount && !reason.trim()) { setError('금액 수정 사유를 입력해 주세요.'); return; } setError(''); saveSupport(caseId, Number(amount), reason.trim()); setMessage('최종 검토 금액이 반영되었습니다.'); };

  return <div className="case-page"><CaseStageHeader item={item} breadcrumb="복구 심사 / 지원금 심사" title="지원금 심사" description="피해등급과 산정 기준을 확인하고 최종 검토 금액을 결정합니다." /><section className="stage-two-column support-grid"><SupportCalculationCard item={item} standard={SUPPORT_STANDARD} amount={amount} reason={reason} onAmountChange={setAmount} onReasonChange={setReason} onSave={save} error={error} message={message} /><DuplicateBenefitCheck duplicate={item.duplicate} result={item.duplicate ? '동일 주소의 기존 수혜 내역이 있어 추가 확인이 필요합니다.' : SUPPORT_STANDARD.duplicateResult} /></section><StageNavigation previousPath={`/cases/${caseId}/severity`} previousLabel="심각도 검토" nextPath={`/cases/${caseId}/final-approval`} nextLabel="최종 승인" /></div>;
};

export default SupportPage;
