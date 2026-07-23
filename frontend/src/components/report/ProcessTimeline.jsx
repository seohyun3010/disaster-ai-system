import { formatOfficerName, getCurrentUser } from '../../mocks/currentUser';

const getActor = (title) => title.includes('AI') ? 'AI 업무지원' : title.includes('접수') ? '접수 시스템' : formatOfficerName(getCurrentUser());

const ProcessTimeline = ({ history }) => <article className="case-card process-timeline">
  <div className="section-heading"><div><h2>처리 이력</h2><p>신고 접수부터 보고서 생성까지의 업무 기록입니다.</p></div></div>
  <ol>{history.map(([time, title, description]) => <li key={`${time}-${title}`}><span aria-hidden="true" /><div><time>{time}</time><strong>{title}<em className="timeline-actor">{getActor(title)}</em></strong><p>{description}</p></div></li>)}</ol>
</article>;

export default ProcessTimeline;
