import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const axiosInstance = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:8080',

  timeout: 15000,

  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 요청 인터셉터
 *
 * skipAuth가 true인 요청을 제외하고
 * 저장된 Access Token을 Authorization 헤더에 추가합니다.
 */
axiosInstance.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();

    config.headers = config.headers || {};

    if (accessToken && !config.skipAuth) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * 응답 인터셉터
 *
 * 서버 오류 메시지를 정리하고,
 * 인증이 필요한 요청에서 401이 발생하면 로그인 페이지로 이동합니다.
 *
 * Refresh Token 자동 갱신은 아직 적용하지 않습니다.
 */
axiosInstance.interceptors.response.use(
  (response) => response,

  (error) => {
    const { response, config } = error;

    const status = response?.status;

    const serverMessage =
      response?.data?.message ??
      response?.data?.detail ??
      response?.data?.error?.message;

    error.message =
      serverMessage ??
      error.message ??
      '요청 처리 중 오류가 발생했습니다.';

    if (status === 401 && !config?.skipAuthRedirect) {
      useAuthStore.getState().clearAuth();

      if (
        typeof window !== 'undefined' &&
        window.location.pathname !== '/login'
      ) {
        const next =
          `${window.location.pathname}${window.location.search}`;

        window.location.assign(
          `/login?next=${encodeURIComponent(next)}`,
        );
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;