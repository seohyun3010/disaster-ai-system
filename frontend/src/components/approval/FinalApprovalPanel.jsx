import { useState } from 'react';

const ACTIONS = {
  approve: { label: '최종 승인', status: '최종 승인' },
  modify: { label: '금액 수정 후 승인', status: '금액 수정 승인' },
  hold: { label: '보류', status: '보류' },
  reject: { label: '반려', status: '반려' },
};

const FinalApprovalPanel = ({ amount, status, onSubmit }) => {
  const [mode, setMode] = useState(null);
  const [editedAmount, setEditedAmount] = useState(amount);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const close = () => { if (!isSubmitting) { setMode(null); setReason(''); setError(''); } };
  const submit = async () => {
    if (mode === 'modify' && (!Number(editedAmount) || Number(editedAmount) < 0)) return setError('수정 금액을 입력해 주세요.');
    if (mode !== 'approve' && !reason.trim()) return setError(`${ACTIONS[mode].label} 사유를 입력해 주세요.`);
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    onSubmit({ status: ACTIONS[mode].status, amount: mode === 'modify' ? Number(editedAmount) : amount, reason: reason.trim() });
    setMessage(`${ACTIONS[mode].label} 처리가 완료되었습니다.`);
    setIsSubmitting(false); setMode(null); setReason('');
  };

  return <article className="case-card final-approval-panel"><div className="section-heading"><div><h2>최종 승인 처리</h2><p>전체 검토 결과를 확인한 뒤 최종 처리합니다.</p></div><span className={`approval-status-badge ${status.replaceAll(' ', '-')}`}>{status}</span></div>
    {message && <p className="decision-success" role="status">{message}</p>}
    <div className="approval-actions"><button type="button" className="primary-action" onClick={() => setMode('approve')}>최종 승인</button><button type="button" className="secondary-action" onClick={() => setMode('modify')}>금액 수정 후 승인</button><button type="button" className="hold-action" onClick={() => setMode('hold')}>보류</button><button type="button" className="reject-action" onClick={() => setMode('reject')}>반려</button></div>
    {mode && <div className="case-modal-backdrop" role="presentation"><section className="case-modal decision-modal" role="dialog" aria-modal="true" aria-labelledby="approval-modal-title"><header><div><p>최종 검토</p><h2 id="approval-modal-title">{ACTIONS[mode].label}</h2></div><button type="button" className="modal-close" onClick={close} aria-label="닫기">×</button></header><div className="decision-form">{mode === 'approve' ? <p className="decision-guide">최종 지원금 {Number(amount).toLocaleString('ko-KR')}원을 승인하시겠습니까?</p> : <>{mode === 'modify' && <label>수정 금액<input type="number" min="0" step="10000" value={editedAmount} onChange={(event) => setEditedAmount(event.target.value)} /></label>}<label>{ACTIONS[mode].label} 사유<textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="처리 사유를 입력해 주세요." /></label></>}</div>{error && <p className="form-error" role="alert">{error}</p>}<footer><button type="button" className="secondary-action" onClick={close} disabled={isSubmitting}>취소</button><button type="button" className="primary-action" onClick={submit} disabled={isSubmitting}>{isSubmitting ? '처리 중...' : '확인'}</button></footer></section></div>}
  </article>;
};

export default FinalApprovalPanel;
