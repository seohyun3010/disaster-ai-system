import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../api/authApi';
import { useAuthStore } from '../../stores/authStore';
import { ROUTES } from '../../routes/routeConfig';
import { formatOfficerAffiliation, formatOfficerName, getCurrentUser } from '../../mocks/currentUser';
import NotificationMenu from './NotificationMenu';
import TopNavigation from './TopNavigation';

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4 4" />
  </svg>
);

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M19 8a8 8 0 1 0 1 6" />
    <path d="M19 3v5h-5" />
  </svg>
);

const formatRefreshTime = (date) => {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const MenuIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

const Header = () => {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const user = getCurrentUser();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lastRefreshedAt] = useState(() => new Date());

  const refreshPage = () => {
    window.location.reload();
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // 서버 응답과 관계없이 로컬 인증 정보는 정리합니다.
    } finally {
      clearAuth();
      navigate(ROUTES.LOGIN, { replace: true });
    }
  };

  const submitSearch = (event) => {
    event.preventDefault();
    const keyword = new FormData(event.currentTarget).get('globalSearch')?.toString().trim();
    navigate(keyword ? `${ROUTES.CASES}?search=${encodeURIComponent(keyword)}` : ROUTES.CASES);
    setSearchOpen(false);
  };

  return (
    <header className="krds-service-header">
      <div className="krds-brand-row">
        <div className="krds-header-inner">
          <button type="button" className="krds-brand" onClick={() => navigate(ROUTES.DASHBOARD)} aria-label="NDRMS 종합 현황으로 이동">
            <span className="krds-brand-mark" aria-hidden="true"><i /></span>
            <span className="krds-brand-copy">
              <strong>NDRMS</strong>
              <small>재해 신고·복구 업무관리시스템</small>
            </span>
          </button>

          <TopNavigation mobileOpen={mobileMenuOpen} onNavigate={() => setMobileMenuOpen(false)} />

          <div className="krds-header-actions">
            <div className="krds-refresh-summary">
              <button type="button" className="krds-refresh-action" onClick={refreshPage} aria-label="데이터 새로고침">
                <RefreshIcon />
              </button>
              <span><small>마지막 갱신</small><time dateTime={lastRefreshedAt.toISOString()}>{formatRefreshTime(lastRefreshedAt)}</time></span>
            </div>
            <button type="button" className={`krds-icon-action krds-search-action ${searchOpen ? 'is-open' : ''}`} onClick={() => setSearchOpen((current) => !current)} aria-expanded={searchOpen} aria-label="통합검색 열기">
              <SearchIcon />
            </button>
            <NotificationMenu />
            <div className="krds-user-summary">
              <span className="krds-user-avatar" aria-hidden="true">{user.name.slice(0, 1)}</span>
              <span><strong>{formatOfficerName(user)}</strong><small>{formatOfficerAffiliation(user)}</small></span>
            </div>
            <button type="button" className="krds-logout" onClick={handleLogout}>로그아웃</button>
            <button type="button" className="krds-mobile-menu-button" onClick={() => setMobileMenuOpen((current) => !current)} aria-expanded={mobileMenuOpen} aria-label="전체 메뉴">
              <MenuIcon />
            </button>
          </div>
        </div>

        {searchOpen && (
          <form className="krds-header-inline-search" onSubmit={submitSearch}>
            <label className="sr-only" htmlFor="global-search">통합검색</label>
            <div>
              <SearchIcon />
              <input id="global-search" name="globalSearch" placeholder="사건번호, 신고자 또는 피해 위치 검색" autoFocus />
            </div>
            <button type="submit">검색</button>
            <button type="button" className="krds-inline-search-close" onClick={() => setSearchOpen(false)} aria-label="통합검색 닫기">×</button>
          </form>
        )}
      </div>
    </header>
  );
};

export default Header;
