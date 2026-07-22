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
    error.message = serverMessage || (status === 401 ? '로그인 정보가 만료되었거나 유효하지 않습니다.' : error.message || '요청 처리 중 오류가 발생했습니다.');

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
