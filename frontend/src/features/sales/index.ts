/**
 * Export principal del feature Sales
 */

// Redux
export { default as salesReducer } from './salesSlice';
export * from './salesSlice';

// Componentes
export * from './components';

// Hooks
export * from './hooks';

// Servicios - exportamos selectivamente para evitar conflictos con thunks de Redux
export { getSalesStats } from './services/saleService';

// Utilidades
export * from './utils/saleCalculations';
