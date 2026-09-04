/**
 * API endpoints para productos
 */

export const PRODUCT_ENDPOINTS = {
  BASE: '/products',
  BY_ID: (id: string) => `/products/${id}`,
  TOGGLE: (id: string) => `/products/${id}/toggle`,
  DUPLICATE: (id: string) => `/products/${id}/duplicate`,
} as const;
