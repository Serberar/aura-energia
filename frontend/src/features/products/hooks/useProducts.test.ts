import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';

vi.mock('@/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), error: vi.fn(), apiError: vi.fn(), userAction: vi.fn() },
}));

vi.mock('../services/productService', () => ({
  getAllProducts: vi.fn(),
  getProductById: vi.fn(),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  toggleProductActive: vi.fn(),
}));

import productsReducer from '../productsSlice';
import { useProducts } from './useProducts';
import * as productServiceMod from '../services/productService';

const mockGetAllProducts = productServiceMod.getAllProducts as ReturnType<typeof vi.fn>;

const mockProduct = {
  id: 'prod-1', name: 'Seguro Hogar', description: 'Seguro del hogar', sku: 'SEG-001',
  price: 100, active: true, stock: 10, createdAt: '2024-01-01', updatedAt: '2024-01-01',
};

const mockInactiveProduct = { ...mockProduct, id: 'prod-2', name: 'Viejo', description: 'Producto obsoleto', active: false };

function makeStore(preloaded: Record<string, any> = {}) {
  const reducerMap: any = { products: productsReducer };
  return configureStore({
    reducer: reducerMap,
    preloadedState: {
      products: {
        products: [],
        selectedProduct: null,
        loading: false,
        error: null,
        lastFetch: null,
        ...preloaded,
      },
    },
  });
}

function makeWrapper(store: ReturnType<typeof makeStore>) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(Provider, { store }, children);
}

describe('useProducts', () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── auto-fetch ────────────────────────────────────────────────────────────

  it('auto-fetches products on mount when no lastFetch', async () => {
    mockGetAllProducts.mockResolvedValue([mockProduct]);
    const store = makeStore();
    await act(async () => {
      renderHook(() => useProducts(), { wrapper: makeWrapper(store) });
    });

    expect(mockGetAllProducts).toHaveBeenCalledTimes(1);
  });

  it('skips auto-fetch when lastFetch exists', async () => {
    const store = makeStore({ lastFetch: Date.now() });
    await act(async () => {
      renderHook(() => useProducts(), { wrapper: makeWrapper(store) });
    });

    expect(mockGetAllProducts).not.toHaveBeenCalled();
  });

  it('skips auto-fetch when autoFetch=false', async () => {
    const store = makeStore();
    await act(async () => {
      renderHook(() => useProducts({ autoFetch: false }), { wrapper: makeWrapper(store) });
    });

    expect(mockGetAllProducts).not.toHaveBeenCalled();
  });

  // ─── filtering ────────────────────────────────────────────────────────────

  it('returns all products when no filters', () => {
    const store = makeStore({ products: [mockProduct, mockInactiveProduct], lastFetch: Date.now() });
    const { result } = renderHook(
      () => useProducts({ autoFetch: false }),
      { wrapper: makeWrapper(store) }
    );

    expect(result.current.products).toHaveLength(2);
    expect(result.current.allProducts).toHaveLength(2);
  });

  it('filters to active products when filterActive=true', () => {
    const store = makeStore({ products: [mockProduct, mockInactiveProduct], lastFetch: Date.now() });
    const { result } = renderHook(
      () => useProducts({ autoFetch: false, filterActive: true }),
      { wrapper: makeWrapper(store) }
    );

    expect(result.current.products).toHaveLength(1);
    expect(result.current.products[0].id).toBe('prod-1');
  });

  it('filters to inactive products when filterActive=false', () => {
    const store = makeStore({ products: [mockProduct, mockInactiveProduct], lastFetch: Date.now() });
    const { result } = renderHook(
      () => useProducts({ autoFetch: false, filterActive: false }),
      { wrapper: makeWrapper(store) }
    );

    expect(result.current.products).toHaveLength(1);
    expect(result.current.products[0].id).toBe('prod-2');
  });

  it('filters by searchTerm matching name', () => {
    const store = makeStore({ products: [mockProduct, mockInactiveProduct], lastFetch: Date.now() });
    const { result } = renderHook(
      () => useProducts({ autoFetch: false, searchTerm: 'hogar' }),
      { wrapper: makeWrapper(store) }
    );

    expect(result.current.products).toHaveLength(1);
    expect(result.current.products[0].id).toBe('prod-1');
  });

  it('filters by searchTerm matching sku', () => {
    const store = makeStore({ products: [mockProduct], lastFetch: Date.now() });
    const { result } = renderHook(
      () => useProducts({ autoFetch: false, searchTerm: 'SEG-001' }),
      { wrapper: makeWrapper(store) }
    );

    expect(result.current.products).toHaveLength(1);
  });

  // ─── stats ────────────────────────────────────────────────────────────────

  it('returns correct stats', () => {
    const store = makeStore({ products: [mockProduct, mockInactiveProduct], lastFetch: Date.now() });
    const { result } = renderHook(
      () => useProducts({ autoFetch: false }),
      { wrapper: makeWrapper(store) }
    );

    expect(result.current.stats.total).toBe(2);
    expect(result.current.stats.active).toBe(1);
    expect(result.current.stats.inactive).toBe(1);
  });

  // ─── refresh ──────────────────────────────────────────────────────────────

  it('refresh dispatches fetchProducts', async () => {
    mockGetAllProducts.mockResolvedValue([]);
    const store = makeStore({ lastFetch: Date.now() });
    const { result } = renderHook(
      () => useProducts({ autoFetch: false }),
      { wrapper: makeWrapper(store) }
    );

    await act(async () => { result.current.refresh(); });

    expect(mockGetAllProducts).toHaveBeenCalledTimes(1);
  });
});
