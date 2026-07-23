import { useState } from 'react';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { ROUTES } from '../routes/routeConfig';

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
