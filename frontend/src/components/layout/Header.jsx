import { useNavigate } from 'react-router-dom';
import { logout } from '../../api/authApi';
import { useAuthStore } from '../../stores/authStore';
import { ROUTES } from '../../routes/routeConfig';

const roleLabel = { ADMIN: '관리자', OFFICER: '담당 공무원', REVIEWER: '검토 담당자' };

const Header = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

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
      <div className="user-avatar" aria-hidden="true">{(user?.name || user?.id || '사').slice(0, 1)}</div>
      <div><strong>{user?.name || user?.id || '사용자'}</strong><small>{roleLabel[user?.role] || user?.role || '담당 공무원'}</small></div>
      <button type="button" onClick={handleLogout}>로그아웃</button>
    </div>
  </header>;
};

export default Header;
