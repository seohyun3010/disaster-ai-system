// 기존 mock 작성자 계산 로직은 삭제하지 않고 주석으로 보존합니다.
// import { formatOfficerName, getCurrentUser } from '../../mocks/currentUser';
// const getActor = (title) => title.includes('AI') ? 'AI 업무지원' : title.includes('접수') ? '접수 시스템' : formatOfficerName(getCurrentUser());

const ProcessTimeline = ({ history }) => <article className="case-card process-timeline">
  <div className="section-heading"><div><h2>처리 이력</h2></div></div>
  <ol>{history.map((event) => <li key={`${event.occurred_at}-${event.title}`}><span aria-hidden="true" /><div><time>{event.occurred_at || '-'}</time><strong>{event.title}<em className="timeline-actor">{event.actor || '-'}</em></strong><p>{event.description}</p></div></li>)}</ol>
</article>;

export default ProcessTimeline;
