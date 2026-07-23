import CaseProgressStepper from './CaseProgressStepper';

const CaseStageHeader = ({ item, breadcrumb, title, description, action }) => <>
  <header className="case-page-head"><div><p>{breadcrumb}</p><h1>{title}</h1><span>{description}</span></div>{action}</header>
  <CaseProgressStepper />
  <section className="case-card analysis-case-summary">
    <div><span>사건번호</span><strong>{item.id}</strong></div>
    <div><span>피해 위치</span><strong>{item.location}</strong></div>
    <div><span>재난 유형</span><strong>{item.type}</strong></div>
  </section>
</>;

export default CaseStageHeader;
