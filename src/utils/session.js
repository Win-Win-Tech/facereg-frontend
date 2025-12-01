import { AUTH_STORAGE_KEY } from '../config/apiConfig';

const LEGACY_AUTH_KEYS = ['facereg_auth'];

export const getAuthData = () => {
  try {
    let raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      for (const legacyKey of LEGACY_AUTH_KEYS) {
        raw = sessionStorage.getItem(legacyKey);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            setAuthData(parsed);
            sessionStorage.removeItem(legacyKey);
            return parsed;
          } catch {
            sessionStorage.removeItem(legacyKey);
            raw = null;
          }
        }
      }
    }
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
};

export const setAuthData = (auth) => {
  if (!auth) {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    LEGACY_AUTH_KEYS.forEach((key) => sessionStorage.removeItem(key));
    return;
  }
  sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  LEGACY_AUTH_KEYS.forEach((key) => sessionStorage.removeItem(key));
};

export const clearAuthData = () => {
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
  LEGACY_AUTH_KEYS.forEach((key) => sessionStorage.removeItem(key));
};

export const isAuthenticated = () => {
  const auth = getAuthData();
  return Boolean(auth?.token);
};

