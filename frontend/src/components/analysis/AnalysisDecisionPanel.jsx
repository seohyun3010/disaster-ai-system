import { useState } from 'react';

const DAMAGE_GRADES = ['전파', '반파', '부분 파손', '침수', '경미'];
const MODE_LABELS = { approve: '승인', modify: '수정 후 승인', reject: '반려' };

const AnalysisDecisionPanel = ({ recommendedGrade, reviewStatus, onSubmit }) => {
  const [mode, setMode] = useState(null);
  const [grade, setGrade] = useState(recommendedGrade);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const closeModal = () => {
    if (isSubmitting) return;
    setMode(null);
    setReason('');
    setError('');
  };

  const submit = async () => {
    if ((mode === 'modify' || mode === 'reject') && !reason.trim()) {
      setError(mode === 'reject' ? '반려 사유를 입력해 주세요.' : '수정 사유를 입력해 주세요.');
      return;
    }
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    const status = mode === 'reject' ? '반려' : mode === 'modify' ? '수정 승인' : '승인';
    onSubmit({ status, grade: mode === 'modify' ? grade : recommendedGrade, reason: reason.trim() });
    setMessage(`${MODE_LABELS[mode]} 처리가 완료되었습니다.`);
    setIsSubmitting(false);
    setMode(null);
    setReason('');
  };

  return <section className="case-card decision-panel">
    <div className="section-heading"><div><h2>피해등급 검토</h2><p>AI 추천 결과를 승인하거나 수정·반려할 수 있습니다.</p></div><span className={`review-status-badge ${reviewStatus.replaceAll(' ', '-')}`}>{reviewStatus}</span></div>
    {message && <p className="decision-success" role="status">{message}</p>}
    <div className="decision-actions"><button type="button" className="primary-action" onClick={() => setMode('approve')}>승인</button><button type="button" className="secondary-action" onClick={() => setMode('modify')}>수정 후 승인</button><button type="button" className="reject-action" onClick={() => setMode('reject')}>반려</button></div>
    {mode && <div className="case-modal-backdrop" role="presentation"><section className="case-modal decision-modal" role="dialog" aria-modal="true" aria-labelledby="decision-modal-title"><header><div><p>AI 분석 결과 검토</p><h2 id="decision-modal-title">{MODE_LABELS[mode]}</h2></div><button type="button" className="modal-close" onClick={closeModal} aria-label="닫기">×</button></header>
      {mode === 'approve' && <p className="decision-guide">AI 추천 피해등급 <strong>{recommendedGrade}</strong>을 승인하시겠습니까?</p>}
      {mode === 'modify' && <div className="decision-form"><div className="grade-comparison"><span>AI 추천등급 <b>{recommendedGrade}</b></span><span>수정등급 <b>{grade}</b></span></div><label>피해등급<select value={grade} onChange={(event) => setGrade(event.target.value)}>{DAMAGE_GRADES.map((item) => <option key={item}>{item}</option>)}</select></label><label>수정 사유<textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="수정 사유를 입력해 주세요." /></label></div>}
      {mode === 'reject' && <div className="decision-form"><label>반려 사유<textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="반려 사유를 입력해 주세요." /></label></div>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <footer><button type="button" className="secondary-action" onClick={closeModal} disabled={isSubmitting}>취소</button><button type="button" className="primary-action" onClick={submit} disabled={isSubmitting}>{isSubmitting ? '처리 중...' : '확인'}</button></footer>
    </section></div>}
  </section>;
};

export default AnalysisDecisionPanel;
