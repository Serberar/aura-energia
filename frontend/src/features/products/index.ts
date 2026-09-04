/**
 * Export principal de la feature de productos
 */

// Slice y acciones
export {
  default as productsReducer,
  selectProduct,
  clearError,
  clearSelectedProduct,
  resetProductsState,
  fetchProducts,
  fetchProductById,
  createProduct,
  updateProduct,
  toggleProductActive,
} from './productsSlice';

// Hooks
export * from './hooks';

// Componentes
export * from './components';

// Servicios (por si se necesitan directamente)
export * as productService from './services/productService';

// Endpoints (para referencia)
export { PRODUCT_ENDPOINTS } from './services/api';
