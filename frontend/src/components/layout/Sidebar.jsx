import { NavLink } from 'react-router-dom';
import { ROUTES } from '../../routes/routeConfig';
import { useAuthStore } from '../../stores/authStore';

const MENU_ITEMS = [
  { label: '대시보드', to: ROUTES.DASHBOARD, icon: '▦', roles: ['ADMIN', 'OFFICER', 'REVIEWER'] },
  { label: '신고 목록', to: ROUTES.CASES, icon: '☷', roles: ['ADMIN', 'OFFICER', 'REVIEWER'] },
];

const roleLabel = { ADMIN: '관리자', OFFICER: '담당 공무원', REVIEWER: '검토 담당자' };

const Sidebar = () => {
  const user = useAuthStore((state) => state.user);
  const role = user?.role || 'OFFICER';
  const visibleMenus = MENU_ITEMS.filter((item) => item.roles.includes(role));

  return <aside className="sidebar">
    <div className="sidebar-brand">
      <div className="brand">재해복구 AI</div>
      <div className="brand-sub">재해 신고·복구 업무 관리</div>
    </div>

    <p className="sidebar-menu-title">주요 메뉴</p>
    <nav aria-label="주요 메뉴">
      {visibleMenus.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.to === ROUTES.DASHBOARD}>
          <span className="nav-icon" aria-hidden="true">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>

    <div className="side-task">
      <span>접근 권한</span>
      <div className="side-task-card">
        <strong>{roleLabel[role] || role}</strong>
        <small>{user?.name || user?.id || '업무 사용자'}님으로 로그인됨</small>
        <em>인증 완료</em>
      </div>
    </div>
    <footer>재해복구업무관리시스템</footer>
  </aside>;
};

export default Sidebar;
