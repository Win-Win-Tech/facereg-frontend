import httpClient from './httpClient';

export const login = (email, password) =>
  httpClient.post('/auth/login/', { email, password });

export const logout = () => httpClient.post('/auth/logout/');

