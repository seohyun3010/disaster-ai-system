import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ROUTES } from '../../routes/routeConfig';
import { useAuthStore } from '../../stores/authStore';
import './sidebar-hover.css';

const ALL_ROLES = ['ADMIN', 'OFFICER', 'REVIEWER'];

const Sidebar = () => {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const role = user?.role || 'OFFICER';
  const [expanded, setExpanded] = useState({});
  const reportGroupActive = location.pathname === ROUTES.CASES || location.pathname === ROUTES.SAFETY24_INTEGRATION;
  const reviewGroupActive = location.pathname === ROUTES.APPROVAL_HISTORY || location.pathname === ROUTES.REVIEW_HISTORY;
  const canView = (roles = ALL_ROLES) => roles.includes(role);
  const toggleGroup = (group) => setExpanded((current) => ({ ...current, [group]: !current[group] }));

  return <aside className="sidebar">
    <div className="sidebar-brand"><div className="brand">재해복구 AI</div><div className="brand-sub">재해 신고·복구 업무 관리</div></div>
    <p className="sidebar-menu-title">주요 메뉴</p>
    <nav aria-label="주요 메뉴">
      {canView() && <NavLink to={ROUTES.DASHBOARD} end><span className="nav-icon" aria-hidden="true">▦</span><span>대시보드</span></NavLink>}

      {canView() && <div className={`sidebar-nav-group ${reportGroupActive ? 'active-group' : ''} ${expanded.reports ? 'manual-open' : ''}`}>
        <button type="button" className="sidebar-group-trigger" onClick={() => toggleGroup('reports')} aria-expanded={reportGroupActive || Boolean(expanded.reports)}>
          <span className="nav-icon" aria-hidden="true">♧</span><span>신고 관리</span><span className="sidebar-chevron" aria-hidden="true">⌃</span>
        </button>
        <div className="sidebar-submenu">
          <NavLink to={ROUTES.CASES} end><span className="submenu-dot" aria-hidden="true">•</span><span>신고 목록</span></NavLink>
          <NavLink to={ROUTES.SAFETY24_INTEGRATION}><span className="submenu-dot" aria-hidden="true">•</span><span>국민안전24 연동</span></NavLink>
        </div>
      </div>}

      {canView() && <div className={`sidebar-nav-group ${reviewGroupActive ? 'active-group' : ''} ${expanded.reviews ? 'manual-open' : ''}`}>
        <button type="button" className="sidebar-group-trigger" onClick={() => toggleGroup('reviews')} aria-expanded={reviewGroupActive || Boolean(expanded.reviews)}>
          <span className="nav-icon" aria-hidden="true">▣</span><span>검토</span><span className="sidebar-chevron" aria-hidden="true">⌃</span>
        </button>
        <div className="sidebar-submenu">
          <NavLink to={ROUTES.APPROVAL_HISTORY}><span className="submenu-dot" aria-hidden="true">•</span><span>승인 처리 이력</span></NavLink>
          <NavLink to={ROUTES.REVIEW_HISTORY}><span className="submenu-dot" aria-hidden="true">•</span><span>피해등급 검토 이력</span></NavLink>
        </div>
      </div>}

      {canView() && <NavLink className="sidebar-report-link" to={ROUTES.REPORT_MANAGEMENT}><span className="nav-icon" aria-hidden="true">□</span><span>보고서 관리</span></NavLink>}
    </nav>
    <footer>재해복구업무관리시스템</footer>
  </aside>;
};

export default Sidebar;
