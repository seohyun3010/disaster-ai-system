import axiosInstance from './axiosInstance';
import { API_PATHS } from '../constants/apiPaths';

/**
 * 인증 API Mock 사용 여부
 *
 * true  : Mock 데이터 사용
 * false : 실제 백엔드 API 연결
 */
const USE_AUTH_MOCK = false;

/**
 * Mock 계정 및 응답 데이터
 */
const MOCK_USER = {
  id: 'wosks12',
  name: '공무원',
  role: 'OFFICER',
};

const MOCK_LOGIN_RESPONSE = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  token_type: 'bearer',
  user_id: MOCK_USER.id,
  name: MOCK_USER.name,
  role: MOCK_USER.role,
  mock: true,
};

/**
 * 로그인
 *
 * Mock 모드:
 * Mock 로그인 응답을 반환합니다.
 *
 * 실제 연동 모드:
 * POST /api/auth/login을 호출합니다.
 */
export const login = async (credentials) => {
  if (USE_AUTH_MOCK) {
    return {
      ...MOCK_LOGIN_RESPONSE,
      credentials,
    };
  }

  const response = await axiosInstance.post(
    API_PATHS.AUTH.LOGIN,
    {
      username: credentials.username,
      password: credentials.password,
    },
    {
      skipAuth: true,
      skipAuthRedirect: true,
    },
  );

  return response.data;
};

/**
 * 로그아웃
 *
 * 실제 백엔드는 body에 refresh_token을 전달합니다.
 */
export const logout = async (refreshToken) => {
  if (USE_AUTH_MOCK) {
    return {
      success: true,
      mock: true,
    };
  }

  if (!refreshToken) {
    return {
      success: true,
      skipped: true,
      message: 'Refresh Token이 없어 서버 로그아웃 요청을 생략했습니다.',
    };
  }

  const response = await axiosInstance.post(
    API_PATHS.AUTH.LOGOUT,
    {
      refresh_token: refreshToken,
    },
    {
      skipAuthRedirect: true,
    },
  );

  return response.data;
};

/**
 * 현재 로그인 사용자 조회
 *
 * 백엔드에 /api/auth/me가 구현되기 전까지는
 * 실제 연동 모드에서도 Mock 사용자 정보를 반환합니다.
 */
export const getMe = async () => {
  if (USE_AUTH_MOCK) {
    return {
      ...MOCK_USER,
      mock: true,
    };
  }

  /*
   * TODO(BE):
   * /api/auth/me 구현 완료 후 아래 Mock return을 삭제하고
   * API 호출 코드를 활성화합니다.
   */
  return {
    ...MOCK_USER,
    mock: true,
  };

  /*
  const response = await axiosInstance.get(API_PATHS.AUTH.ME);

  const payload =
    response.data?.data ??
    response.data?.result ??
    response.data;

  const responseUser = payload?.user ?? payload;

  return {
    id:
      responseUser?.user_id ??
      responseUser?.userId ??
      responseUser?.id,
    name:
      responseUser?.name ??
      responseUser?.userName ??
      responseUser?.username,
    role:
      responseUser?.role ??
      responseUser?.userRole ??
      'OFFICER',
  };
  */
};

/**
 * 현재 사용자의 권한 조회
 *
 * 현재 프론트에서 실사용하지 않고,
 * 백엔드 API도 구현되지 않아 Mock을 유지합니다.
 */
export const getMyPermissions = async () => {
  if (USE_AUTH_MOCK) {
    return {
      role: MOCK_USER.role,
      permissions: ['*'],
      mock: true,
    };
  }

  /*
   * TODO(BE):
   * /api/auth/permissions 구현 및 사용 시 활성화합니다.
   */
  return {
    role: MOCK_USER.role,
    permissions: ['*'],
    mock: true,
  };

  /*
  const response = await axiosInstance.get(
    API_PATHS.AUTH.PERMISSIONS,
  );

  return response.data;
  */
};

/**
 * 로그인 API 응답을 프론트 인증 구조로 변환합니다.
 *
 * 백엔드 응답:
 * {
 *   access_token,
 *   refresh_token,
 *   token_type,
 *   user_id,
 *   name,
 *   role,
 * }
 *
 * 변환 결과:
 * {
 *   accessToken,
 *   refreshToken,
 *   tokenType,
 *   user: {
 *     id,
 *     name,
 *     role,
 *   },
 * }
 */
export const getLoginPayload = (data) => {
  const payload =
    data?.data ??
    data?.result ??
    data;

  const accessToken =
    payload?.accessToken ??
    payload?.access_token ??
    payload?.token;

  const refreshToken =
    payload?.refreshToken ??
    payload?.refresh_token ??
    null;

  const tokenType =
    payload?.tokenType ??
    payload?.token_type ??
    'bearer';

  if (!accessToken) {
    throw new Error(
      '로그인 응답에 Access Token이 없습니다. API 응답 형식을 확인해 주세요.',
    );
  }

  const responseUser = payload?.user;

  const user = responseUser
    ? {
        id:
          responseUser?.user_id ??
          responseUser?.userId ??
          responseUser?.id,
        name:
          responseUser?.name ??
          responseUser?.userName ??
          responseUser?.username,
        role:
          responseUser?.role ??
          responseUser?.userRole ??
          'OFFICER',
      }
    : {
        id:
          payload?.user_id ??
          payload?.userId ??
          payload?.id,
        name:
          payload?.name ??
          payload?.userName ??
          payload?.username,
        role:
          payload?.role ??
          payload?.userRole ??
          'OFFICER',
      };

  return {
    accessToken,
    refreshToken,
    tokenType,
    user,
  };
};