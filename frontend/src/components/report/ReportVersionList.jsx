const VERSION_NOTES = { 'v1.1': '최종 승인 결과와 지원금 검토 내역 반영', 'v1.0': 'AI 분석 결과 기반 최초 초안' };

const ReportVersionList = ({ reports, onDownload, message }) => <article className="case-card stage-card">
  <div className="section-heading"><div><h2>보고서 버전</h2><p>사건 처리 과정에서 생성된 보고서와 변경 내용을 확인합니다.</p></div></div>
  <div className="stage-table-wrap"><table className="stage-table"><thead><tr><th>버전 / 변경 내용</th><th>생성일시</th><th>생성자</th><th>상태</th><th /></tr></thead><tbody>{reports.map((report) => <tr key={report.id}><td><strong>{report.version}</strong><small className="report-version-note">{VERSION_NOTES[report.version] || '처리 결과 업데이트'}</small></td><td>{report.createdAt}</td><td>{report.creator}</td><td><span className={`report-status-badge ${report.status}`}>{report.status}</span></td><td><button type="button" className="text-action" onClick={() => onDownload(report)}>{report.version} 다운로드</button></td></tr>)}</tbody></table></div>
  {message && <p className="decision-success" role="status">{message}</p>}
</article>;

export default ReportVersionList;
