/**
 * Configuración centralizada de APIs y URLs
 */

// URL base del backend - usando variable de entorno
// Los endpoints de cada feature usan rutas relativas (e.g. '/sales') y el
// baseURL del cliente axios (src/api/axios.ts) añade este prefijo automáticamente.
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Configuración de desarrollo
export const DEV_CONFIG = {
  host: import.meta.env.VITE_DEV_HOST || 'localhost',
  port: import.meta.env.VITE_DEV_PORT || 80,
} as const;

/**
 * Valida que las variables de entorno estén configuradas
 */
export const validateConfig = () => {
  const requiredVars = [
    'VITE_API_URL',
    'VITE_1SKORE_URL',
    'VITE_1SKORE_USER',
    'VITE_1SKORE_PASSWORD',
  ];
  
  const missing = requiredVars.filter(varName => !import.meta.env[varName]);
  
  if (missing.length > 0) {
    console.warn('Variables de entorno faltantes:', missing);
    return false;
  }
  
  return true;
};

// Ejecutar validación al importar
if (import.meta.env.DEV) {
  validateConfig();
}