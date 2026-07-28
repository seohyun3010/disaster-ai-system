import { useMemo, useState } from 'react';
import { formatOfficerFull, getCurrentUser } from '../mocks/currentUser';
import { MOCK_APPROVAL_HISTORY } from '../mocks/history';
import { calculateSeverityTotal, DEFAULT_WORKFLOW, downloadMockReport } from '../mocks/workflow';
import { useAnalysisStore } from '../stores/analysisStore';
import { useCaseStore } from '../stores/caseStore';
import { useWorkflowStore } from '../stores/workflowStore';
import './report-management.css';

const FINAL_STATUSES = ['최종 승인', '금액 수정 후 승인'];

const ReportManagementPage = () => {
  const cases = useCaseStore((state) => state.cases);
  const analyses = useAnalysisStore((state) => state.analyses);
  const workflows = useWorkflowStore((state) => state.workflows);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');

  const reports = useMemo(() => {
    const approvalByCase = Object.fromEntries(MOCK_APPROVAL_HISTORY.map((entry) => [entry.caseId, entry]));
    return cases.flatMap((item, index) => {
      const workflow = workflows[item.id];
      const approval = approvalByCase[item.id];
      const savedApprovalStatus = workflow?.approvalStatus && workflow.approvalStatus !== DEFAULT_WORKFLOW.approvalStatus
        ? workflow.approvalStatus
        : null;
      const approvalStatus = savedApprovalStatus || approval?.status || '승인 대기';
      if (!FINAL_STATUSES.includes(approvalStatus)) return [];
      const analysis = analyses[item.id];
      return [{
        id: `RPT-${String(index + 1).padStart(3, '0')}`,
        caseId: item.id,
        reporter: item.reporter,
        disasterType: item.type,
        facility: item.facility,
        location: item.location,
        description: item.description,
        damageGrade: analysis?.reviewedGrade || analysis?.result?.recommendedGrade || item.damage,
        urgencyScore: calculateSeverityTotal(workflow?.severityScores || DEFAULT_WORKFLOW.severityScores),
        supportAmount: workflow?.approvalAmount ?? approval?.amount ?? workflow?.supportAmount ?? 0,
        approvalStatus,
        status: '최종',
        createdAt: workflow?.approvedAt || approval?.processedAt || item.reportedAt,
        creator: workflow?.approvedBy ? formatOfficerFull(workflow.approvedBy) : formatOfficerFull(getCurrentUser()),
      }];
    });
  }, [analyses, cases, workflows]);

  const filteredReports = reports.filter((report) => {
    const keyword = `${report.caseId} ${report.reporter} ${report.disasterType} ${report.location}`.toLowerCase();
    return keyword.includes(search.trim().toLowerCase());
  });

  const download = (report) => {
    downloadMockReport(report, report.caseId, {
      reporter: report.reporter,
      disasterType: report.disasterType,
      facility: report.facility,
      location: report.location,
      damageGrade: report.damageGrade,
      urgencyScore: report.urgencyScore,
      supportAmount: report.supportAmount,
      approvalStatus: report.approvalStatus,
      description: report.description,
    });
    setMessage(`${report.caseId} 최종 보고서를 다운로드했습니다.`);
  };

  return <div className="case-page report-management-page">
    <header className="case-page-head">
      <div><p>보고서 / 보고서 관리</p><h1>보고서 관리</h1></div>
    </header>

    <section className="report-management-metrics">
      <article><span>최종 보고서</span><strong>{reports.length}<small>건</small></strong></article>
    </section>

    <section className="case-card report-management-card">
      <div className="history-section-head"><h2>사건별 보고서</h2></div>
      <div className="report-management-toolbar">
        <label>보고서 검색<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="사건번호, 신고자, 재난 유형, 위치 검색" /></label>
      </div>

      <div className="stage-table-wrap">
        <table className="stage-table report-management-table">
          <thead><tr><th>보고서 / 사건번호</th><th>신고자 / 재난 유형</th><th>피해 위치</th><th>상태</th><th>생성일시</th><th>생성자</th><th>다운로드</th></tr></thead>
          <tbody>{filteredReports.map((report) => <tr key={report.caseId}>
            <td><strong>{report.id}</strong><small>{report.caseId}</small></td>
            <td><b>{report.reporter}</b><small>{report.disasterType}</small></td>
            <td>{report.location}</td>
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
