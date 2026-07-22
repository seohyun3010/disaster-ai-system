import { SEVERITY_FACTORS } from '../../mocks/workflow';

const SeverityScoreTable = ({ scores, onScoreChange, reason, onReasonChange, onSave, error, message }) => <article className="case-card stage-card">
  <div className="section-heading"><div><h2>항목별 심각도 점수</h2><p>AI 추천 점수를 확인하고 필요한 항목만 수정합니다.</p></div></div>
  <div className="stage-table-wrap"><table className="stage-table"><thead><tr><th>평가 항목</th><th>배점</th><th>AI 추천 점수</th><th>공무원 수정 점수</th></tr></thead><tbody>{SEVERITY_FACTORS.map((factor) => <tr key={factor.key}><td>{factor.label}</td><td>{factor.maxScore}점</td><td><strong>{factor.aiScore}점</strong></td><td><input type="number" min="0" max={factor.maxScore} value={scores[factor.key]} onChange={(event) => onScoreChange(factor, event.target.value)} aria-label={`${factor.label} 수정 점수`} /></td></tr>)}</tbody></table></div>
  <label className="stage-reason-field">점수 수정 사유<textarea value={reason} onChange={(event) => onReasonChange(event.target.value)} placeholder="AI 추천 점수를 변경한 경우 수정 사유를 입력해 주세요." /></label>
  {error && <p className="form-error" role="alert">{error}</p>}{message && <p className="decision-success" role="status">{message}</p>}
  <div className="stage-card-actions"><button type="button" className="primary-action" onClick={onSave}>점수 반영</button></div>
</article>;

export default SeverityScoreTable;
