import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatOfficerAffiliation, formatOfficerName, getCurrentUser } from '../mocks/currentUser';
import { MOCK_APPROVAL_HISTORY } from '../mocks/history';
import { calculateSeverityTotal, DEFAULT_WORKFLOW } from '../mocks/workflow';
import { useCaseStore } from '../stores/caseStore';
import { useWorkflowStore } from '../stores/workflowStore';

const ApprovalHistoryPage = () => {
  const navigate = useNavigate();
  const cases = useCaseStore((state) => state.cases);
  const workflows = useWorkflowStore((state) => state.workflows);
  const deletedIds = useWorkflowStore((state) => state.deletedApprovalHistoryIds || []);
  const caseById = useMemo(() => Object.fromEntries(cases.map((item) => [item.id, item])), [cases]);
  const allLogs = useMemo(() => {
    const savedLogs = Object.entries(workflows)
      .filter(([, workflow]) => workflow.approvalStatus && workflow.approvalStatus !== DEFAULT_WORKFLOW.approvalStatus)
      .map(([caseId, workflow]) => ({ caseId, case: caseById[caseId], status: workflow.approvalStatus, amount: workflow.approvalAmount, severityScore: calculateSeverityTotal(workflow.severityScores || DEFAULT_WORKFLOW.severityScores), reason: workflow.approvalReason || '최종 처리 사유 없음', processedAt: workflow.approvedAt, officer: workflow.approvedBy }));
    const savedIds = new Set(savedLogs.map((log) => log.caseId));
    const mockLogs = MOCK_APPROVAL_HISTORY.filter((log) => !savedIds.has(log.caseId)).map((log) => ({ ...log, case: caseById[log.caseId], severityScore: calculateSeverityTotal(DEFAULT_WORKFLOW.severityScores) }));
    return [...savedLogs, ...mockLogs]
      .filter((log) => Boolean(log.case))
      .filter((log) => !deletedIds.includes(log.caseId))
      .sort((left, right) => (right.processedAt || '').localeCompare(left.processedAt || ''));
  }, [caseById, deletedIds, workflows]);
  return <div className="case-page approval-history-page">
    <section className="case-card approval-history-section"><div className="history-section-head approval-history-head"><h2>승인 이력</h2><div className="approval-history-count"><span>승인 건수</span><strong>{allLogs.length}<small>건</small></strong></div></div>
      <div className="case-table-wrap"><table className="case-table approval-log-table"><thead><tr><th>처리 일시</th><th>사건번호</th><th>신고자 / 위치</th><th>처리 결과</th><th>처리자</th><th>최종 금액</th><th>긴급도 점수</th><th>처리 사유</th><th>관리</th></tr></thead><tbody>{allLogs.map((log) => { const officer = log.officer || getCurrentUser(); const historyPath = `/cases/${log.caseId}/final-approval?view=history`; return <tr key={log.caseId} onClick={() => navigate(historyPath)} className="clickable-row"><td>{log.processedAt || '기록 없음'}</td><td><strong>{log.caseId}</strong></td><td><strong>{log.case?.reporter || '-'}</strong><small>{log.case?.location || '-'}</small></td><td><span className={`approval-status-badge ${log.status.replaceAll(' ', '-')}`}>{log.status}</span></td><td><strong>{formatOfficerName(officer)}</strong><small>{formatOfficerAffiliation(officer)}</small></td><td>{Number(log.amount || 0).toLocaleString('ko-KR')}원</td><td><strong>{log.severityScore}점</strong></td><td className="approval-reason">{log.reason}</td><td><div className="history-row-actions"><button className="row-action" onClick={(event) => { event.stopPropagation(); navigate(historyPath); }}>상세</button></div></td></tr>; })}</tbody></table>{!allLogs.length && <p className="empty-case">등록된 승인 이력이 없습니다.</p>}</div>
    </section>
  </div>;
};

export default ApprovalHistoryPage;
