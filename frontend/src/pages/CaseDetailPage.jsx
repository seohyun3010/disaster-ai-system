import { useNavigate, useParams } from 'react-router-dom';
import { useCaseStore } from '../stores/caseStore';

const CaseDetailPage = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const cases = useCaseStore((state) => state.cases);
  const item = cases.find((entry) => entry.id === caseId) || cases[0];

  return <div className="case-page">
    <header className="case-page-head detail-head"><div><p>신고 관리 / 신고 목록 / {item.id}</p><h1>재해 신고 상세</h1><span>원본 신고 정보와 피해 위치를 확인한 뒤 AI 분석을 요청합니다.</span></div><div className="detail-status"><span className={`status-badge ${item.status.replaceAll(' ', '-')}`}>{item.status}</span><span className={`urgency-badge ${item.urgency}`}>{item.urgency}</span></div></header>
    <section className="case-detail-grid">
      <article className="case-card"><div className="section-heading"><div><h2>신고 기본 정보</h2><p>신고 접수 시스템에서 수신한 원본 정보입니다.</p></div></div><dl className="case-detail-list"><div><dt>사건번호</dt><dd>{item.id}</dd></div><div><dt>신고 일시</dt><dd>{item.reportedAt}</dd></div><div><dt>신고자</dt><dd>{item.reporter}</dd></div><div><dt>재난 유형</dt><dd>{item.type}</dd></div><div><dt>시설 유형</dt><dd>{item.facility}</dd></div><div><dt>피해 등급</dt><dd>{item.damage}</dd></div><div className="full"><dt>피해 위치</dt><dd>{item.location}</dd></div></dl><div className="report-description"><h3>신고 내용</h3><p>{item.description}</p></div></article>
      <article className="case-card"><div className="section-heading"><div><h2>피해 위치</h2><p>{item.location}</p></div><span className="location-pin">위치 확인</span></div><div className="location-map"><div className="map-road road-one" /><div className="map-road road-two" /><div className="map-block block-one" /><div className="map-block block-two" /><i>●</i><b>신고 위치</b><small>지도 API 연동 영역</small></div></article>
    </section>
    <section className="case-detail-grid">
      <article className="case-card"><div className="section-heading"><div><h2>원본 피해 사진</h2><p>{item.photoName ? item.photoName : '신고자가 첨부한 현장 사진입니다.'}</p></div><span className="photo-count">1 / 3</span></div>{item.photoUrl ? <div className="uploaded-photo"><img src={item.photoUrl} alt={`${item.id} 신고 사진`} /><span>원본 사진</span></div> : <div className="damage-image"><div className="damage-sky" /><div className="damage-house"><i /><i /><i /></div><div className="damage-water" /><span>원본 사진</span></div>}<div className="photo-thumbs"><button type="button" className="selected">사진 1</button><button type="button">사진 2</button><button type="button">사진 3</button></div></article>
      <article className="case-card ai-request-card"><div><p className="request-kicker">AI DAMAGE ANALYSIS</p><h2>AI 피해 분석 요청</h2><p>첨부 사진과 신고 내용을 AI 서버로 전송해 피해 영역, 등급, 중복 가능성을 분석합니다.</p><ul><li>사진 기반 피해 객체·영역 탐지</li><li>피해 등급 및 신뢰도 산출</li><li>유사 신고 중복 여부 확인</li></ul></div><button type="button" className="primary-action" onClick={() => navigate(`/cases/${item.id}/ai-result`)}>AI 분석 요청</button><small>요청 후 분석 진행 상태는 AI 분석 화면에서 확인합니다.</small></article>
    </section>
  </div>;
};

export default CaseDetailPage;
