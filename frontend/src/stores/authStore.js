import { create } from 'zustand';

const ACCESS_TOKEN_KEY = 'accessToken';

const getStoredAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: getStoredAccessToken(),
  isAuthenticated: Boolean(getStoredAccessToken()),
  setAuth: ({ user, accessToken }) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    set({ user, accessToken, isAuthenticated: true });
  },
  clearAuth: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    set({ user: null, accessToken: null, isAuthenticated: false });
  },
}));
