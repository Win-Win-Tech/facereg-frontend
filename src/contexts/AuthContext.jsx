import React, { createContext, useContext, useMemo, useState } from 'react';
import { clearAuthData, getAuthData, setAuthData } from '../utils/session';
import { logout as logoutApi } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => getAuthData());

  const login = (data) => {
    setAuthData(data);
    setAuth(data);
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      // Ignore network failures so the local session still clears.
    } finally {
      clearAuthData();
      setAuth(null);
    }
  };

  const value = useMemo(
    () => ({
      auth,
      login,
      logout,
      isAuthenticated: Boolean(auth?.token),
      role: auth?.role,
      name: auth?.name,
      email: auth?.email,
      locationId: auth?.location_id || auth?.location || null,
      location: auth?.location,
    }),
    [auth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

