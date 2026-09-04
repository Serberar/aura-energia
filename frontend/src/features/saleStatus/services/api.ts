/**
 * Endpoints de API para estados de venta
 */

export const SALE_STATUS_ENDPOINTS = {
  BASE: '/sale-status',
  BY_ID: (id: string) => `/sale-status/${id}`,
  REORDER: '/sale-status/reorder',
} as const;
