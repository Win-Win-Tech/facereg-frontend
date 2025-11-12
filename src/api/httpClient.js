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

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthData();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default httpClient;

