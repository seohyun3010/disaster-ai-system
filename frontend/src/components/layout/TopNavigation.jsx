import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ROUTES } from '../../routes/routeConfig';
import { useAuthStore } from '../../stores/authStore';

const ALL_ROLES = ['ADMIN', 'OFFICER', 'REVIEWER'];

const Chevron = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7.5 5 5 5-5" /></svg>
);

const TopNavigation = ({ mobileOpen = false, onNavigate = () => {} }) => {
  const { pathname } = useLocation();
  const user = useAuthStore((state) => state.user);
  const role = user?.role || 'OFFICER';
  const navRef = useRef(null);
  const [openGroup, setOpenGroup] = useState('');
  const canView = (roles = ALL_ROLES) => roles.includes(role);
  const reviewActive = pathname === ROUTES.APPROVAL_HISTORY || pathname === ROUTES.REVIEW_HISTORY;

  useEffect(() => {
    const closeOnOutside = (event) => {
      if (!navRef.current?.contains(event.target)) setOpenGroup('');
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpenGroup('');
    };
    document.addEventListener('pointerdown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  const close = () => {
    setOpenGroup('');
    onNavigate();
  };

  const toggle = (group) => setOpenGroup((current) => current === group ? '' : group);

  return (
    <nav ref={navRef} className={`krds-main-navigation ${mobileOpen ? 'mobile-open' : ''}`} aria-label="주요 업무 메뉴">
      <div className="krds-header-inner">
        {canView() && <NavLink className="krds-gnb-link" to={ROUTES.DASHBOARD} onClick={close}>대시보드</NavLink>}

        {canView() && <NavLink className="krds-gnb-link" to={ROUTES.CASES} onClick={close}>신고 목록</NavLink>}

        {canView() && (
          <div className={`krds-gnb-group ${reviewActive ? 'active' : ''} ${openGroup === 'review' ? 'open' : ''}`}>
            <button type="button" onClick={() => toggle('review')} aria-expanded={openGroup === 'review'}>검토·승인 <Chevron /></button>
            <section className="krds-mega-menu">
              <div>
                <p className="krds-mega-eyebrow">REVIEW & APPROVAL</p>
                <h2>검토·승인</h2>
                <p>피해등급 검토와 최종 승인 처리 결과를 확인합니다.</p>
              </div>
              <ul>
                <li><NavLink to={ROUTES.APPROVAL_HISTORY} onClick={close}><strong>승인 처리 이력</strong><span>최종 승인·보류·반려 결과 조회</span></NavLink></li>
                <li><NavLink to={ROUTES.REVIEW_HISTORY} onClick={close}><strong>피해등급 검토 이력</strong><span>AI 분석 기반 피해등급 검토 기록</span></NavLink></li>
              </ul>
            </section>
          </div>
        )}

        {canView() && <NavLink className="krds-gnb-link" to={ROUTES.REPORT_MANAGEMENT} onClick={close}>보고서 관리</NavLink>}
      </div>
    </nav>
  );
};

export default TopNavigation;
