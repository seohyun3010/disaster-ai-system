const formatCurrency = (value) => `${Number(value).toLocaleString('ko-KR')}원`;

import { EvidencePanel, TermHelp } from '../persona/ReviewGuidance';

const SupportCalculationCard = ({ item, standard, amount, reason, onAmountChange, onReasonChange, onSave, error, message }) => <article className="case-card stage-card">
  <div className="section-heading"><div><h2>예상 지원금 산정</h2><p>피해등급과 시설 유형에 따른 Mock 계산 결과입니다.</p></div></div>
  <div className="support-amount"><span>예상 지원금</span><strong>{formatCurrency(standard.unitPrice * standard.damageRatio)}</strong></div>
  <div className="calculation-flow" aria-label="지원금 계산 과정"><div><span>기준 단가</span><strong>{formatCurrency(standard.unitPrice)}</strong></div><i>×</i><div><span><TermHelp label="피해 비율">AI 분석 및 현장 조사 결과를 바탕으로 검토하는 적용 비율입니다.</TermHelp></span><strong>{standard.damageRatio * 100}%</strong></div><i>=</i><div><span>예상 지원금</span><strong>{formatCurrency(standard.unitPrice * standard.damageRatio)}</strong></div></div>
  <dl className="stage-summary-list support-details"><div><dt>피해등급</dt><dd>{item.damage}</dd></div><div><dt>시설 유형</dt><dd>{item.facility}</dd></div><div><dt>산정 기준</dt><dd>{standard.standard}</dd></div><div><dt>단가</dt><dd>{formatCurrency(standard.unitPrice)}</dd></div><div><dt>계산 과정</dt><dd>{formatCurrency(standard.unitPrice)} × 피해 비율 {standard.damageRatio * 100}%</dd></div></dl>
  <EvidencePanel title="지원금 산정 근거 확인"><p><b>적용 기준:</b> {standard.standard}</p><p><b>참고 문서:</b> 자연재난 구호 및 복구 비용 부담기준 등에 관한 규정 및 지자체 재난지원금 집행 지침</p><p>표시 금액은 UI 검증용 Mock 산정값이며 실제 지급 결정 전 최신 기준표와 중복 수혜 결과를 확인해야 합니다.</p></EvidencePanel>
  <div className="support-edit"><label>최종 검토 금액<input type="number" min="0" step="10000" value={amount} onChange={(event) => onAmountChange(event.target.value)} /></label><label>금액 수정 사유 <span className="required-mark">변경 시 필수</span><textarea value={reason} onChange={(event) => onReasonChange(event.target.value)} placeholder="변경 금액, 적용 기준, 검토 근거를 입력해 주세요." /></label></div>
  {error && <p className="form-error" role="alert">{error}</p>}{message && <p className="decision-success" role="status">{message}</p>}
  <div className="stage-card-actions"><button type="button" className="primary-action" onClick={onSave}>검토 금액 반영</button></div>
</article>;

export default SupportCalculationCard;
