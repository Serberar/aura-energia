/**
 * Endpoints de API para clientes
 */

export const CLIENT_ENDPOINTS = {
  BASE: '/clients',
  BY_VALUE: (value: string) => `/clients/${value}`,
  PUSH: (id: string) => `/clients/${id}/push`,
} as const;
