import axios from "axios";
import { store } from "../app/store";
import { setAccessToken, logout } from "../features/auth/authSlice";
import { refreshAPI } from "../features/auth/services/authService";
import { logger } from "../utils/logger";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Log de peticiones en desarrollo
  if (import.meta.env.DEV) {
    logger.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      url: config.url,
      method: config.method,
      hasAuth: !!token
    });
  }
  
  return config;
});

api.interceptors.response.use(
  (res) => {
    // Log de respuestas exitosas en desarrollo
    if (import.meta.env.DEV) {
      logger.debug(`API Response: ${res.status} ${res.config.url}`, {
        status: res.status,
        url: res.config.url
      });
    }
    return res;
  },
  async (error) => {
    const originalRequest = error.config;

    // Las peticiones canceladas (AbortController) no son errores reales — no las logueamos
    if (!axios.isCancel(error)) {
      logger.apiError(
        `${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`,
        error,
        {
          status: error.response?.status,
          statusText: error.response?.statusText
        }
      );
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        logger.info('Intentando renovar token de acceso');
        const { accessToken } = await refreshAPI();
        store.dispatch(setAccessToken(accessToken));
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        logger.info('Token renovado exitosamente');
        return api(originalRequest);
      } catch (refreshError) {
        logger.error('Error al renovar token, cerrando sesión', refreshError as Error);
        store.dispatch(logout());
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
