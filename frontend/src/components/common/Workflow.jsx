import { useNavigate } from 'react-router-dom';

const steps = [
  ['피해신고 현황', '/dashboard'], ['AI 피해조사', '/cases/NDMS-0048'],
  ['심각도 산정', '/statistics'], ['지원금 검증', '/map'], ['심사 보고서', '/reports/NDMS-0048'],
];

export const PageHead = ({ stage, title, description, badge = '업무 지원' }) => (
  <>
    <div className="page-head">
      <div>
        <p className="breadcrumb">국민안전24 피해신고 &gt; {title}</p>
        <h1>{title}</h1><p>{description}</p>
      </div>
      <div className="operator"><span>{badge}</span><div>2026.07.16<br /><b>복구지원 담당자</b></div></div>
    </div>
    <Workflow stage={stage} />
  </>
);

export const Workflow = ({ stage }) => {
  const navigate = useNavigate();
  return <div className="workflow"><b>업무 진행</b>{steps.map(([label, path], i) => (
    <button key={path} className={i <= stage ? 'done' : ''} onClick={() => navigate(path)}>
      <span>{i < stage ? '✓' : i + 1}</span>{label}
    </button>
  ))}</div>;
};

export const Card = ({ title, sub, className = '', children }) => (
  <section className={`card ${className}`}><h2>{title}</h2>{sub && <p className="card-sub">{sub}</p>}{children}</section>
);
