import { useState } from 'react';
import { createPortal } from 'react-dom';
import { formatOfficerAffiliation, formatOfficerName, getCurrentUser } from '../../mocks/currentUser';
import './officer.css';

const APPROVAL_ACTION = { label: '최종 승인', status: '최종 승인' };

const FinalApprovalPanel = ({ amount, status, onSubmit }) => {
  const officer = getCurrentUser();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const close = () => { if (!isSubmitting) setIsOpen(false); };
  const submit = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    try {
      await onSubmit({ status: APPROVAL_ACTION.status, amount, reason: '' });
      setMessage(`${formatOfficerName(officer)}의 ${APPROVAL_ACTION.label} 처리가 완료되었습니다.`);
      setIsOpen(false);
    } catch (error) {
      setMessage(error.message || '최종 승인 저장에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return <article className="case-card final-approval-panel">
    <div className="section-heading"><div><h2>최종 승인 처리</h2></div><span className={`approval-status-badge ${status.replaceAll(' ', '-')}`}>{status}</span></div>
    <div className="officer-context"><span>현재 승인자</span><strong>{formatOfficerName(officer)}</strong><small>{formatOfficerAffiliation(officer)}</small></div>
    {message && <p className="decision-success" role="status">{message}</p>}
    <div className="approval-actions"><button type="button" className="primary-action" onClick={() => setIsOpen(true)}>최종 승인</button></div>
    {isOpen && createPortal(<div className="case-modal-backdrop" role="presentation"><section className="case-modal decision-modal" role="dialog" aria-modal="true" aria-labelledby="approval-modal-title">
      <header><div><p>{formatOfficerAffiliation(officer)}</p><h2 id="approval-modal-title">{APPROVAL_ACTION.label}</h2></div><button type="button" className="modal-close" onClick={close} aria-label="닫기">×</button></header>
      <div className="modal-approver"><span>처리 담당자</span><strong>{formatOfficerName(officer)}</strong></div>
      <div className="decision-form"><p className="decision-guide"><strong>{formatOfficerName(officer)}</strong> 명의로 최종 지원금 {Number(amount).toLocaleString('ko-KR')}원을 승인하시겠습니까?</p></div>
      <footer><button type="button" className="secondary-action" onClick={close} disabled={isSubmitting}>취소</button><button type="button" className="primary-action" onClick={submit} disabled={isSubmitting}>{isSubmitting ? '처리 중...' : '확인'}</button></footer>
    </section></div>, document.body)}
  </article>;
};

export default FinalApprovalPanel;
