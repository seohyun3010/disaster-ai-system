import { NavLink } from 'react-router-dom';
import { ROUTES } from '../../routes/routeConfig';
import { useAuthStore } from '../../stores/authStore';

const ALL_ROLES = ['ADMIN', 'OFFICER', 'REVIEWER'];

const TopNavigation = ({ mobileOpen = false, onNavigate = () => {} }) => {
  const user = useAuthStore((state) => state.user);
  const role = user?.role || 'OFFICER';
  const canView = (roles = ALL_ROLES) => roles.includes(role);

  const close = () => {
    onNavigate();
  };

  return (
    <nav className={`krds-main-navigation ${mobileOpen ? 'mobile-open' : ''}`} aria-label="주요 업무 메뉴">
      <div className="krds-header-inner">
        {canView() && <NavLink className="krds-gnb-link" to={ROUTES.DASHBOARD} onClick={close}>대시보드</NavLink>}

        {canView() && <NavLink className="krds-gnb-link" to={ROUTES.CASES} onClick={close}>신고 목록</NavLink>}

        {canView() && <NavLink className="krds-gnb-link" to={ROUTES.APPROVAL_HISTORY} onClick={close}>승인 처리 이력</NavLink>}

        {canView() && <NavLink className="krds-gnb-link" to={ROUTES.REPORT_MANAGEMENT} onClick={close}>보고서 관리</NavLink>}
      </div>
    </nav>
  );
};

export default TopNavigation;
