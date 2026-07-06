import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ApiErrorResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

const getAccessToken = () => {
  const token = localStorage.getItem('access_token');
  return token && token !== 'null' && token !== 'undefined' ? token : null;
};

const setAccessToken = (accessToken: string) => {
  localStorage.setItem('access_token', accessToken);
};

const clearAuthTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

const isAuthEndpoint = (url?: string) => {
  return !!url && ['/auth/login/', '/auth/token/refresh/'].some((path) => url.includes(path));
};

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const accessToken = getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (isAuthEndpoint(originalRequest?.url)) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        clearAuthTokens();
        window.location.href = '/login';
        return new Promise(() => {});
      }

      try {
        const response = await axios.post(`${API_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        const newAccessToken = response.data.access as string;
        if (newAccessToken) {
          setAccessToken(newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        return api(originalRequest);
      } catch {
        clearAuthTokens();
        window.location.href = '/login';
        return new Promise(() => {});
      }
    }

    return Promise.reject(error);
  },
);

export { api, clearAuthTokens, setAccessToken };
export default api;
