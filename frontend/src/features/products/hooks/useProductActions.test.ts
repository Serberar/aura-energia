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
import { useProductActions } from './useProductActions';
import * as productServiceMod from '../services/productService';

const mockCreateProduct    = productServiceMod.createProduct    as ReturnType<typeof vi.fn>;
const mockUpdateProduct    = productServiceMod.updateProduct    as ReturnType<typeof vi.fn>;
const mockToggleProduct    = productServiceMod.toggleProductActive as ReturnType<typeof vi.fn>;

const mockProduct = {
  id: 'prod-1', name: 'Seguro Hogar', description: 'Desc', sku: 'SKU-1',
  price: 100, active: true, stock: 10, createdAt: '2024-01-01', updatedAt: '2024-01-01',
};

function makeStore() {
  const reducerMap: any = { products: productsReducer };
  return configureStore({
    reducer: reducerMap,
    preloadedState: {
      products: {
        products: [mockProduct], selectedProduct: mockProduct,
        loading: false, error: null, lastFetch: null,
      },
    },
  });
}

function makeWrapper(store: ReturnType<typeof makeStore>) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(Provider, { store }, children);
}

describe('useProductActions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns loading=false and error=null initially', () => {
    const store = makeStore();
    const { result } = renderHook(() => useProductActions(), { wrapper: makeWrapper(store) });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  // ─── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('returns created product on success', async () => {
      mockCreateProduct.mockResolvedValue(mockProduct);
      const store = makeStore();
      const { result } = renderHook(() => useProductActions(), { wrapper: makeWrapper(store) });

      let created: any;
      await act(async () => {
        created = await result.current.create({ name: 'Seguro Hogar', price: 100 } as any);
      });

      expect(created).toEqual(mockProduct);
    });

    it('throws when thunk is rejected', async () => {
      mockCreateProduct.mockRejectedValue(new Error('Duplicate SKU'));
      const store = makeStore();
      const { result } = renderHook(() => useProductActions(), { wrapper: makeWrapper(store) });

      let threw = false;
      await act(async () => {
        try { await result.current.create({ name: 'X' } as any); } catch { threw = true; }
      });

      expect(threw).toBe(true);
    });
  });

  // ─── update ─────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('returns updated product on success', async () => {
      const updated = { ...mockProduct, name: 'Actualizado' };
      mockUpdateProduct.mockResolvedValue(updated);
      const store = makeStore();
      const { result } = renderHook(() => useProductActions(), { wrapper: makeWrapper(store) });

      let returned: any;
      await act(async () => {
        returned = await result.current.update('prod-1', { name: 'Actualizado' });
      });

      expect(returned.name).toBe('Actualizado');
    });

    it('throws when thunk is rejected', async () => {
      mockUpdateProduct.mockRejectedValue(new Error('Not found'));
      const store = makeStore();
      const { result } = renderHook(() => useProductActions(), { wrapper: makeWrapper(store) });

      let threw = false;
      await act(async () => {
        try { await result.current.update('x', {}); } catch { threw = true; }
      });

      expect(threw).toBe(true);
    });
  });

  // ─── toggleActive ───────────────────────────────────────────────────────────

  describe('toggleActive', () => {
    it('returns toggled product on success', async () => {
      const toggled = { ...mockProduct, active: false };
      mockToggleProduct.mockResolvedValue(toggled);
      const store = makeStore();
      const { result } = renderHook(() => useProductActions(), { wrapper: makeWrapper(store) });

      let returned: any;
      await act(async () => { returned = await result.current.toggleActive('prod-1'); });

      expect(returned.active).toBe(false);
    });

    it('throws when thunk is rejected', async () => {
      mockToggleProduct.mockRejectedValue(new Error('Not found'));
      const store = makeStore();
      const { result } = renderHook(() => useProductActions(), { wrapper: makeWrapper(store) });

      let threw = false;
      await act(async () => {
        try { await result.current.toggleActive('x'); } catch { threw = true; }
      });

      expect(threw).toBe(true);
    });
  });

  // ─── clearError ─────────────────────────────────────────────────────────────

  it('clearError resets error to null in store', () => {
    const reducerMap: any = { products: productsReducer };
    const store = configureStore({
      reducer: reducerMap,
      preloadedState: {
        products: {
          products: [], selectedProduct: null,
          loading: false, error: 'Some error', lastFetch: null,
        },
      },
    });
    const { result } = renderHook(() => useProductActions(), { wrapper: makeWrapper(store) });

    act(() => { result.current.clearError(); });

    expect(store.getState().products.error).toBeNull();
  });
});
