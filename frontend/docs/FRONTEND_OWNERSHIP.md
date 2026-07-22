# Frontend ownership

## Frontend 1

- `src/pages/LoginPage.jsx`
- `src/components/layout/`
- `src/layouts/MainLayout.jsx`
- `src/routes/ProtectedRoute.jsx`
- `src/stores/authStore.js`
- `src/api/axiosInstance.js`, `src/api/authApi.js`
- `/login`, `/dashboard`, `/cases`, `/cases/:caseId`

## Frontend 2

- AI analysis, review and approval pages
- Severity, subsidy, final approval, reports and history pages
- Do not modify Frontend 1 authentication, shared layout, or common route guard files without coordination.

## Shared contract

- Authentication state: `useAuthStore`
- Authorization header: Axios instance automatically attaches `Bearer <accessToken>`.
- Add Frontend 2 page routes inside `src/routes/AppRouter.jsx` only after coordinating the route path to avoid collisions.
