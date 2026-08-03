import { useState } from 'react';
import { createPortal } from 'react-dom';
import { formatOfficerAffiliation, formatOfficerName, getCurrentUser } from '../../mocks/currentUser';
import '../approval/officer.css';
 
const MODE_LABELS = { approve: '승인', hold: '보류' };

const DAMAGE_GRADE_OPTIONS = [
  'DS0 · 피해 없음',
  'DS1 · 경미',
  'DS2 · 반파 경계',
  'DS3 · 반파',
  'DS4 · 전파',
];

const getReviewGrade = (grade) => {
  const gradeCode = String(grade || '').match(/DS[0-4]/i)?.[0]?.toUpperCase();
  return DAMAGE_GRADE_OPTIONS.find((option) => option.startsWith(gradeCode)) || grade || '';
};
 
const AnalysisDecisionPanel = ({ recommendedGrade, reviewedGrade, reviewStatus, onSubmit, onReviewApproved, onReviewHeld }) => {
  const officer = getCurrentUser();
  const [selectedGrade, setSelectedGrade] = useState(() => getReviewGrade(reviewedGrade || recommendedGrade));
  const gradeCode = String(selectedGrade || '').match(/DS[0-4]/i)?.[0]?.toUpperCase();
  const isHoldOnlyGrade = ['DS0', 'DS1', 'DS2'].includes(gradeCode);
  const [mode, setMode] = useState(null);
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
    if (mode === 'approve' && isHoldOnlyGrade) {
      setMode(null);
      return;
    }
    if (mode === 'hold' && !reason.trim()) {
      setError('보류 사유를 입력해 주세요.');
      return;
    }
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    const status = mode === 'hold' ? '보류' : '승인';
    onSubmit({ status, grade: selectedGrade, previousGrade: recommendedGrade, reason: reason.trim() });
    setMessage(`${MODE_LABELS[mode]} 처리가 완료되었습니다.`);
    setIsSubmitting(false);
    setMode(null);
    setReason('');
    if (mode === 'hold') onReviewHeld?.();
    if (mode === 'approve') onReviewApproved?.();
  };
 
  return <section className="case-card decision-panel">
    <div className="section-heading"><div><h2>피해등급 검토</h2></div><span className={`review-status-badge ${reviewStatus.replaceAll(' ', '-')}`}>{reviewStatus}</span></div>
    {message && <p className="decision-success" role="status">{message}</p>}
    <div className="officer-context"><span>현재 검토자</span><strong>{formatOfficerName(officer)}</strong><small>{formatOfficerAffiliation(officer)}</small></div>
    <div className="decision-form"><label>검토 피해등급<select value={selectedGrade} onChange={(event) => setSelectedGrade(event.target.value)}>{DAMAGE_GRADE_OPTIONS.map((grade) => <option key={grade} value={grade}>{grade}</option>)}</select></label></div>
    <div className="decision-actions">{!isHoldOnlyGrade && <button type="button" className="primary-action" onClick={() => setMode('approve')}>승인</button>}<button type="button" className="hold-action" onClick={() => setMode('hold')}>보류</button></div>
    {mode && createPortal(<div className="case-modal-backdrop" role="presentation"><section className="case-modal decision-modal" role="dialog" aria-modal="true" aria-labelledby="decision-modal-title"><header><div><p>AI 분석 결과 검토</p><h2 id="decision-modal-title">{MODE_LABELS[mode]}</h2></div><button type="button" className="modal-close" onClick={closeModal} aria-label="닫기">×</button></header>
      {mode === 'approve' && <p className="decision-guide">검토 피해등급 <strong>{selectedGrade}</strong>을 승인하시겠습니까?</p>}
      {mode === 'hold' && <div className="decision-form"><label>보류 사유 <span className="required-mark">필수</span><textarea value={reason} onChange={(event) => { setReason(event.target.value); setError(''); }} placeholder="현장 방문이 필요한 이유와 추가 확인 사항을 입력해 주세요." /></label><p className="reason-hint">보류 사유는 신고 목록과 현장 확인 처리 화면에 유지됩니다.</p></div>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <footer><button type="button" className="secondary-action" onClick={closeModal} disabled={isSubmitting}>취소</button><button type="button" className="primary-action" onClick={submit} disabled={isSubmitting}>{isSubmitting ? '처리 중...' : '확인'}</button></footer>
    </section></div>, document.body)}
  </section>;
};
 
export default AnalysisDecisionPanel;
 
