/**
 * Endpoints de API para ventas
 */

export const SALE_ENDPOINTS = {
  BASE: '/sales',
  STATS: '/sales/stats',
  COMERCIALES: '/sales/comerciales',
  BY_ID: (id: string) => `/sales/${id}`,
  ITEMS: (saleId: string) => `/sales/${saleId}/items`,
  ITEM_BY_ID: (saleId: string, itemId: string) => `/sales/${saleId}/items/${itemId}`,
  CHANGE_STATUS: (saleId: string) => `/sales/${saleId}/status`,
  UPDATE_CLIENT: (saleId: string) => `/sales/${saleId}/client`,
  SIGNATURE: (saleId: string) => `/sales/${saleId}/signature`,
  SIGNATURE_SEND: (saleId: string) => `/sales/${saleId}/signature/send`,
  SIGNATURE_RESEND: (saleId: string) => `/sales/${saleId}/signature/resend`,
  SIGNATURE_EVIDENCE: (saleId: string) => `/sales/${saleId}/signature/evidence`,
  SIGNATURE_EVIDENCE_FETCH: (saleId: string) => `/sales/${saleId}/signature/evidence/fetch`,
} as const;
