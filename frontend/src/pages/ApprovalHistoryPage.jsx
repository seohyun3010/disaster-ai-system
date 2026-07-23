import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatOfficerAffiliation, formatOfficerName, getCurrentUser } from '../mocks/currentUser';
import { MOCK_APPROVAL_HISTORY } from '../mocks/history';
import { DEFAULT_WORKFLOW } from '../mocks/workflow';
import { useCaseStore } from '../stores/caseStore';
import { useWorkflowStore } from '../stores/workflowStore';

const FILTERS = ['전체', '최종 승인', '금액 수정 후 승인', '보류', '반려'];

const ApprovalHistoryPage = () => {
  const navigate = useNavigate();
  const cases = useCaseStore((state) => state.cases);
  const workflows = useWorkflowStore((state) => state.workflows);
  const [filter, setFilter] = useState('전체');
  const caseById = useMemo(() => Object.fromEntries(cases.map((item) => [item.id, item])), [cases]);
  const allLogs = useMemo(() => {
    const savedLogs = Object.entries(workflows)
    .filter(([, workflow]) => workflow.approvalStatus && workflow.approvalStatus !== DEFAULT_WORKFLOW.approvalStatus)
    .map(([caseId, workflow]) => ({ caseId, case: caseById[caseId], status: workflow.approvalStatus, amount: workflow.approvalAmount, reason: workflow.approvalReason || '최종 처리 사유 없음', processedAt: workflow.approvedAt, officer: workflow.approvedBy }));
    const savedIds = new Set(savedLogs.map((log) => log.caseId));
    const mockLogs = MOCK_APPROVAL_HISTORY.filter((log) => !savedIds.has(log.caseId)).map((log) => ({ ...log, case: caseById[log.caseId] }));
    return [...savedLogs, ...mockLogs].sort((left, right) => (right.processedAt || '').localeCompare(left.processedAt || ''));
  }, [caseById, workflows]);
  const logs = allLogs.filter((log) => filter === '전체' || log.status === filter);
  const countByStatus = (status) => allLogs.filter((log) => log.status === status).length;

  return <div className="case-page approval-history-page"><header className="case-page-head"><div><p>승인 관리 / 처리 이력</p><h1>승인 처리 이력</h1><span>최종 승인, 금액 수정 후 승인, 보류, 반려 결과를 사건별로 확인합니다.</span></div></header><section className="approval-metrics">{FILTERS.slice(1).map((status) => <article key={status}><span>{status}</span><strong>{countByStatus(status)}<small>건</small></strong></article>)}</section><section className="case-card approval-history-section"><div className="history-section-head"><div><h2>최종 승인 처리</h2><p>최종 승인 단계에서 확정된 처리 이력입니다.</p></div></div><div className="approval-action-filters">{FILTERS.map((value) => <button key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{value}</button>)}</div><div className="case-table-wrap"><table className="case-table approval-log-table"><thead><tr><th>처리 일시</th><th>사건번호</th><th>신고자 / 위치</th><th>처리 결과</th><th>처리자</th><th>최종 금액</th><th>처리 사유</th><th /></tr></thead><tbody>{logs.map((log) => { const officer = log.officer || getCurrentUser(); return <tr key={log.caseId} onClick={() => navigate(`/cases/${log.caseId}/final-approval`)} className="clickable-row"><td>{log.processedAt || '기록 없음'}</td><td><strong>{log.caseId}</strong></td><td><strong>{log.case?.reporter || '-'}</strong><small>{log.case?.location || '-'}</small></td><td><span className={`approval-status-badge ${log.status.replaceAll(' ', '-')}`}>{log.status}</span></td><td><strong>{formatOfficerName(officer)}</strong><small>{formatOfficerAffiliation(officer)}</small></td><td>{Number(log.amount || 0).toLocaleString('ko-KR')}원</td><td className="approval-reason">{log.reason}</td><td><button className="row-action" onClick={(event) => { event.stopPropagation(); navigate(`/cases/${log.caseId}/final-approval`); }}>상세</button></td></tr>; })}</tbody></table>{!logs.length && <p className="empty-case">선택한 조건에 해당하는 최종 승인 처리 이력이 없습니다.</p>}</div></section></div>;
};

export default ApprovalHistoryPage;
