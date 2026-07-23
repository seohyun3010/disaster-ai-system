import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { makeCaseFromSafety24Report, SAFETY24_REPORTS } from '../mocks/safety24Reports';
import { useCaseStore } from '../stores/caseStore';

const Safety24IntegrationPage = () => {
  const navigate = useNavigate();
  const addCase = useCaseStore((state) => state.addCase);
  const [connected, setConnected] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState(SAFETY24_REPORTS[0].reportId);
  const report = SAFETY24_REPORTS.find((item) => item.reportId === selectedReportId);

  const importReport = () => {
    const created = addCase(makeCaseFromSafety24Report(report));
    navigate(`/cases/${created.id}`);
  };

  return <div className="case-page safety24-page">
    <header className="case-page-head">
      <div>
        <p>신고 접수 / 국민안전24 연동</p>
        <h1>사유재산 피해신고 연동</h1>
        <span>국민안전24의 접수 신고서에서 업무에 필요한 정보와 첨부 사진만 사건으로 가져옵니다.</span>
      </div>
      <button type="button" className="secondary-action" onClick={() => navigate('/cases')}>신고 목록으로</button>
    </header>

    <section className="case-card safety24-connect-card">
      <div>
        <p className="request-kicker">NATIONAL SAFETY 24</p>
        <h2>국민안전24 신고서 연동</h2>
        <p>연동 후 수신된 신고서를 확인하고, 선택한 신고서만 재해복구업무관리시스템의 사건으로 생성합니다.</p>
      </div>
      <button type="button" className="primary-action" onClick={() => setConnected(true)}>{connected ? '신고서 수신 완료' : '신고서 연동하기'}</button>
    </section>

    {connected && <section className="safety24-content">
      <aside className="case-card safety24-report-list">
        <div className="section-heading"><div><h2>수신 신고서</h2><p>연동된 사유재산 피해신고입니다.</p></div></div>
        {SAFETY24_REPORTS.map((item) => <button type="button" key={item.reportId} className={item.reportId === selectedReportId ? 'selected' : ''} onClick={() => setSelectedReportId(item.reportId)}>
          <strong>{item.applicant.name}</strong><span>{item.disasterType} · {item.facilityType}</span><small>{item.receivedAt}</small>
        </button>)}
      </aside>

      <section className="case-card safety24-report-detail">
        <div className="section-heading"><div><h2>사유재산 피해신고서</h2><p>신고서 원문은 연동 시스템에 보관되며, 아래 정보만 사건 생성에 사용됩니다.</p></div><span className="photo-count">첨부 사진 {report.photos.length}장</span></div>
        <div className="safety24-info-grid">
          <article><h3>인적 사항</h3><dl><div><dt>성명</dt><dd>{report.applicant.name}</dd></div><div><dt>주민등록번호</dt><dd>{report.applicant.residentNumber}</dd></div><div><dt>주소</dt><dd>{report.applicant.address}</dd></div><div><dt>세대원 수</dt><dd>{report.applicant.householdMembers}명</dd></div></dl></article>
          <article><h3>지원금 수령 계좌</h3><dl><div><dt>은행명</dt><dd>{report.payoutAccount.bankName}</dd></div><div><dt>계좌번호</dt><dd>{report.payoutAccount.accountNumber}</dd></div><div><dt>예금주</dt><dd>{report.payoutAccount.accountHolder}</dd></div></dl></article>
          <article><h3>피해 장소</h3><dl><div><dt>피해 주소</dt><dd>{report.damagePlace}</dd></div><div><dt>시설 유형</dt><dd>{report.facilityType}</dd></div><div><dt>재난 유형</dt><dd>{report.disasterType}</dd></div></dl></article>
          <article><h3>피해 종류 및 수량</h3><dl>{report.damageDetails.map((detail) => <div key={detail.category}><dt>{detail.category}</dt><dd>{detail.value}</dd></div>)}</dl></article>
        </div>
        <div className="safety24-photo-list"><h3>피해 사진</h3><div>{report.photos.map((photo, index) => <figure key={photo.name}><img src={photo.url} alt={`${index + 1}번 피해 사진`} /><figcaption>사진 {index + 1} · {photo.name}</figcaption></figure>)}</div></div>
        <p className="safety24-privacy-note">주민등록번호와 계좌번호는 마스킹하여 표시합니다. 실제 연동에서는 백엔드에서 암호화·권한 검증을 처리해야 합니다.</p>
        <footer className="safety24-actions"><button type="button" className="secondary-action" onClick={() => navigate('/cases')}>취소</button><button type="button" className="primary-action" onClick={importReport}>연동하여 피해신고 생성</button></footer>
      </section>
    </section>}
  </div>;
};

export default Safety24IntegrationPage;
