import { useState } from 'react';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { ROUTES } from '../routes/routeConfig';

/*
TODO(BE): 로그인 API 연동 시 아래 import를 활성화합니다.
import { getLoginPayload, login } from '../api/authApi';
*/

const DEMO_ACCOUNT = { username: 'wosks12', password: 'wosks12' };

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  if (isAuthenticated) return <Navigate to={ROUTES.DASHBOARD} replace />;

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    /*
    TODO(BE): 백엔드 로그인 API가 준비되면 아래 코드로 Mock 검증 부분을 교체합니다.
    handleSubmit 함수에 async를 추가해야 합니다.

    try {
      const response = await login(form);
      const { accessToken, user } = getLoginPayload(response);
      setAuth({ accessToken, user });

      const nextPath = searchParams.get('next');
      const destination =
        location.state?.from?.pathname ||
        (nextPath?.startsWith('/') ? nextPath : ROUTES.DASHBOARD);
      navigate(destination, { replace: true });
    } catch (loginError) {
      setError(loginError.message || '로그인에 실패했습니다.');
    }
    */

    // Mock 로그인: 백엔드 연동 시 이 검증부터 아래 navigate까지 제거합니다.
    if (form.username !== DEMO_ACCOUNT.username || form.password !== DEMO_ACCOUNT.password) {
      setError('아이디 또는 비밀번호가 올바르지 않습니다.');
      return;
    }

    setAuth({
      accessToken: 'demo-wosks12-access-token',
      user: { id: 'wosks12', name: '공무원', role: 'OFFICER' },
    });
    const nextPath = searchParams.get('next');
    const destination = location.state?.from?.pathname || (nextPath?.startsWith('/') ? nextPath : ROUTES.DASHBOARD);
    navigate(destination, { replace: true });
  };

  return <main className="login-page">
    <section className="login-intro">
      <p className="login-kicker">DISASTER RECOVERY AI</p>
      <h1>재해복구업무관리시스템</h1>
      <p>신고 접수부터 AI 분석, 검토·승인과 보고서 발행까지<br />하나의 흐름으로 관리합니다.</p>
    </section>
    <section className="login-panel" aria-labelledby="login-title"><div className="login-card">
      <p className="login-kicker">SIGN IN</p><h2 id="login-title">로그인</h2><p>등록된 업무 계정으로 로그인해 주세요.</p>
      <form onSubmit={handleSubmit}>
        <label htmlFor="username">아이디</label>
        <input id="username" name="username" type="text" autoComplete="username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} placeholder="아이디 입력" />
        <label htmlFor="password">비밀번호</label>
        <input id="password" name="password" type="password" autoComplete="current-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="비밀번호 입력" />
        {error && <p className="login-error" role="alert">{error}</p>}
        <button className="login-submit" type="submit">로그인</button>
      </form>
    </div></section>
  </main>;
};

export default LoginPage;
