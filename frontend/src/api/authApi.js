// 현재 로그인은 LoginPage의 DEMO_ACCOUNT와 authStore를 사용합니다.
export const login = async (credentials) => {
  return { mock: true, credentials };

  /* TODO(BE): 백엔드 연동 시 위 return을 제거하고 아래 코드를 활성화합니다.
  const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN, credentials, {
    skipAuth: true,
    skipAuthRedirect: true,
  });
  return response.data;
  */
};

export const logout = async () => {
  return { mock: true, success: true };

  /* TODO(BE): 백엔드 연동 시 위 return을 제거하고 아래 코드를 활성화합니다.
  const response = await axiosInstance.post(
    API_PATHS.AUTH.LOGOUT,
    null,
    { skipAuthRedirect: true },
  );
  return response.data;
  */
};

export const getMe = async () => {
  return { id: 'wosks12', name: '공무원', role: 'OFFICER', mock: true };

  /* TODO(BE): 백엔드 연동 시 위 return을 제거하고 아래 코드를 활성화합니다.
  const response = await axiosInstance.get(API_PATHS.AUTH.ME);
  return response.data;
  */
};

export const getMyPermissions = async () => {
  return { role: 'OFFICER', permissions: ['*'], mock: true };

  /* TODO(BE): 백엔드 연동 시 위 return을 제거하고 아래 코드를 활성화합니다.
  const response = await axiosInstance.get(API_PATHS.AUTH.PERMISSIONS);
  return response.data;
  */
};

export const getLoginPayload = (data) => {
  const payload = data?.data ?? data?.result ?? data;
  const accessToken = payload?.accessToken ?? payload?.token ?? payload?.access_token;

  if (!accessToken) {
    throw new Error('로그인 응답에 Access Token이 없습니다. API 응답 형식을 확인해 주세요.');
  }

  return {
    accessToken,
    user: payload?.user ?? {
      id: payload?.userId ?? payload?.id,
      name: payload?.userName ?? payload?.name ?? payload?.username,
      role: payload?.role ?? payload?.userRole ?? 'OFFICER',
    },
  };
};

/*
TODO(BE): 백엔드 연동 시 파일 상단에 추가합니다.
import axiosInstance from './axiosInstance';
import { API_PATHS } from '../constants/apiPaths';
*/
