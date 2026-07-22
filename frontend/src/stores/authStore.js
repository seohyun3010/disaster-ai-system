import { create } from 'zustand';

export const AUTH_STORAGE_KEYS = {
  accessToken: 'disasterRecovery.accessToken',
  user: 'disasterRecovery.user',
};

const storage = typeof window === 'undefined' ? null : window.localStorage;

const getStoredAccessToken = () => storage?.getItem(AUTH_STORAGE_KEYS.accessToken) || null;
const getStoredUser = () => {
  try {
    return JSON.parse(storage?.getItem(AUTH_STORAGE_KEYS.user) || 'null');
  } catch {
    return null;
  }
};

const initialToken = getStoredAccessToken();

export const useAuthStore = create((set) => ({
  user: getStoredUser(),
  accessToken: initialToken,
  isAuthenticated: Boolean(initialToken),
  setAuth: ({ user, accessToken }) => {
    if (!accessToken) throw new Error('Access Token이 없어 인증 상태를 저장할 수 없습니다.');
    storage?.setItem(AUTH_STORAGE_KEYS.accessToken, accessToken);
    storage?.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(user || null));
    set({ user: user || null, accessToken, isAuthenticated: true });
  },
  setUser: (user) => {
    storage?.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(user || null));
    set({ user: user || null });
  },
  clearAuth: () => {
    storage?.removeItem(AUTH_STORAGE_KEYS.accessToken);
    storage?.removeItem(AUTH_STORAGE_KEYS.user);
    set({ user: null, accessToken: null, isAuthenticated: false });
  },
}));
