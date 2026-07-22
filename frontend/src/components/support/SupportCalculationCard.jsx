const formatCurrency = (value) => `${Number(value).toLocaleString('ko-KR')}원`;

const SupportCalculationCard = ({ item, standard, amount, reason, onAmountChange, onReasonChange, onSave, error, message }) => <article className="case-card stage-card">
  <div className="section-heading"><div><h2>예상 지원금 산정</h2><p>피해등급과 시설 유형에 따른 Mock 계산 결과입니다.</p></div></div>
  <div className="support-amount"><span>예상 지원금</span><strong>{formatCurrency(standard.unitPrice * standard.damageRatio)}</strong></div>
  <dl className="stage-summary-list support-details"><div><dt>피해등급</dt><dd>{item.damage}</dd></div><div><dt>시설 유형</dt><dd>{item.facility}</dd></div><div><dt>산정 기준</dt><dd>{standard.standard}</dd></div><div><dt>단가</dt><dd>{formatCurrency(standard.unitPrice)}</dd></div><div><dt>계산 과정</dt><dd>{formatCurrency(standard.unitPrice)} × 피해 비율 {standard.damageRatio * 100}%</dd></div></dl>
  <div className="support-edit"><label>최종 검토 금액<input type="number" min="0" step="10000" value={amount} onChange={(event) => onAmountChange(event.target.value)} /></label><label>금액 수정 사유<textarea value={reason} onChange={(event) => onReasonChange(event.target.value)} placeholder="예상 지원금을 변경한 경우 사유를 입력해 주세요." /></label></div>
  {error && <p className="form-error" role="alert">{error}</p>}{message && <p className="decision-success" role="status">{message}</p>}
  <div className="stage-card-actions"><button type="button" className="primary-action" onClick={onSave}>검토 금액 반영</button></div>
</article>;

export default SupportCalculationCard;
