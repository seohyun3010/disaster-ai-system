import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatOfficerAffiliation, formatOfficerName, getCurrentUser } from '../mocks/currentUser';
import { DEFAULT_WORKFLOW } from '../mocks/workflow';
import { useCaseStore } from '../stores/caseStore';
import { useWorkflowStore } from '../stores/workflowStore';

const FILTERS = ['전체', '최종 승인', '금액 수정 승인', '보류', '반려'];

const ApprovalHistoryPage = () => {
  const navigate = useNavigate();
  const cases = useCaseStore((state) => state.cases);
  const workflows = useWorkflowStore((state) => state.workflows);
  const [filter, setFilter] = useState('전체');
  const allLogs = useMemo(() => Object.entries(workflows)
    .filter(([, workflow]) => workflow.approvalStatus && workflow.approvalStatus !== DEFAULT_WORKFLOW.approvalStatus)
    .map(([caseId, workflow]) => ({ case: cases.find((item) => item.id === caseId), caseId, ...workflow }))
    .sort((left, right) => (right.approvedAt || '').localeCompare(left.approvedAt || '')), [cases, workflows]);
  const logs = allLogs.filter((item) => filter === '전체' || item.approvalStatus === filter);
  const countByStatus = (status) => allLogs.filter((item) => item.approvalStatus === status).length;

  return <div className="case-page approval-history-page">
    <header className="case-page-head"><div><p>승인 관리 / 처리 이력</p><h1>최종 승인 처리 이력</h1><span>최종 승인, 금액 수정 승인, 보류, 반려 처리 결과와 담당자를 사건별로 확인합니다.</span></div></header>
    <section className="approval-metrics">{FILTERS.slice(1).map((status) => <article key={status}><span>{status}</span><strong>{countByStatus(status)}<small>건</small></strong></article>)}</section>
    <section className="case-card">
      <div className="approval-history-filter">{FILTERS.map((status) => <button key={status} className={filter === status ? 'active' : ''} onClick={() => setFilter(status)}>{status}</button>)}</div>
      <div className="case-table-wrap"><table className="case-table approval-log-table">
        <thead><tr><th>처리 일시</th><th>사건번호</th><th>신고자 / 위치</th><th>처리 결과</th><th>승인자</th><th>최종 금액</th><th>처리 사유</th><th /></tr></thead>
        <tbody>{logs.map((log) => {
          const officer = log.approvedBy || getCurrentUser();
          return <tr key={log.caseId} onClick={() => navigate(`/cases/${log.caseId}/final-approval`)} className="clickable-row">
            <td>{log.approvedAt || '기록 없음'}</td><td><strong>{log.caseId}</strong></td><td><strong>{log.case?.reporter || '-'}</strong><small>{log.case?.location || '-'}</small></td>
            <td><span className={`approval-status-badge ${log.approvalStatus.replaceAll(' ', '-')}`}>{log.approvalStatus}</span></td>
            <td><strong>{formatOfficerName(officer)}</strong><small>{formatOfficerAffiliation(officer)}</small></td>
            <td>{Number(log.approvalAmount || 0).toLocaleString('ko-KR')}원</td><td className="approval-reason">{log.approvalReason || '처리 사유 없음'}</td>
            <td><button className="row-action" onClick={(event) => { event.stopPropagation(); navigate(`/cases/${log.caseId}/final-approval`); }}>상세</button></td>
          </tr>;
        })}</tbody>
      </table>{!logs.length && <p className="empty-case">선택한 조건에 해당하는 최종 승인 처리 이력이 없습니다.</p>}</div>
    </section>
  </div>;
};

export default ApprovalHistoryPage;
