const ReportVersionList = ({ reports, onDownload, message }) => <article className="case-card stage-card">
  <div className="section-heading"><div><h2>보고서 버전</h2><p>사건 처리 과정에서 생성된 보고서 목록입니다.</p></div></div>
  <div className="stage-table-wrap"><table className="stage-table"><thead><tr><th>버전</th><th>생성일시</th><th>생성자</th><th>상태</th><th /></tr></thead><tbody>{reports.map((report) => <tr key={report.id}><td><strong>{report.version}</strong></td><td>{report.createdAt}</td><td>{report.creator}</td><td><span className={`report-status-badge ${report.status}`}>{report.status}</span></td><td><button type="button" className="text-action" onClick={() => onDownload(report)}>다운로드</button></td></tr>)}</tbody></table></div>
  {message && <p className="decision-success" role="status">{message}</p>}
</article>;

export default ReportVersionList;
