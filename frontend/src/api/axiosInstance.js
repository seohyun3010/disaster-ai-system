/*
 * 현재 프로젝트는 전체 Mock 모드입니다.
 * 이 파일은 백엔드 연동 시 사용할 Axios 설정을 확인할 수 있도록 보존한 템플릿이며,
 * 아래 코드는 모두 주석 처리되어 실행되지 않습니다.
 *
 * TODO(BE): 백엔드 연결 시 이 블록을 해제하고 각 API 파일의 TODO(BE)를 활성화하세요.

import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

axiosInstance.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  config.headers = config.headers || {};

  if (accessToken && !config.skipAuth) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response, config } = error;
    const status = response?.status;
    const serverMessage = response?.data?.message || response?.data?.error?.message;
    error.message = serverMessage || error.message || '요청 처리 중 오류가 발생했습니다.';

    if (status === 401 && !config?.skipAuthRedirect) {
      useAuthStore.getState().clearAuth();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        const next = `${window.location.pathname}${window.location.search}`;
        window.location.assign(`/login?next=${encodeURIComponent(next)}`);
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
*/

// Mock 모드에서는 네트워크 클라이언트를 노출하지 않습니다.
export default null;
