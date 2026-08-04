import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatOfficerAffiliation, formatOfficerName, getCurrentUser } from '../mocks/currentUser';
import { MOCK_APPROVAL_HISTORY } from '../mocks/history';
import { calculateSeverityTotal, DEFAULT_WORKFLOW } from '../mocks/workflow';
import { useCaseStore } from '../stores/caseStore';
import { useWorkflowStore } from '../stores/workflowStore';
import { buildDisasterEvents } from '../utils/disasterEvents';
import './report-management.css';

const PAGE_SIZE_OPTIONS = [5, 10, 20];

const ApprovalHistoryPage = () => {
  const navigate = useNavigate();
  const cases = useCaseStore((state) => state.cases);
  const workflows = useWorkflowStore((state) => state.workflows);
  const deletedIds = useWorkflowStore((state) => state.deletedApprovalHistoryIds || []);
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [sortOrder, setSortOrder] = useState('latest');
  const [page, setPage] = useState(1);
  const caseById = useMemo(() => Object.fromEntries(cases.map((item) => [item.id, item])), [cases]);
  const disasterNameByCaseId = useMemo(() => Object.fromEntries(
    buildDisasterEvents(cases).flatMap((event) => (
      event.caseIds.map((caseId) => [String(caseId), event.name])
    )),
  ), [cases]);
  const allLogs = useMemo(() => {
    const savedLogs = Object.entries(workflows)
      .filter(([, workflow]) => workflow.approvalStatus && workflow.approvalStatus !== DEFAULT_WORKFLOW.approvalStatus)
      .map(([caseId, workflow]) => ({ caseId, case: caseById[caseId], disasterName: disasterNameByCaseId[caseId] || caseById[caseId]?.type || '-', status: workflow.approvalStatus, amount: workflow.approvalAmount, severityScore: calculateSeverityTotal(workflow.severityScores || DEFAULT_WORKFLOW.severityScores), reason: workflow.approvalReason || '최종 처리 사유 없음', processedAt: workflow.approvedAt, officer: workflow.approvedBy }));
    const savedIds = new Set(savedLogs.map((log) => log.caseId));
    const mockLogs = MOCK_APPROVAL_HISTORY.filter((log) => !savedIds.has(log.caseId)).map((log) => ({ ...log, case: caseById[log.caseId], disasterName: disasterNameByCaseId[log.caseId] || caseById[log.caseId]?.type || '-', severityScore: calculateSeverityTotal(DEFAULT_WORKFLOW.severityScores) }));
    return [...savedLogs, ...mockLogs]
      .filter((log) => Boolean(log.case))
      .filter((log) => !deletedIds.includes(log.caseId))
      .sort((left, right) => (right.processedAt || '').localeCompare(left.processedAt || ''));
  }, [caseById, deletedIds, disasterNameByCaseId, workflows]);
  const filteredLogs = useMemo(() => {
    const term = search.trim().toLowerCase();
    return allLogs
      .filter((log) => !term || `${log.caseId} ${log.disasterName || ''} ${log.case?.reporter || ''} ${log.case?.location || ''} ${log.status || ''}`.toLowerCase().includes(term))
      .sort((left, right) => sortOrder === 'latest'
        ? (right.processedAt || '').localeCompare(left.processedAt || '')
        : (left.processedAt || '').localeCompare(right.processedAt || ''));
  }, [allLogs, search, sortOrder]);
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const visibleLogs = filteredLogs.slice((page - 1) * pageSize, page * pageSize);

  return <div className="case-page approval-history-page">
    <section className="case-card report-management-card approval-history-section">
      <div className="report-management-toolbar"><label>이력 검색<input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="사건번호, 재해명, 신고자, 피해 위치 검색" /></label><p className="report-management-count">총 <strong>{filteredLogs.length}</strong>건</p></div>

      <div className="krds-structured-report-list">
        <div className="report-list-controls filter-only-list-controls">
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

        <div className="case-table-wrap approval-history-table-wrap"><table className="case-table approval-log-table"><thead><tr><th>처리 일시</th><th>사건번호</th><th>재해명</th><th>신고자 / 위치</th><th>처리 결과</th><th>승인자</th><th>최종 금액</th><th>긴급도 점수</th><th>처리 사유</th><th>관리</th></tr></thead><tbody>{visibleLogs.map((log) => { const officer = log.officer || getCurrentUser(); const historyPath = `/cases/${log.caseId}/final-approval?view=history`; return <tr key={log.caseId} onClick={() => navigate(historyPath)} className="clickable-row"><td>{log.processedAt || '기록 없음'}</td><td><strong>{log.caseId}</strong></td><td><strong>{log.disasterName}</strong></td><td><strong>{log.case?.reporter || '-'}</strong><small>{log.case?.location || '-'}</small></td><td><span className={`approval-status-badge ${log.status.replaceAll(' ', '-')}`}>{log.status}</span></td><td><strong>{formatOfficerName(officer)}</strong><small>{formatOfficerAffiliation(officer)}</small></td><td>{Number(log.amount || 0).toLocaleString('ko-KR')}원</td><td><strong>{log.severityScore}점</strong></td><td className="approval-reason">{log.reason}</td><td><div className="history-row-actions"><button className="row-action" onClick={(event) => { event.stopPropagation(); navigate(historyPath); }}>상세</button></div></td></tr>; })}</tbody></table>{!visibleLogs.length && <p className="empty-case">등록된 승인 이력이 없습니다.</p>}</div>

        {totalPages > 1 && <nav className="krds-report-pagination" aria-label="승인 이력 목록 페이지">
          <button type="button" className="page-navi" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>이전</button>
          <div>{Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => <button type="button" key={pageNumber} className={page === pageNumber ? 'active' : ''} onClick={() => setPage(pageNumber)}><span className="sr-only">{page === pageNumber ? '현재 페이지 ' : ''}</span>{pageNumber}</button>)}</div>
          <button type="button" className="page-navi" disabled={page === totalPages} onClick={() => setPage((current) => current + 1)}>다음</button>
        </nav>}
      </div>
    </section>
  </div>;
};

export default ApprovalHistoryPage;
