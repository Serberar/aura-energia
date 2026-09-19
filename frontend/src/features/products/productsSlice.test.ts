import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

vi.mock('./services/productService', () => ({
  getAllProducts: vi.fn(),
  getProductById: vi.fn(),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  toggleProductActive: vi.fn(),
}));

vi.mock('../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    userAction: vi.fn(),
  },
}));

import productsReducer, {
  clearError,
  selectProduct,
  clearSelectedProduct,
  resetProductsState,
  fetchProducts,
  fetchProductById,
  createProduct,
  toggleProductActive,
} from './productsSlice';
import * as productService from './services/productService';
import type { Product } from '../../types/sales';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeStore() {
  const reducerMap: any = { products: productsReducer };
  return configureStore({ reducer: reducerMap });
}

const mockProduct1: Product = {
  id: 'prod-1',
  name: 'Seguro de Vida',
  description: 'Plan básico',
  sku: 'SEG-VIDA-01',
  price: 29.99,
  active: true,
  createdAt: '2024-01-01T00:00:00.000Z',
};

const mockProduct2: Product = {
  id: 'prod-2',
  name: 'Seguro de Hogar',
  description: 'Cobertura total',
  sku: 'SEG-HOG-01',
  price: 49.99,
  active: false,
  createdAt: '2024-01-02T00:00:00.000Z',
};

// ─── synchronous reducers ─────────────────────────────────────────────────────

describe('productsSlice – synchronous reducers', () => {
  it('initial state is correct', () => {
    const state = productsReducer(undefined, { type: '@@INIT' });
    expect(state.products).toEqual([]);
    expect(state.selectedProduct).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.lastFetch).toBeNull();
  });

  it('clearError sets error to null', () => {
    const stateWithError = productsReducer(
      { products: [], selectedProduct: null, loading: false, error: 'some error', lastFetch: null },
      clearError()
    );
    expect(stateWithError.error).toBeNull();
  });

  it('selectProduct sets selectedProduct', () => {
    const state = productsReducer(
      { products: [mockProduct1], selectedProduct: null, loading: false, error: null, lastFetch: null },
      selectProduct(mockProduct1)
    );
    expect(state.selectedProduct).toEqual(mockProduct1);
  });

  it('selectProduct with null clears selectedProduct', () => {
    const state = productsReducer(
      { products: [], selectedProduct: mockProduct1, loading: false, error: null, lastFetch: null },
      selectProduct(null)
    );
    expect(state.selectedProduct).toBeNull();
  });

  it('clearSelectedProduct sets selectedProduct to null', () => {
    const state = productsReducer(
      { products: [], selectedProduct: mockProduct1, loading: false, error: null, lastFetch: null },
      clearSelectedProduct()
    );
    expect(state.selectedProduct).toBeNull();
  });

  it('resetProductsState returns initial state', () => {
    const dirtyState = {
      products: [mockProduct1],
      selectedProduct: mockProduct1,
      loading: true,
      error: 'error',
      lastFetch: 12345,
    };
    const reset = productsReducer(dirtyState, resetProductsState());
    expect(reset).toEqual({
      products: [],
      selectedProduct: null,
      loading: false,
      error: null,
      lastFetch: null,
    });
  });
});

// ─── fetchProducts thunk ──────────────────────────────────────────────────────

describe('fetchProducts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sets loading=true while pending', () => {
    const store = makeStore();
    vi.mocked(productService.getAllProducts).mockReturnValue(new Promise(() => {}));
    store.dispatch(fetchProducts());
    expect(store.getState().products.loading).toBe(true);
    expect(store.getState().products.error).toBeNull();
  });

  it('sets products and lastFetch on fulfilled', async () => {
    const store = makeStore();
    vi.mocked(productService.getAllProducts).mockResolvedValue([mockProduct1, mockProduct2]);

    await store.dispatch(fetchProducts());

    const { products } = store.getState();
    expect(products.loading).toBe(false);
    expect(products.products).toEqual([mockProduct1, mockProduct2]);
    expect(products.lastFetch).not.toBeNull();
  });

  it('sets error on rejected with server message', async () => {
    const store = makeStore();
    vi.mocked(productService.getAllProducts).mockRejectedValue({
      response: { data: { message: 'Server error' } },
    });

    await store.dispatch(fetchProducts());

    expect(store.getState().products.error).toBe('Server error');
  });

  it('uses default error message when no server message', async () => {
    const store = makeStore();
    vi.mocked(productService.getAllProducts).mockRejectedValue(new Error('Network error'));

    await store.dispatch(fetchProducts());

    expect(store.getState().products.error).toBe('Error al obtener productos');
  });
});

// ─── fetchProductById thunk ───────────────────────────────────────────────────

describe('fetchProductById', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sets selectedProduct on fulfilled', async () => {
    const store = makeStore();
    vi.mocked(productService.getProductById).mockResolvedValue(mockProduct1);

    await store.dispatch(fetchProductById('prod-1'));

    const { products } = store.getState();
    expect(products.loading).toBe(false);
    expect(products.selectedProduct).toEqual(mockProduct1);
  });

  it('sets error on rejected with server message', async () => {
    const store = makeStore();
    vi.mocked(productService.getProductById).mockRejectedValue({
      response: { data: { message: 'Product not found' } },
    });

    await store.dispatch(fetchProductById('non-existent'));

    expect(store.getState().products.error).toBe('Product not found');
  });

  it('uses default error message when no server message', async () => {
    const store = makeStore();
    vi.mocked(productService.getProductById).mockRejectedValue(new Error('Network'));

    await store.dispatch(fetchProductById('prod-1'));

    expect(store.getState().products.error).toBe('Error al obtener producto');
  });
});

// ─── createProduct thunk ──────────────────────────────────────────────────────

describe('createProduct', () => {
  beforeEach(() => vi.clearAllMocks());

  it('appends new product to list on fulfilled', async () => {
    const store = makeStore();
    vi.mocked(productService.getAllProducts).mockResolvedValue([mockProduct1]);
    await store.dispatch(fetchProducts());

    vi.mocked(productService.createProduct).mockResolvedValue(mockProduct2);
    await store.dispatch(createProduct({ name: 'Seguro de Hogar', price: 49.99 }));

    const { products } = store.getState().products;
    expect(products).toHaveLength(2);
    expect(products[1].id).toBe('prod-2');
  });

  it('sets error on rejected with server message', async () => {
    const store = makeStore();
    vi.mocked(productService.createProduct).mockRejectedValue({
      response: { data: { message: 'Duplicate SKU' } },
    });

    await store.dispatch(createProduct({ name: 'Test', price: 10 }));

    expect(store.getState().products.error).toBe('Duplicate SKU');
  });

  it('uses default error message when no server message', async () => {
    const store = makeStore();
    vi.mocked(productService.createProduct).mockRejectedValue(new Error('Network'));

    await store.dispatch(createProduct({ name: 'Test', price: 10 }));

    expect(store.getState().products.error).toBe('Error al crear producto');
  });
});

// ─── toggleProductActive thunk ────────────────────────────────────────────────

describe('toggleProductActive', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updates product in list on fulfilled', async () => {
    const store = makeStore();
    vi.mocked(productService.getAllProducts).mockResolvedValue([mockProduct1, mockProduct2]);
    await store.dispatch(fetchProducts());

    const toggled = { ...mockProduct1, active: false };
    vi.mocked(productService.toggleProductActive).mockResolvedValue(toggled);
    await store.dispatch(toggleProductActive('prod-1'));

    const { products } = store.getState().products;
    expect(products.find((p: Product) => p.id === 'prod-1')?.active).toBe(false);
  });

  it('updates selectedProduct when toggled product was selected', async () => {
    const store = makeStore();
    vi.mocked(productService.getAllProducts).mockResolvedValue([mockProduct1]);
    await store.dispatch(fetchProducts());
    store.dispatch(selectProduct(mockProduct1));

    const toggled = { ...mockProduct1, active: false };
    vi.mocked(productService.toggleProductActive).mockResolvedValue(toggled);
    await store.dispatch(toggleProductActive('prod-1'));

    expect(store.getState().products.selectedProduct?.active).toBe(false);
  });

  it('does not update selectedProduct when a different product is toggled', async () => {
    const store = makeStore();
    vi.mocked(productService.getAllProducts).mockResolvedValue([mockProduct1, mockProduct2]);
    await store.dispatch(fetchProducts());
    store.dispatch(selectProduct(mockProduct1));

    const toggled = { ...mockProduct2, active: true };
    vi.mocked(productService.toggleProductActive).mockResolvedValue(toggled);
    await store.dispatch(toggleProductActive('prod-2'));

    expect(store.getState().products.selectedProduct?.id).toBe('prod-1');
  });

  it('sets error on rejected with server message', async () => {
    const store = makeStore();
    vi.mocked(productService.toggleProductActive).mockRejectedValue({
      response: { data: { message: 'Cannot deactivate system product' } },
    });

    await store.dispatch(toggleProductActive('prod-1'));

    expect(store.getState().products.error).toBe('Cannot deactivate system product');
  });

  it('uses default error message when no server message', async () => {
    const store = makeStore();
    vi.mocked(productService.toggleProductActive).mockRejectedValue(new Error('Network'));

    await store.dispatch(toggleProductActive('prod-1'));

    expect(store.getState().products.error).toBe('Error al cambiar estado del producto');
  });
});
