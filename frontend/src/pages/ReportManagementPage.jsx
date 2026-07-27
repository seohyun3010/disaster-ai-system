import { useMemo, useState } from 'react';
import { formatOfficerFull, getCurrentUser } from '../mocks/currentUser';
import { MOCK_APPROVAL_HISTORY } from '../mocks/history';
import { downloadMockReport } from '../mocks/workflow';
import { useCaseStore } from '../stores/caseStore';
import { useWorkflowStore } from '../stores/workflowStore';
import './report-management.css';

const REPORT_FILTERS = ['전체', '최종', '초안'];
const FINAL_STATUSES = ['최종 승인', '금액 수정 후 승인'];

const ReportManagementPage = () => {
  const cases = useCaseStore((state) => state.cases);
  const workflows = useWorkflowStore((state) => state.workflows);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('전체');
  const [message, setMessage] = useState('');

  const reports = useMemo(() => {
    const approvalByCase = Object.fromEntries(MOCK_APPROVAL_HISTORY.map((entry) => [entry.caseId, entry]));
    return cases.map((item, index) => {
      const workflow = workflows[item.id];
      const approval = approvalByCase[item.id];
      const approvalStatus = workflow?.approvalStatus || approval?.status || '승인 대기';
      const reportStatus = FINAL_STATUSES.includes(approvalStatus) ? '최종' : '초안';
      return {
        id: `RPT-${String(index + 1).padStart(3, '0')}`,
        caseId: item.id,
        reporter: item.reporter,
        disasterType: item.type,
        location: item.location,
        version: reportStatus === '최종' ? 'v1.1' : 'v1.0',
        status: reportStatus,
        createdAt: workflow?.approvedAt || approval?.processedAt || item.reportedAt,
        creator: workflow?.approvedBy ? formatOfficerFull(workflow.approvedBy) : formatOfficerFull(getCurrentUser()),
      };
    });
  }, [cases, workflows]);

  const filteredReports = reports.filter((report) => {
    const matchesStatus = status === '전체' || report.status === status;
    const keyword = `${report.caseId} ${report.reporter} ${report.disasterType} ${report.location}`.toLowerCase();
    return matchesStatus && keyword.includes(search.trim().toLowerCase());
  });

  const download = (report) => {
    downloadMockReport(report, report.caseId);
    setMessage(`${report.caseId} ${report.version} 보고서를 다운로드했습니다.`);
  };

  return <div className="case-page report-management-page">
    <header className="case-page-head">
      <div><p>보고서 / 보고서 관리</p><h1>보고서 관리</h1><span>사건별 재해복구 보고서를 검색하고 최종·초안 상태를 관리합니다.</span></div>
    </header>

    <section className="report-management-metrics">
      <article><span>전체 보고서</span><strong>{reports.length}<small>건</small></strong></article>
      <article><span>최종 보고서</span><strong>{reports.filter((report) => report.status === '최종').length}<small>건</small></strong></article>
      <article><span>초안 보고서</span><strong>{reports.filter((report) => report.status === '초안').length}<small>건</small></strong></article>
    </section>

    <section className="case-card report-management-card">
      <div className="history-section-head"><h2>사건별 보고서</h2><p>사건번호, 신고자, 재난 유형 또는 위치로 보고서를 찾을 수 있습니다.</p></div>
      <div className="report-management-toolbar">
        <label>보고서 검색<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="사건번호, 신고자, 재난 유형, 위치 검색" /></label>
        <div className="report-status-filters" aria-label="보고서 상태 필터">
          {REPORT_FILTERS.map((value) => <button type="button" key={value} className={status === value ? 'active' : ''} onClick={() => setStatus(value)}>{value}</button>)}
        </div>
      </div>

      <div className="stage-table-wrap">
        <table className="stage-table report-management-table">
          <thead><tr><th>보고서 / 사건번호</th><th>신고자 / 재난 유형</th><th>피해 위치</th><th>버전</th><th>상태</th><th>생성일시</th><th>생성자</th><th>다운로드</th></tr></thead>
          <tbody>{filteredReports.map((report) => <tr key={report.caseId}>
            <td><strong>{report.id}</strong><small>{report.caseId}</small></td>
            <td><b>{report.reporter}</b><small>{report.disasterType}</small></td>
            <td>{report.location}</td>
            <td>{report.version}</td>
            <td><span className={`report-status-badge ${report.status}`}>{report.status}</span></td>
            <td>{report.createdAt}</td>
            <td>{report.creator}</td>
            <td><button type="button" className="text-action" onClick={() => download(report)}>다운로드</button></td>
          </tr>)}</tbody>
        </table>
        {!filteredReports.length && <p className="empty-case">조건에 맞는 보고서가 없습니다.</p>}
      </div>
      {message && <p className="decision-success" role="status">{message}</p>}
    </section>
  </div>;
};

export default ReportManagementPage;
