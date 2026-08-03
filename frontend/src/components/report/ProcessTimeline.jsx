import { formatOfficerName, getCurrentUser } from '../../mocks/currentUser';

const OFFICER_EVENT_KEYWORDS = ['승인', '검토', '긴급도', '지원금', '보고서'];
const getActor = (event) => event.actor || (OFFICER_EVENT_KEYWORDS.some(
  (keyword) => event.title?.includes(keyword),
)
  ? formatOfficerName(getCurrentUser())
  : '-');

const ProcessTimeline = ({ history }) => <article className="case-card process-timeline">
  <div className="section-heading"><div><h2>처리 이력</h2></div></div>
  <ol>{history.map((event) => <li key={event.id || `${event.occurred_at}-${event.title}`}><span aria-hidden="true" /><div><time>{event.occurred_at || '-'}</time><strong>{event.title}<em className="timeline-actor">{getActor(event)}</em></strong><p>{event.description}</p></div></li>)}</ol>
</article>;

export default ProcessTimeline;
