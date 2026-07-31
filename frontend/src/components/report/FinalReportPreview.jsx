import './final-report-preview.css';

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('ko-KR')}원`;
const display = (value) => value || '-';

const FinalReportPreview = ({
  item,
  report,
  damageGrade,
  urgencyScore,
  supportAmount,
  approvalStatus,
  onDownload,
  message,
}) => (
  <article className="case-card final-report-card">
    <div className="final-report-heading">
      <h2>최종 보고서</h2>
      <span className="report-status-badge 최종">최종</span>
    </div>

    <section className="final-report-paper" aria-label="최종 보고서 미리보기">
      <header>
        <span>재해복구 업무 처리 보고서</span>
        <h3>피해 복구 지원 최종 보고서</h3>
        {/* 기존 mock 필드: <p>{item.id}</p> */}
        <p>{item.case_number}</p>
      </header>

      <dl className="final-report-meta">
        {/* 기존 mock 필드(item.reporter/type/facility/location/reportedAt)는 백엔드 snake_case로 교체 */}
        <div><dt>신고자</dt><dd>{display(item.reporter_name)}</dd></div>
        <div><dt>재난 유형</dt><dd>{display(item.disaster_type)}</dd></div>
        <div><dt>시설 유형</dt><dd>{display(item.facility_type)}</dd></div>
        <div><dt>피해 위치</dt><dd>{display(item.address)}</dd></div>
        <div><dt>신고 일시</dt><dd>{display(item.reported_at)}</dd></div>
        <div><dt>최종 승인 일시</dt><dd>{display(report.approved_at)}</dd></div>
      </dl>

      <div className="final-report-result">
        <article><span>최종 피해등급</span><strong>{damageGrade}</strong></article>
        <article><span>긴급도 점수</span><strong>{urgencyScore}점</strong></article>
        <article><span>최종 지원금</span><strong>{formatCurrency(supportAmount)}</strong></article>
      </div>

      <div className="final-report-summary">
        <h4>피해 및 처리 결과</h4>
        <p>{display(report.summary || item.description)}</p>
        <div><span>최종 처리 결과</span><strong>{approvalStatus}</strong></div>
        <div><span>보고서 작성자</span><strong>{report.creator.name}</strong></div>
      </div>
    </section>

    <div className="final-report-actions">
      <button type="button" className="primary-action" onClick={onDownload}>최종 보고서 다운로드</button>
    </div>
    {message && <p className="decision-success" role="status">{message}</p>}
  </article>
);

export default FinalReportPreview;
