import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig';
import { getAuthData, clearAuthData } from '../utils/session';

const httpClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
  },
});

httpClient.interceptors.request.use((config) => {
  const auth = getAuthData();
  if (auth?.token && !config.headers.Authorization) {
    config.headers.Authorization = `Token ${auth.token}`;
  }
  return config;
});

let redirectingToLogin = false;

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const detailMessage =
      (typeof error.response?.data?.detail === 'string' && error.response.data.detail) ||
      (typeof error.response?.data?.error === 'string' && error.response.data.error) ||
      '';
    const messageLower = detailMessage.toLowerCase();
    const tokenKeyword =
      messageLower.includes('invalid or expired token') ||
      messageLower.includes('invalid token') ||
      messageLower.includes('expired token');

    const tokenInvalid = status === 401 || (status === 403 && tokenKeyword) || tokenKeyword;

    if (tokenInvalid && !redirectingToLogin) {
      redirectingToLogin = true;
      clearAuthData();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      } else {
        redirectingToLogin = false;
      }
    }
    return Promise.reject(error);
  }
);

export default httpClient;

