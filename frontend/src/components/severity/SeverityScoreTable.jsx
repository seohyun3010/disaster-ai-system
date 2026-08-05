const SCORE_ROWS = [
  { key: 'ai_grade_score', label: 'AI 피해등급 점수' },
  { key: 'household_score', label: '가구원 수 점수' },
  { key: 'facility_livelihood_score', label: '시설·이재민 긴급도 점수' },
];

const SeverityScoreTable = ({
  componentScores,
  loading,
  calculating,
  onCalculate,
  error,
  message,
}) => (
  <article className="case-card stage-card severity-score-card">
    <div className="section-heading"><div><h2>항목별 심각도 점수</h2></div></div>
    <div className="stage-table-wrap">
      <table className="stage-table severity-readonly-table">
        <thead><tr><th>평가 항목</th><th>산출 점수</th></tr></thead>
        <tbody>
          {SCORE_ROWS.map((row) => (
            <tr key={row.key}>
              <td>{row.label}</td>
              <td><strong>{componentScores?.[row.key] ?? '-'}{componentScores?.[row.key] != null ? '점' : ''}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {loading && <p className="severity-api-state" role="status">복구 긴급도 결과를 불러오고 있습니다.</p>}
    {error && <p className="form-error" role="alert">{error}</p>}
    {message && <p className="decision-success" role="status">{message}</p>}
    <div className="stage-card-actions">
      <button type="button" className="primary-action" onClick={onCalculate} disabled={loading || calculating}>
        {calculating ? '긴급도 계산 중...' : componentScores ? '긴급도 다시 계산' : '긴급도 계산'}
      </button>
    </div>
  </article>
);

export default SeverityScoreTable;
