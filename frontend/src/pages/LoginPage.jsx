import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import Footer from '../components/layout/Footer';
import {
  getLoginPayload,
  login as loginApi,
} from '../api/authApi';
import { useAuthStore } from '../stores/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const setAuth = useAuthStore((state) => state.setAuth);

  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setCredentials((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const response = await loginApi(credentials);
      const authData = getLoginPayload(response);

      setAuth(authData);

      const destination =
        location.state?.from?.pathname ?? '/dashboard';

      navigate(destination, {
        replace: true,
      });
    } catch (loginError) {
      console.error('로그인 실패:', loginError);

      const errorMessage =
        loginError?.response?.data?.detail ??
        loginError?.response?.data?.message ??
        loginError?.message ??
        '로그인에 실패했습니다.';

      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page login-page-centered">
      <main className="login-main">
        <section
          className="login-panel"
          aria-labelledby="login-title"
        >
          <div className="login-card">
            <div
              className="login-brand"
              aria-label="NDRMS 복구 업무관리시스템"
            >
              <span
                className="krds-footer-mark"
                aria-hidden="true"
              >
                <i />
              </span>

              <span className="login-brand-copy">
                <strong>NDRMS</strong>
                <small>복구 업무관리시스템</small>
              </span>
            </div>

            <div className="login-heading">
              <p className="login-kicker">공무원 업무 포털</p>
              <h1 id="login-title">로그인</h1>
              <p>등록된 업무 계정으로 로그인해 주세요.</p>
            </div>

            <form
              className="login-form"
              onSubmit={handleSubmit}
            >
              <label htmlFor="username">아이디</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={credentials.username}
                onChange={handleChange}
                placeholder="아이디 입력"
                disabled={isSubmitting}
                required
              />

              <label htmlFor="password">비밀번호</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={credentials.password}
                onChange={handleChange}
                placeholder="비밀번호 입력"
                disabled={isSubmitting}
                required
              />

              {error ? (
                <p
                  className="login-error"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}

              <button
                className="login-submit"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? '로그인 중...' : '로그인'}
              </button>
            </form>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}