/**
 * Endpoints de la API de usuarios
 * Nota: No incluir /api ya que el baseURL de axios ya lo incluye
 */
export const USER_ENDPOINTS = {
  BASE: '/users',
  REGISTER: '/users/register',
  BY_ID: (id: string) => `/users/${id}`,
} as const;