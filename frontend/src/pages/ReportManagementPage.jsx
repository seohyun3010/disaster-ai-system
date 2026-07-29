import { useMemo, useState } from 'react';
import { formatOfficerFull, getCurrentUser } from '../mocks/currentUser';
import { MOCK_APPROVAL_HISTORY } from '../mocks/history';
import { calculateSeverityTotal, DEFAULT_WORKFLOW, downloadMockReport } from '../mocks/workflow';
import { useAnalysisStore } from '../stores/analysisStore';
import { useCaseStore } from '../stores/caseStore';
import { useWorkflowStore } from '../stores/workflowStore';
import './report-management.css';

const FINAL_STATUSES = ['최종 승인', '금액 수정 후 승인'];
const PAGE_SIZE_OPTIONS = [5, 10, 20];

const ReportManagementPage = () => {
  const cases = useCaseStore((state) => state.cases);
  const analyses = useAnalysisStore((state) => state.analyses);
  const workflows = useWorkflowStore((state) => state.workflows);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [selectedReports, setSelectedReports] = useState(() => new Set());
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [sortOrder, setSortOrder] = useState('latest');
  const [page, setPage] = useState(1);

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

  const filteredReports = useMemo(() => reports
    .filter((report) => {
      const keyword = `${report.id} ${report.caseId} ${report.reporter} ${report.disasterType} ${report.location}`.toLowerCase();
      return keyword.includes(search.trim().toLowerCase());
    })
    .sort((a, b) => sortOrder === 'latest'
      ? b.createdAt.localeCompare(a.createdAt)
      : a.createdAt.localeCompare(b.createdAt)), [reports, search, sortOrder]);
  const totalPages = Math.max(1, Math.ceil(filteredReports.length / pageSize));
  const visibleReports = filteredReports.slice((page - 1) * pageSize, page * pageSize);
  const allVisibleSelected = visibleReports.length > 0 && visibleReports.every((report) => selectedReports.has(report.caseId));

  const download = (report, { silent = false } = {}) => {
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
    if (!silent) setMessage(`${report.caseId} 최종 보고서를 다운로드했습니다.`);
  };

  const toggleReport = (caseId) => {
    setSelectedReports((current) => {
      const next = new Set(current);
      if (next.has(caseId)) next.delete(caseId);
      else next.add(caseId);
      return next;
    });
  };

  const toggleVisibleReports = () => {
    setSelectedReports((current) => {
      const next = new Set(current);
      visibleReports.forEach((report) => {
        if (allVisibleSelected) next.delete(report.caseId);
        else next.add(report.caseId);
      });
      return next;
    });
  };

  const downloadSelected = async () => {
    const targets = reports.filter((report) => selectedReports.has(report.caseId));
    if (!targets.length || isBulkDownloading) return;

    setIsBulkDownloading(true);
    setMessage('');

    for (const [index, report] of targets.entries()) {
      download(report, { silent: true });
      if (index < targets.length - 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 250));
      }
    }

    setMessage(`선택한 최종 보고서 ${targets.length}건을 모두 다운로드했습니다.`);
    setIsBulkDownloading(false);
  };

  return <div className="case-page report-management-page">
    <header className="case-page-head">
      <div><p>보고서 / 보고서 관리</p><h1>보고서 관리</h1></div>
    </header>

    <section className="report-management-metrics">
      <article><span>최종 보고서</span><strong>{reports.length}<small>건</small></strong></article>
    </section>

    <section className="case-card report-management-card">
      <div className="report-management-toolbar">
        <label>보고서 검색<input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="보고서번호, 사건번호, 신고자, 재난 유형, 위치 검색" /></label>
        <p className="report-management-count">총 <strong>{filteredReports.length}</strong>건</p>
      </div>

      <div className="krds-structured-report-list">
        <div className="report-list-controls">
          <div className="report-selection-controls">
            <label className="krds-report-check">
              <input type="checkbox" checked={allVisibleSelected} onChange={toggleVisibleReports} disabled={!visibleReports.length} />
              <span>현재 페이지 전체선택</span>
            </label>
            <span className="report-control-divider" aria-hidden="true" />
            <button type="button" className="report-bulk-download" onClick={downloadSelected} disabled={!selectedReports.size || isBulkDownloading} aria-busy={isBulkDownloading}>
              <span aria-hidden="true">↓</span> {isBulkDownloading ? '다운로드 중...' : '선택 보고서 다운로드'}
            </button>
            {selectedReports.size > 0 && <span className="selected-report-count">{selectedReports.size}건 선택</span>}
          </div>

          <div className="report-sort-controls">
            <label>목록 표시 개수
              <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}>
                {PAGE_SIZE_OPTIONS.map((size) => <option key={size} value={size}>{size}개</option>)}
              </select>
            </label>
            <div className="report-sort-buttons" aria-label="정렬 기준">
              <span>정렬기준</span>
              <button type="button" className={sortOrder === 'latest' ? 'active' : ''} onClick={() => { setSortOrder('latest'); setPage(1); }}>최신순</button>
              <button type="button" className={sortOrder === 'oldest' ? 'active' : ''} onClick={() => { setSortOrder('oldest'); setPage(1); }}>오래된순</button>
            </div>
            <label className="report-mobile-sort">정렬기준
              <select value={sortOrder} onChange={(event) => { setSortOrder(event.target.value); setPage(1); }}>
                <option value="latest">최신순</option>
                <option value="oldest">오래된순</option>
              </select>
            </label>
          </div>
        </div>

        <div className="report-structured-table-wrap">
          <table className="report-structured-table">
            <caption>최종 승인된 사건 보고서 목록</caption>
            <thead><tr><th scope="col">선택</th><th scope="col">보고서 정보</th><th scope="col">신고자 / 재난 유형</th><th scope="col">피해 위치</th><th scope="col">상태</th><th scope="col">생성일시 / 생성자</th><th scope="col"><span className="sr-only">다운로드</span></th></tr></thead>
            <tbody>{visibleReports.map((report) => <tr key={report.caseId}>
              <th scope="row" data-label="선택">
                <label className="krds-report-check icon-only">
                  <input type="checkbox" checked={selectedReports.has(report.caseId)} onChange={() => toggleReport(report.caseId)} />
                  <span className="sr-only">{report.id} 선택</span>
                </label>
              </th>
              <td data-label="보고서 정보"><strong>{report.id}</strong><small>{report.caseId}</small></td>
              <td data-label="신고자 / 재난 유형"><b>{report.reporter}</b><small>{report.disasterType}</small></td>
              <td data-label="피해 위치">{report.location}</td>
              <td data-label="상태"><span className={`report-status-badge ${report.status}`}>{report.status}</span></td>
              <td data-label="생성일시 / 생성자"><span>{report.createdAt}</span><small>{report.creator}</small></td>
              <td data-label="다운로드"><button type="button" className="report-row-download" onClick={() => download(report)}><span aria-hidden="true">↓</span> 다운로드</button></td>
            </tr>)}</tbody>
          </table>
          {!visibleReports.length && <p className="empty-case">조건에 맞는 보고서가 없습니다.</p>}
        </div>

        {totalPages > 1 && <nav className="krds-report-pagination" aria-label="보고서 목록 페이지">
          <button type="button" className="page-navi" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>이전</button>
          <div>{Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => <button type="button" key={pageNumber} className={page === pageNumber ? 'active' : ''} onClick={() => setPage(pageNumber)}><span className="sr-only">{page === pageNumber ? '현재 페이지 ' : ''}</span>{pageNumber}</button>)}</div>
          <button type="button" className="page-navi" disabled={page === totalPages} onClick={() => setPage((current) => current + 1)}>다음</button>
        </nav>}
      </div>
      {message && <p className="decision-success" role="status">{message}</p>}
    </section>
  </div>;
};

export default ReportManagementPage;
