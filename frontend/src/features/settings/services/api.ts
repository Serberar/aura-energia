/**
 * Endpoints de API para configuración del sistema
 */

export const SETTINGS_ENDPOINTS = {
  BY_KEY: (key: string) => `/settings/${key}`,
} as const;
