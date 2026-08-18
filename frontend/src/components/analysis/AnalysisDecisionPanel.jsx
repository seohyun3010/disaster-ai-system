import { useState } from 'react';
import { createPortal } from 'react-dom';
import { formatOfficerAffiliation, formatOfficerName, getCurrentUser } from '../../mocks/currentUser';
import { getMandatoryHoldReason } from '../../utils/reviewRules';
import '../approval/officer.css';
 
const MODE_LABELS = { approve: '승인', hold: '보류 처리', reReview: '재판정 완료' };

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

const GRADE_OPINION = {
  DS0: { label: '피해 없음', standard: '피해 없음', support: '지원 대상이 아닌 것으로' },
  DS1: { label: '경미한 손상', standard: '경미한 피해', support: '경미한 피해 기준으로' },
  DS2: { label: '반파 경계', standard: '반파 경계', support: '현장 확인 후 적용 기준을 결정하는 것으로' },
  DS3: { label: '반파', standard: '반파', support: '반파 기준 단가를 적용하는 것으로' },
  DS4: { label: '전파', standard: '전파', support: '전파 기준 단가를 적용하는 것으로' },
};
 
const AnalysisDecisionPanel = ({ confidence, recommendedGrade, reviewedGrade, reviewStatus, analysisResult, photoCount, disasterTypeLabel, facilityTypeLabel, onSubmit, onReReviewSubmit, onReviewApproved, onReviewHeld }) => {
  const officer = getCurrentUser();
  const [selectedGrade, setSelectedGrade] = useState(() => getReviewGrade(reviewedGrade || recommendedGrade));
  const automaticHoldReason = getMandatoryHoldReason({
    confidence,
    recommendedGrade,
  });
  const isReReview = reviewStatus === '보류';
  const hasCompletedReReview = ['승인', '수정 승인'].includes(reviewStatus);
  const isAutomaticHoldView = Boolean(automaticHoldReason)
    && !isReReview
    && !hasCompletedReReview;
  const isHoldOnly = Boolean(automaticHoldReason);
  const gradeCode = String(recommendedGrade || selectedGrade).match(/DS[0-4]/i)?.[0]?.toUpperCase() || 'DS2';
  const selectedGradeCode = String(selectedGrade).match(/DS[0-4]/i)?.[0]?.toUpperCase();
  const recommendedGradeCode = String(recommendedGrade).match(/DS[0-4]/i)?.[0]?.toUpperCase();
  const isGradeChanged = Boolean(
    selectedGradeCode
    && recommendedGradeCode
    && selectedGradeCode !== recommendedGradeCode,
  );
  const gradeOpinion = GRADE_OPINION[gradeCode];
  const numericConfidence = Number(confidence);
  const confidenceText = Number.isFinite(numericConfidence)
    ? (numericConfidence > 1 ? numericConfidence / 100 : numericConfidence).toFixed(2)
    : '-';
  const analyzedPhotoCount = analysisResult?.viewCount
    ?? analysisResult?.sourceUrls?.length
    ?? photoCount
    ?? 0;
  const observationSummary = analysisResult?.observation?.summary
    || analysisResult?.rationale
    || '자동 판독 결과와 부위별 관찰 정보를 종합하여 피해등급을 산출하였습니다.';
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
    if (mode === 'approve' && isHoldOnly) {
      setMode(null);
      return;
    }
    if ((['hold', 'reReview'].includes(mode) || (mode === 'approve' && isGradeChanged)) && !reason.trim()) {
      setError(mode === 'reReview'
        ? '재판정 사유를 입력해 주세요.'
        : mode === 'approve'
          ? '피해등급 수정 사유를 입력해 주세요.'
          : '보류 사유를 입력해 주세요.');
      return;
    }
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    try {
      if (mode === 'reReview') {
        await onReReviewSubmit?.({ grade: selectedGrade, reason: reason.trim() });
      } else {
        const status = mode === 'hold' ? '보류' : '승인';
        await onSubmit({ status, grade: selectedGrade, previousGrade: recommendedGrade, reason: reason.trim() });
      }
    } catch (submitError) {
      setError(submitError.message || '피해등급 검토 결과 저장에 실패했습니다.');
      setIsSubmitting(false);
      return;
    }
    setMessage(mode === 'hold'
      ? '보류 처리가 완료되었습니다.'
      : mode === 'reReview'
        ? '재판정이 완료되었습니다.'
        : '승인 처리가 완료되었습니다.');
    setIsSubmitting(false);
    setMode(null);
    setReason('');
    if (mode === 'hold') onReviewHeld?.();
    if (mode === 'approve') onReviewApproved?.(selectedGrade);
    if (mode === 'reReview') onReviewApproved?.(selectedGrade);
  };
 
  return <section className="case-card decision-panel">
    <div className="section-heading"><div><h2>피해등급 검토</h2></div><span className={`review-status-badge ${reviewStatus.replaceAll(' ', '-')}`}>{reviewStatus}</span></div>
    {message && <p className="decision-success" role="status">{message}</p>}
    <div className="officer-context"><span>현재 검토자</span><strong>{formatOfficerName(officer)}</strong><small>{formatOfficerAffiliation(officer)}</small></div>
    <article className="ai-comprehensive-opinion">
      <header><h3>AI 종합 검토 의견</h3><span>예비판정 후보</span></header>
      <p>본 건은 <strong>{disasterTypeLabel || '자연재난'} {facilityTypeLabel || '피해'}</strong> 사진 {analyzedPhotoCount}매를 대상으로 자동 판독한 결과입니다.</p>
      <p>영상 판독 모델은 피해등급 <strong>{gradeCode}({gradeOpinion.label})</strong>을 제시하였으며, 판정 신뢰도는 <strong>{confidenceText}</strong>입니다.</p>
      <p className="opinion-observation">{observationSummary}</p>
      <p>관련 근거로 「자연재난조사 및 복구계획수립 편람」의 {facilityTypeLabel || '시설'} 피해 판정기준 중 <strong>{gradeOpinion.standard}</strong> 항목을 참고하였습니다.</p>
      <p>이상을 종합할 때, 본 건은 <strong>{gradeCode}({gradeOpinion.label})</strong> 피해로 판단되며, 지원금은 {gradeOpinion.support} 검토하였습니다.</p>
    </article>
    {isAutomaticHoldView ? <>
      <div className="decision-actions"><button type="button" className="hold-action" onClick={() => setMode('hold')}>보류 처리</button></div>
    </> : <>
      {isReReview && <p className="decision-guide">현장조사 결과를 반영해 피해등급을 다시 판정해 주세요.</p>}
      <div className="decision-form"><label>{isReReview ? '재검토 피해등급' : '검토 피해등급'}<select value={selectedGrade} onChange={(event) => setSelectedGrade(event.target.value)}>{DAMAGE_GRADE_OPTIONS.map((grade) => <option key={grade} value={grade}>{grade}</option>)}</select></label></div>
      <div className="decision-actions">{isReReview
        ? <button type="button" className="primary-action" onClick={() => setMode('reReview')}>재판정 완료</button>
        : <>{!isHoldOnly && <button type="button" className="primary-action" onClick={() => setMode('approve')}>승인</button>}<button type="button" className="hold-action" onClick={() => setMode('hold')}>보류</button></>}</div>
    </>}
    {mode && createPortal(<div className="case-modal-backdrop" role="presentation"><section className="case-modal decision-modal" role="dialog" aria-modal="true" aria-labelledby="decision-modal-title"><header><div><p>AI 분석 결과 검토</p><h2 id="decision-modal-title">{MODE_LABELS[mode]}</h2></div><button type="button" className="modal-close" onClick={closeModal} aria-label="닫기">×</button></header>
      {mode === 'approve' && <div className="decision-form">
        <p className="decision-guide">검토 피해등급 <strong>{selectedGrade}</strong>을 승인하시겠습니까?</p>
        {isGradeChanged && <label>피해등급 수정 사유 <span className="required-mark">필수</span><textarea value={reason} onChange={(event) => { setReason(event.target.value); setError(''); }} placeholder="AI 추천 등급과 다르게 판정한 현장 소견과 근거를 입력해 주세요." /></label>}
      </div>}
      {mode === 'hold' && <div className="decision-form"><label>보류 사유 <span className="required-mark">필수</span><textarea value={reason} onChange={(event) => { setReason(event.target.value); setError(''); }} placeholder="현장 방문이 필요한 이유와 추가 확인 사항을 입력해 주세요." /></label><p className="reason-hint">보류 사유는 신고 목록과 현장 확인 처리 화면에 유지됩니다.</p></div>}
      {mode === 'reReview' && <div className="decision-form"><p className="decision-guide">현장 확인 피해등급 <strong>{selectedGrade}</strong>으로 재판정을 완료하시겠습니까?</p><label>재판정 사유 <span className="required-mark">필수</span><textarea value={reason} onChange={(event) => { setReason(event.target.value); setError(''); }} placeholder="현장 확인 결과와 피해등급 변경 근거를 입력해 주세요." /></label></div>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <footer><button type="button" className="secondary-action" onClick={closeModal} disabled={isSubmitting}>취소</button><button type="button" className="primary-action" onClick={submit} disabled={isSubmitting}>{isSubmitting ? '처리 중...' : '확인'}</button></footer>
    </section></div>, document.body)}
  </section>;
};
 
export default AnalysisDecisionPanel;
 
