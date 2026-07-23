import { useNavigate } from 'react-router-dom';
import { logout } from '../../api/authApi';
import { useAuthStore } from '../../stores/authStore';
import { ROUTES } from '../../routes/routeConfig';
import { formatOfficerAffiliation, formatOfficerName, getCurrentUser } from '../../mocks/currentUser';

const Header = () => {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const user = getCurrentUser();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // 프론트 데모 또는 네트워크 실패 시에도 로컬 인증 정보는 정리합니다.
    } finally {
      clearAuth();
      navigate(ROUTES.LOGIN, { replace: true });
    }
  };

  return <header className="app-header">
    <div className="header-title"><strong>재해복구업무관리시스템</strong><span>공무원 업무 포털</span></div>
    <div className="user-menu">
      <div className="user-avatar" aria-hidden="true">{user.name.slice(0, 1)}</div>
      <div><strong>{formatOfficerName(user)}</strong><small>{formatOfficerAffiliation(user)}</small></div>
      <button type="button" onClick={handleLogout}>로그아웃</button>
    </div>
  </header>;
};

export default Header;
