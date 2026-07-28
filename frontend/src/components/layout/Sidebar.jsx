import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ROUTES } from '../../routes/routeConfig';
import { useAuthStore } from '../../stores/authStore';
import './sidebar-hover.css';

const ALL_ROLES = ['ADMIN', 'OFFICER', 'REVIEWER'];

const SidebarIcon = ({ type }) => {
  const paths = {
    cases: <><path d="M9 4.75h6A2.25 2.25 0 0 1 17.25 7v10A2.25 2.25 0 0 1 15 19.25H5A2.25 2.25 0 0 1 2.75 17V7A2.25 2.25 0 0 1 5 4.75h2" /><path d="M7 3.75A1.75 1.75 0 0 1 8.75 2h2.5A1.75 1.75 0 0 1 13 3.75v2.5H7zM6.5 10h7M6.5 14h5" /></>,
    review: <><path d="M10 2.75 17 5.5v5.25c0 4.1-2.65 7.15-7 8.5-4.35-1.35-7-4.4-7-8.5V5.5z" /><path d="m6.75 10.75 2.1 2.1 4.4-4.6" /></>,
    reports: <><path d="M5 2.75h7l4 4V19.25H5z" /><path d="M12 2.75v4h4M8 11h5M8 14.5h5" /></>,
  };
  return <span className="nav-icon" aria-hidden="true"><svg viewBox="0 0 20 22" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">{paths[type]}</svg></span>;
};

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
          <SidebarIcon type="cases" /><span>신고 관리</span><span className="sidebar-chevron" aria-hidden="true">⌃</span>
        </button>
        <div className="sidebar-submenu">
          <NavLink to={ROUTES.CASES} end><span className="submenu-dot" aria-hidden="true">•</span><span>신고 목록</span></NavLink>
          <NavLink to={ROUTES.SAFETY24_INTEGRATION}><span className="submenu-dot" aria-hidden="true">•</span><span>국민안전24 연동</span></NavLink>
        </div>
      </div>}

      {canView() && <div className={`sidebar-nav-group ${reviewGroupActive ? 'active-group' : ''} ${expanded.reviews ? 'manual-open' : ''}`}>
        <button type="button" className="sidebar-group-trigger" onClick={() => toggleGroup('reviews')} aria-expanded={reviewGroupActive || Boolean(expanded.reviews)}>
          <SidebarIcon type="review" /><span>검토</span><span className="sidebar-chevron" aria-hidden="true">⌃</span>
        </button>
        <div className="sidebar-submenu">
          <NavLink to={ROUTES.APPROVAL_HISTORY}><span className="submenu-dot" aria-hidden="true">•</span><span>승인 처리 이력</span></NavLink>
          <NavLink to={ROUTES.REVIEW_HISTORY}><span className="submenu-dot" aria-hidden="true">•</span><span>피해등급 검토 이력</span></NavLink>
        </div>
      </div>}

      {canView() && <NavLink className="sidebar-report-link" to={ROUTES.REPORT_MANAGEMENT}><SidebarIcon type="reports" /><span>보고서 관리</span></NavLink>}
    </nav>
    <footer>재해복구업무관리시스템</footer>
  </aside>;
};

export default Sidebar;
