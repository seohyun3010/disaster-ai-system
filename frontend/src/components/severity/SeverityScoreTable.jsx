import { SEVERITY_FACTORS } from '../../mocks/workflow';
import { TermHelp } from '../persona/ReviewGuidance';

const FACTOR_HELP = {
  damageScale: '피해 면적과 파손 정도를 종합해 평가합니다.',
  facilityImportance: '주거·공공·기반 시설 등 시설의 행정적 중요도를 평가합니다.',
  accessibility: '복구 인력과 장비의 현장 접근 난이도를 평가합니다.',
  vulnerableImpact: '고령자·장애인·아동 등 취약계층에 미치는 영향을 평가합니다.',
  secondaryDamage: '붕괴, 침수 확대 등 추가 피해 발생 가능성을 평가합니다.',
};

const SeverityScoreTable = ({ scores, onScoreChange, reason, onReasonChange, onSave, error, message }) => <article className="case-card stage-card">
  <div className="section-heading"><div><h2>항목별 심각도 점수</h2><p>AI 추천 점수를 확인하고 필요한 항목만 수정합니다.</p></div></div>
  <div className="stage-table-wrap"><table className="stage-table"><thead><tr><th>평가 항목</th><th>배점</th><th>AI 추천 점수</th><th>공무원 검토 점수</th></tr></thead><tbody>{SEVERITY_FACTORS.map((factor) => <tr key={factor.key}><td><TermHelp label={factor.label}>{FACTOR_HELP[factor.key]}</TermHelp></td><td>{factor.maxScore}점</td><td><strong>{factor.aiScore}점</strong></td><td><input type="number" min="0" max={factor.maxScore} value={scores[factor.key]} onChange={(event) => onScoreChange(factor, event.target.value)} aria-label={`${factor.label} 수정 점수`} /></td></tr>)}</tbody></table></div>
  <label className="stage-reason-field">점수 수정 사유 <span className="required-mark">변경 시 필수</span><textarea value={reason} onChange={(event) => onReasonChange(event.target.value)} placeholder="변경 항목, 현장 확인 내용, 적용 기준을 입력해 주세요." /></label>
  <p className="reason-hint">AI 추천 점수와 다른 항목이 있으면 사유를 입력해야 반영할 수 있습니다.</p>
  {error && <p className="form-error" role="alert">{error}</p>}{message && <p className="decision-success" role="status">{message}</p>}
  <div className="stage-card-actions"><button type="button" className="primary-action" onClick={onSave}>점수 반영</button></div>
</article>;

export default SeverityScoreTable;
