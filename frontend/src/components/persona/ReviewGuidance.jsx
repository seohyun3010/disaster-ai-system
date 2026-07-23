import './persona.css';

export const ReviewGuidance = ({ current, next, caution }) => (
  <aside className="persona-guidance" aria-label="단계별 업무 안내">
    <div><span>현재 업무</span><strong>{current}</strong></div>
    <div><span>다음 업무</span><strong>{next}</strong></div>
    {caution && <p><b>확인 필요</b>{caution}</p>}
  </aside>
);

export const TermHelp = ({ label, children }) => (
  <span className="term-help">
    {label}
    <button type="button" className="term-help-trigger" aria-label={`${label} 설명`}>?</button>
    <span className="term-help-content" role="tooltip">{children}</span>
  </span>
);

export const EvidencePanel = ({ title = '적용 근거', children }) => (
  <details className="persona-evidence">
    <summary>{title}</summary>
    <div>{children}</div>
  </details>
);

