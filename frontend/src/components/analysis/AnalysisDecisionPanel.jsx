import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatOfficerAffiliation, formatOfficerName, getCurrentUser } from '../../mocks/currentUser';
import '../approval/officer.css';

const DAMAGE_GRADES = ['전파', '반파', '부분 파손', '침수', '경미'];
const MODE_LABELS = { approve: '승인', modify: '수정 후 승인', hold: '보류', reject: '반려' };

const AnalysisDecisionPanel = ({ recommendedGrade, reviewStatus, onSubmit, onReviewApproved }) => {
  const navigate = useNavigate();
  const officer = getCurrentUser();
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
    if (mode !== 'approve' && !reason.trim()) {
      setError(`${MODE_LABELS[mode]} 사유를 입력해 주세요.`);
      return;
    }
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    const status = mode === 'reject' ? '반려' : mode === 'hold' ? '보류' : mode === 'modify' ? '수정 승인' : '승인';
    onSubmit({ status, grade: mode === 'modify' ? grade : recommendedGrade, reason: reason.trim() });
    setMessage(`${MODE_LABELS[mode]} 처리가 완료되었습니다.`);
    setIsSubmitting(false);
    setMode(null);
    setReason('');
    if (mode === 'hold' || mode === 'reject') navigate('/review-history');
    if (mode === 'approve' || mode === 'modify') onReviewApproved?.();
  };

  return <section className="case-card decision-panel">
    <div className="section-heading"><div><h2>피해등급 검토</h2><p>AI 추천 결과를 승인하거나 수정·반려할 수 있습니다.</p></div><span className={`review-status-badge ${reviewStatus.replaceAll(' ', '-')}`}>{reviewStatus}</span></div>
    {message && <p className="decision-success" role="status">{message}</p>}
    <div className="officer-context"><span>현재 검토자</span><strong>{formatOfficerName(officer)}</strong><small>{formatOfficerAffiliation(officer)}</small></div>
    <div className="decision-actions"><button type="button" className="primary-action" onClick={() => setMode('approve')}>추천 등급 승인</button><button type="button" className="secondary-action" onClick={() => setMode('modify')}>등급 수정 후 승인</button><button type="button" className="hold-action" onClick={() => setMode('hold')}>추가 확인 보류</button><button type="button" className="reject-action" onClick={() => setMode('reject')}>분석 결과 반려</button></div>
    {mode && <div className="case-modal-backdrop" role="presentation"><section className="case-modal decision-modal" role="dialog" aria-modal="true" aria-labelledby="decision-modal-title"><header><div><p>AI 분석 결과 검토</p><h2 id="decision-modal-title">{MODE_LABELS[mode]}</h2></div><button type="button" className="modal-close" onClick={closeModal} aria-label="닫기">×</button></header>
      {mode === 'approve' && <p className="decision-guide">AI 추천 피해등급 <strong>{recommendedGrade}</strong>을 승인하시겠습니까?</p>}
      {mode === 'modify' && <div className="decision-form"><div className="grade-comparison"><span>AI 추천등급 <b>{recommendedGrade}</b></span><span>수정등급 <b>{grade}</b></span></div><label>피해등급<select value={grade} onChange={(event) => setGrade(event.target.value)}>{DAMAGE_GRADES.map((item) => <option key={item}>{item}</option>)}</select></label><label>수정 사유 <span className="required-mark">필수</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="현장 조사 내용 또는 적용 기준과 함께 입력해 주세요." /></label><p className="reason-hint">수정 전·후 등급과 사유가 처리 이력에 기록됩니다.</p></div>}
      {(mode === 'hold' || mode === 'reject') && <div className="decision-form"><label>{MODE_LABELS[mode]} 사유 <span className="required-mark">필수</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder={mode === 'hold' ? '추가로 확인할 자료나 담당자를 입력해 주세요.' : '판정 근거와 반려 사유를 입력해 주세요.'} /></label><p className="reason-hint">입력한 사유는 다음 담당자가 확인할 수 있도록 처리 이력에 남습니다.</p></div>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <footer><button type="button" className="secondary-action" onClick={closeModal} disabled={isSubmitting}>취소</button><button type="button" className="primary-action" onClick={submit} disabled={isSubmitting}>{isSubmitting ? '처리 중...' : '확인'}</button></footer>
    </section></div>}
  </section>;
};

export default AnalysisDecisionPanel;
