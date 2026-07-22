import axiosInstance from './axiosInstance';
import { API_PATHS } from '../constants/apiPaths';

export const login = async (credentials) => {
  const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN, credentials, {
    skipAuth: true,
    skipAuthRedirect: true,
  });
  return response.data;
};

export const logout = async () => {
  const response = await axiosInstance.post(API_PATHS.AUTH.LOGOUT, null, { skipAuthRedirect: true });
  return response.data;
};

export const getMe = async () => {
  const response = await axiosInstance.get(API_PATHS.AUTH.ME);
  return response.data;
};

// 백엔드가 { data }, { result }, 또는 최상위 토큰을 반환하는 경우를 모두 처리합니다.
export const getLoginPayload = (data) => {
  const payload = data?.data ?? data?.result ?? data;
  const accessToken = payload?.accessToken ?? payload?.token ?? payload?.access_token;

  if (!accessToken) throw new Error('로그인 응답에 Access Token이 없습니다. API 응답 형식을 확인해 주세요.');

  return {
    accessToken,
    user: payload?.user ?? {
      id: payload?.userId ?? payload?.id,
      name: payload?.userName ?? payload?.name ?? payload?.username,
      role: payload?.role ?? payload?.userRole ?? 'OFFICER',
    },
  };
};
