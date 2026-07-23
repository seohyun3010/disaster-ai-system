# 공통 API · 인증 관리

## 제공 기능

- `axiosInstance`는 `VITE_API_BASE_URL`을 기준으로 모든 백엔드 API를 호출합니다.
- 로그인 후 저장된 Access Token을 모든 보호 API 요청에 `Authorization: Bearer <token>`으로 자동 추가합니다.
- 보호 API에서 401 응답이 오면 토큰과 사용자 정보를 삭제하고, 원래 요청하려던 주소를 `next` 값으로 보존해 로그인 화면으로 이동합니다.
- 로그인·로그아웃 API에는 401 자동 이동을 적용하지 않습니다. 따라서 로그인 실패 메시지를 화면에서 그대로 표시할 수 있습니다.

## 사용 방법

```js
import axiosInstance from '../api/axiosInstance';

const response = await axiosInstance.get('/api/cases');
```

새 API 모듈도 기존처럼 `axiosInstance`만 import하면 토큰 처리와 401 처리가 자동 적용됩니다.

## 인증 상태

`useAuthStore`는 다음을 관리합니다.

- `accessToken`: 브라우저 새로고침 후에도 유지됩니다.
- `user`: 로그인 사용자 정보와 `role`입니다.
- `isAuthenticated`: 보호 라우트 접근 여부입니다.
- `setAuth`, `setUser`, `clearAuth`: 인증 상태를 변경하는 공통 함수입니다.

현재 화면 데모 계정은 `wosks12 / wosks12`입니다. 실제 백엔드 연동 시 로그인 화면의 데모 인증 부분을 `authApi.login()` 호출로 교체하면 됩니다.
