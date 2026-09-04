/**
 * Export principal del feature Sale Status
 */

// Redux
export { default as saleStatusReducer } from './saleStatusSlice';
export * from './saleStatusSlice';

// Componentes
export * from './components';

// Hooks
export * from './hooks';

// Servicios - exportamos selectivamente para evitar conflictos con thunks de Redux
export { getAllSaleStatuses, getSaleStatusById } from './services/saleStatusService';
