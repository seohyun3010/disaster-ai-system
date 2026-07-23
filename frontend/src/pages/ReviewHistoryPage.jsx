import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatOfficerAffiliation, formatOfficerName, getCurrentUser } from '../mocks/currentUser';
import { MOCK_REVIEW_HISTORY } from '../mocks/history';
import { useAnalysisStore } from '../stores/analysisStore';
import { useCaseStore } from '../stores/caseStore';

const FILTERS = ['전체', '승인', '수정 승인', '보류', '반려'];
const LABELS = { 승인: '추천 등급 승인', '수정 승인': '등급 수정 후 승인', 보류: '추가 확인 보류', 반려: '분석 결과 반려' };

const ReviewHistoryPage = () => {
  const navigate = useNavigate();
  const cases = useCaseStore((state) => state.cases);
  const analyses = useAnalysisStore((state) => state.analyses);
  const [filter, setFilter] = useState('전체');
  const caseById = useMemo(() => Object.fromEntries(cases.map((item) => [item.id, item])), [cases]);
  const allLogs = useMemo(() => {
    const savedLogs = Object.entries(analyses)
    .filter(([, analysis]) => analysis.reviewStatus && analysis.reviewStatus !== '검토 전')
    .map(([caseId, analysis]) => ({ caseId, case: caseById[caseId], status: analysis.reviewStatus, grade: analysis.reviewedGrade || analysis.result?.recommendedGrade || '-', reason: analysis.reviewReason || 'AI 추천 피해등급을 검토했습니다.', processedAt: analysis.reviewedAt || analysis.completedAt || analysis.requestedAt, officer: analysis.reviewedBy }));
    const savedIds = new Set(savedLogs.map((log) => log.caseId));
    const mockLogs = MOCK_REVIEW_HISTORY.filter((log) => !savedIds.has(log.caseId)).map((log) => ({ ...log, case: caseById[log.caseId] }));
    return [...savedLogs, ...mockLogs].sort((left, right) => (right.processedAt || '').localeCompare(left.processedAt || ''));
  }, [analyses, caseById]);
  const logs = allLogs.filter((log) => filter === '전체' || log.status === filter);
  const countByStatus = (status) => allLogs.filter((log) => log.status === status).length;

  return <div className="case-page review-history-page"><header className="case-page-head"><div><p>검토 관리 / 피해등급 검토</p><h1>피해등급 검토 이력</h1><span>AI 추천 피해등급에 대한 공무원 검토 기록을 확인합니다.</span></div></header><section className="review-metrics">{FILTERS.slice(1).map((status) => <article key={status}><span>{LABELS[status]}</span><strong>{countByStatus(status)}<small>건</small></strong></article>)}</section><section className="case-card approval-history-section review-history-section"><div className="history-section-head"><div><h2>피해등급 검토</h2><p>추천 등급 승인, 등급 수정 후 승인, 추가 확인 보류, 분석 결과 반려 이력입니다.</p></div></div><div className="approval-action-filters review-action-filters">{FILTERS.map((value) => <button key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{value === '전체' ? value : LABELS[value]}</button>)}</div><div className="case-table-wrap"><table className="case-table approval-log-table"><thead><tr><th>검토 일시</th><th>사건번호</th><th>신고자 / 위치</th><th>검토 결과</th><th>최종 피해등급</th><th>검토자</th><th>검토 사유</th><th /></tr></thead><tbody>{logs.map((log) => { const officer = log.officer || getCurrentUser(); return <tr key={log.caseId} onClick={() => navigate(`/cases/${log.caseId}/review`)} className="clickable-row"><td>{log.processedAt || '기록 없음'}</td><td><strong>{log.caseId}</strong></td><td><strong>{log.case?.reporter || '-'}</strong><small>{log.case?.location || '-'}</small></td><td><span className={`review-status-badge ${log.status.replaceAll(' ', '-')}`}>{LABELS[log.status] || log.status}</span></td><td>{log.grade}</td><td><strong>{formatOfficerName(officer)}</strong><small>{formatOfficerAffiliation(officer)}</small></td><td className="approval-reason">{log.reason}</td><td><button className="row-action" onClick={(event) => { event.stopPropagation(); navigate(`/cases/${log.caseId}/review`); }}>상세</button></td></tr>; })}</tbody></table>{!logs.length && <p className="empty-case">선택한 조건에 해당하는 피해등급 검토 이력이 없습니다.</p>}</div></section></div>;
};

export default ReviewHistoryPage;
