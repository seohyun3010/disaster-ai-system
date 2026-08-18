import { useMemo, useState } from 'react';

const SCORE_ROWS = [
  {
    key: 'ai_grade_score',
    label: 'AI 피해등급 점수',
    options: [
      { value: 50, label: '전파·유실 (50점)' },
      { value: 25, label: '반파 (25점)' },
      { value: 0, label: '무피해 (0점)' },
    ],
  },
  {
    key: 'household_score',
    label: '가구원 수 점수',
    options: [
      { value: 4, label: '1인 (4점)' },
      { value: 8, label: '2인 (8점)' },
      { value: 12, label: '3인 (12점)' },
      { value: 16, label: '4인 (16점)' },
      { value: 20, label: '5인 이상 (20점)' },
    ],
  },
  {
    key: 'facility_livelihood_score',
    label: '시설·이재민 긴급도 점수',
    options: [
      { value: 30, label: '주택 침수·소파 (30점)' },
      { value: 9, label: '주택 반파·전파 (9점)' },
      { value: 9, rawValue: '9.0', label: '상가 (9점)' },
      { value: 18, label: '농경지 (18점)' },
    ],
  },
];

const getInitialScores = (componentScores = {}) => Object.fromEntries(
  SCORE_ROWS.map((row) => [row.key, componentScores[row.key] ?? '']),
);

const getInitialReasons = (componentReasons = {}) => Object.fromEntries(
  SCORE_ROWS.map((row) => [row.key, componentReasons[row.key] ?? '']),
);

const SeverityScoreTable = ({
  componentScores,
  componentReasons,
  loading,
  calculating,
  onCalculate,
  onApplyManual,
  error,
  message,
}) => {
  const [scores, setScores] = useState(() => getInitialScores(componentScores));
  const [reasons, setReasons] = useState(() => getInitialReasons(componentReasons));

  const total = useMemo(() => SCORE_ROWS.reduce(
    (sum, row) => sum + Number(scores[row.key] || 0),
    0,
  ), [scores]);
  const hasAllScores = SCORE_ROWS.every((row) => scores[row.key] !== '');

  const applyScores = () => {
    onApplyManual(
      Object.fromEntries(SCORE_ROWS.map((row) => [row.key, Number(scores[row.key])])),
      reasons,
    );
  };

  return (
    <article className="case-card stage-card severity-score-card">
      <div className="section-heading">
        <div><h2>항목별 심각도 점수</h2><p>세부 기준에 따라 점수를 선택하고 판단 사유를 기록할 수 있습니다.</p></div>
        <span className="severity-live-total">합계 <strong>{total}점</strong></span>
      </div>
      <div className="stage-table-wrap">
        <table className="stage-table severity-editable-table">
          <thead><tr><th>평가 항목</th><th>산출 점수</th><th>사유</th></tr></thead>
          <tbody>
            {SCORE_ROWS.map((row) => (
              <tr key={row.key}>
                <td>{row.label}</td>
                <td>
                  <select
                    aria-label={`${row.label} 산출 점수`}
                    value={scores[row.key]}
                    onChange={(event) => setScores((current) => ({ ...current, [row.key]: event.target.value }))}
                  >
                    <option value="">점수 선택</option>
                    {row.options.map((option, index) => (
                      <option key={`${option.label}-${index}`} value={option.rawValue ?? option.value}>{option.label}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    aria-label={`${row.label} 산정 사유`}
                    placeholder="산정 사유를 입력하세요"
                    value={reasons[row.key]}
                    onChange={(event) => setReasons((current) => ({ ...current, [row.key]: event.target.value }))}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {loading && <p className="severity-api-state" role="status">복구 긴급도 결과를 불러오고 있습니다.</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {message && <p className="decision-success" role="status">{message}</p>}
      <div className="stage-card-actions severity-score-actions">
        <button type="button" className="secondary-action" onClick={onCalculate} disabled={loading || calculating}>
          {calculating ? '자동 계산 중...' : '자동 산정값 불러오기'}
        </button>
        <button type="button" className="primary-action" onClick={applyScores} disabled={loading || !hasAllScores}>
          긴급도 점수 반영
        </button>
      </div>
    </article>
  );
};

export default SeverityScoreTable;
