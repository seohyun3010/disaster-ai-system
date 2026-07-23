import { Link, NavLink } from 'react-router-dom';
import { ROUTES } from '../../routes/routeConfig';
import { useAuthStore } from '../../stores/authStore';
import { useCaseStore } from '../../stores/caseStore';
import { useWorkflowStore } from '../../stores/workflowStore';
import { DEFAULT_WORKFLOW } from '../../mocks/workflow';

const MENU_ITEMS = [
  { label: '대시보드', to: ROUTES.DASHBOARD, icon: '▦', roles: ['ADMIN', 'OFFICER', 'REVIEWER'] },
  { label: '신고 목록', to: ROUTES.CASES, icon: '☷', roles: ['ADMIN', 'OFFICER', 'REVIEWER'] },
  { label: '승인 처리 이력', to: ROUTES.APPROVAL_HISTORY, icon: '✓', roles: ['ADMIN', 'OFFICER', 'REVIEWER'] },
];

const roleLabel = { ADMIN: '관리자', OFFICER: '담당 공무원', REVIEWER: '검토 담당자' };

const Sidebar = () => {
  const user = useAuthStore((state) => state.user);
  const cases = useCaseStore((state) => state.cases);
  const workflows = useWorkflowStore((state) => state.workflows);
  const role = user?.role || 'OFFICER';
  const visibleMenus = MENU_ITEMS.filter((item) => item.roles.includes(role));
  const finalApprovalItems = Object.entries(workflows)
    .filter(([, workflow]) => workflow.approvalStatus && workflow.approvalStatus !== DEFAULT_WORKFLOW.approvalStatus)
    .map(([caseId, workflow]) => ({
      caseId,
      status: workflow.approvalStatus,
      amount: workflow.approvalAmount,
      reporter: cases.find((item) => item.id === caseId)?.reporter || '신고자',
    }))
    .slice(-3)
    .reverse();

  return <aside className="sidebar">
    <div className="sidebar-brand"><div className="brand">재해복구 AI</div><div className="brand-sub">재해 신고·복구 업무 관리</div></div>
    <p className="sidebar-menu-title">주요 메뉴</p>
    <nav aria-label="주요 메뉴">{visibleMenus.map((item) => <NavLink key={item.to} to={item.to} end={item.to === ROUTES.DASHBOARD}><span className="nav-icon" aria-hidden="true">{item.icon}</span><span>{item.label}</span></NavLink>)}</nav>
    {finalApprovalItems.length > 0 && <section className="sidebar-approval-queue" aria-label="최종 승인 처리 현황"><div className="sidebar-approval-heading"><span>최종 승인 처리</span><b>{finalApprovalItems.length}</b></div><p>최근 처리된 신고</p><div>{finalApprovalItems.map((approval) => <Link key={approval.caseId} to={`/cases/${approval.caseId}/final-approval`}><strong>{approval.caseId.slice(-4)} · {approval.reporter}</strong><small>{approval.amount?.toLocaleString('ko-KR')}원</small><em className={approval.status.replaceAll(' ', '-')}>{approval.status}</em></Link>)}</div></section>}
    <div className="side-task"><span>접근 권한</span><div className="side-task-card"><strong>{roleLabel[role] || role}</strong><small>{user?.name || user?.id || '업무 사용자'}님으로 로그인됨</small><em>인증 완료</em></div></div>
    <footer>재해복구업무관리시스템</footer>
  </aside>;
};

export default Sidebar;
