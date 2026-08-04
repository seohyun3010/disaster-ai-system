import { EvidencePanel } from '../persona/ReviewGuidance';

const formatCurrency = (value) =>
  value === null || value === undefined ? '-' : `${Number(value).toLocaleString('ko-KR')}원`;

const toIntegerAmount = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return Number.isFinite(num) ? Math.round(num) : 0;
};

const formatNumberInput = (value) => {
  const amount = toIntegerAmount(value);
  return amount ? amount.toLocaleString('ko-KR') : '';
};

const parseNumberInput = (value) => value.replace(/[^0-9]/g, '');

const SupportCalculationCard = ({
  item,
  damageGrade,
  subsidy,
  loading,
  calculating,
  confirming,
  confirmAmount,
  onConfirmAmountChange,
  reason,
  onReasonChange,
  onCalculate,
  onConfirm,
  error,
  message,
  hold = false,
  fixedZeroAmount = false,
}) => (
  <article className="case-card stage-card">
    <div className="section-heading"><div><h2>예상 지원금 산정</h2></div></div>

    {loading && <p>불러오는 중...</p>}

    {!loading && hold && (
      <div className="support-empty">
        <span className="review-status-badge 보류">보류</span>
        <p>DS2 피해등급은 지원금을 계산하지 않으며 현장조사 재판정 흐름을 유지합니다.</p>
      </div>
    )}

    {!loading && !hold && !subsidy && (
      <div className="support-empty">
        <p>아직 산정된 지원금이 없습니다.</p>
        <button type="button" className="primary-action" onClick={onCalculate} disabled={calculating}>
          {calculating ? '계산 중...' : '지원금 계산'}
        </button>
      </div>
    )}

    {!hold && subsidy && (
      <>
        <div className="support-amount">
          <span>예상 지원금</span>
          <strong>{formatCurrency(subsidy.estimated_amount)}</strong>
        </div>

        <div className="calculation-flow" aria-label="지원금 계산 과정">
          <div><span>기준 단가</span><strong>{formatCurrency(subsidy.unit_price)}</strong></div>
          <i>×</i>
          <div><span>피해 비율</span><strong>{subsidy.damage_ratio_percent ?? '-'}%</strong></div>
          <i>=</i>
          <div><span>예상 지원금</span><strong>{formatCurrency(subsidy.estimated_amount)}</strong></div>
        </div>

        <dl className="stage-summary-list support-details">
          <div><dt>피해등급</dt><dd>{damageGrade || subsidy.damage_grade || item.damage}</dd></div>
          <div><dt>시설 유형</dt><dd>{item.facility}</dd></div>
          <div><dt>산정 기준</dt><dd>{subsidy.calculation_standard ?? '-'}</dd></div>
          <div><dt>단가</dt><dd>{formatCurrency(subsidy.unit_price)} <small>(전파 등급 기준액)</small></dd></div>
        </dl>

        <EvidencePanel title="지원금 산정 근거 확인">
          {subsidy.calculation_basis ? (
            <ul className="basis-list">
              {subsidy.calculation_basis.split('\n').map((line, idx) => (
                <li key={idx}>{line}</li>
              ))}
            </ul>
          ) : (
            <p>근거 정보 없음</p>
          )}
        </EvidencePanel>

        <div className="support-edit">
          <label>
            최종 검토 금액
            <input
              type="text"
              inputMode="numeric"
              value={fixedZeroAmount ? '0' : formatNumberInput(confirmAmount)}
              onChange={(event) => onConfirmAmountChange(parseNumberInput(event.target.value))}
              readOnly={fixedZeroAmount}
            />
          </label>
          <label>
            <span className="support-edit-label">
              금액 수정 사유 <span className="required-mark">변경 시 필수</span>
            </span>
            <textarea
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
              placeholder="변경 금액, 적용 기준, 검토 근거를 입력해 주세요."
            />
          </label>
        </div>

        {error && <p className="form-error" role="alert">{error}</p>}
        {message && <p className="decision-success" role="status">{message}</p>}

        <div className="stage-card-actions">
          {!fixedZeroAmount && <button type="button" className="secondary-action" onClick={onCalculate} disabled={calculating}>
            {calculating ? '재계산 중...' : '다시 계산'}
          </button>}
          <button type="button" className="primary-action" onClick={onConfirm} disabled={confirming}>
            {confirming ? '반영 중...' : '금액 반영'}
          </button>
        </div>
      </>
    )}
  </article>
);

export default SupportCalculationCard;
