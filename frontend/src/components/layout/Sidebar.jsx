import { NavLink, useLocation } from 'react-router-dom';

const navigation = [
  ['피해신고 현황', '/dashboard'],
  ['AI 피해조사 검토', '/cases/NDMS-0048'],
  ['피해 심각도 산정', '/statistics'],
  ['지원금/중복 검증', '/map'],
  ['심사 보고서', '/reports/NDMS-0048'],
];

const Sidebar = () => {
  const { pathname } = useLocation();
  const stage = pathname === '/dashboard' ? 0 : pathname.startsWith('/cases') ? 1 : pathname === '/statistics' ? 2 : pathname === '/map' ? 3 : 4;

  return (
    <aside className="sidebar">
      <div>
        <div className="brand">재난복구 AI</div>
        <div className="brand-sub">피해현황 복구사업 관리</div>
      </div>
      <nav aria-label="주요 메뉴">
        {navigation.map(([label, to], index) => (
          <NavLink key={to} to={to} className={index === stage ? 'active' : ''}>
            <span className="nav-dot" />{label}
          </NavLink>
        ))}
      </nav>
      <div className="side-task">
        <span>업무 단계</span>
        <div className="side-task-card">
          <strong>{['현황 파악', '비교·검토', '긴급도 확인', '지원금 검증', '보고서 작성'][stage]}</strong>
          <small>NDMS-2026-0716-0048</small>
          <small>충북 청주시 / 주택 침수</small>
          <em>{stage === 1 ? '분석 완료' : '검토 진행'}</em>
        </div>
      </div>
      <footer>행정안전부 복구지원 실무</footer>
    </aside>
  );
};

export default Sidebar;
