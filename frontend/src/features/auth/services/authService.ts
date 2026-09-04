import api from "../../../api/axios";
import { AUTH_ENDPOINTS } from "./api";
import { logger } from "@/utils/logger";

export interface LoginData {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

// Login
export const loginAPI = async (data: LoginData): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>(AUTH_ENDPOINTS.LOGIN, data);

  // guardamos el refresh token manualmente (porque la cookie no se puede usar)
  if (response.data.refreshToken) {
    localStorage.setItem("refreshToken", response.data.refreshToken);
  }

  return response.data;
};

// Refresh token
export const refreshAPI = async (): Promise<{ accessToken: string }> => {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) throw new Error("No hay refresh token guardado");

  // enviamos el token en el body
  const response = await api.post<{ accessToken: string }>(AUTH_ENDPOINTS.REFRESH, {
    refreshToken,
  });

  return response.data;
};

// Logout
export const logoutUser = async () => {
  try {
    const refreshToken = localStorage.getItem("refreshToken");
    localStorage.removeItem("refreshToken");
    
    // Enviar el refreshToken en el body para invalidarlo en el servidor
    await api.post(AUTH_ENDPOINTS.LOGOUT, {
      refreshToken: refreshToken || undefined 
    });
    return true;
  } catch (err) {
    logger.error('Error cerrando sesión', err as Error);
    return false;
  }
};
