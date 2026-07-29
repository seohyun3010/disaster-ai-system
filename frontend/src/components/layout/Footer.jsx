const Footer = () => (
  <footer className="krds-service-footer">
    <div className="krds-footer-main">
      <div className="krds-footer-inner">
        <div className="krds-footer-brand">
          <span className="krds-footer-mark" aria-hidden="true"><i /></span>
          <span><strong>재해복구 AI</strong><small>재해 신고·복구 업무관리시스템</small></span>
        </div>

        <div className="krds-footer-content">
          <div className="krds-footer-contact">
            <p>(30112) 세종특별자치시 도움6로 42 중앙동 · 행정안전부</p>
            <ul>
              <li><strong>정부민원안내 110</strong><span>무료, 평일 09:00~18:00</span></li>
              <li><strong>긴급 재난신고 119</strong><span>화재·구조·구급 및 긴급 재난 상황</span></li>
            </ul>
          </div>
        </div>

        <div className="krds-footer-bottom">
          <div>
            <nav className="krds-policy-links" aria-label="정책 안내">
              <span className="point">개인정보처리방침</span>
              <span>저작권 정책</span>
              <span>웹 접근성 안내</span>
              <span>이용약관</span>
            </nav>
            <p>© 2026 Ministry of the Interior and Safety. All rights reserved.</p>
          </div>
          <div className="krds-government-identifier">
            <span className="krds-mini-mark" aria-hidden="true"><i /></span>
            <span>이 누리집은 행정안전부 업무지원 시스템입니다.</span>
          </div>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
