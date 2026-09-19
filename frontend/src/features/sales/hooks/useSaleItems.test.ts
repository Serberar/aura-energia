import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';

vi.mock('@/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), error: vi.fn(), apiError: vi.fn(), userAction: vi.fn() },
}));

vi.mock('../services/saleService', () => ({
  getAllSales: vi.fn(),
  getSaleById: vi.fn(),
  createSale: vi.fn(),
  addSaleItem: vi.fn(),
  updateSaleItem: vi.fn(),
  removeSaleItem: vi.fn(),
  changeSaleStatus: vi.fn(),
  deleteSale: vi.fn(),
  getSalesStats: vi.fn(),
  getComerciales: vi.fn(),
}));

import salesReducer from '../salesSlice';
import { useSaleItems } from './useSaleItems';
import * as saleServiceMod from '../services/saleService';

const mockAddSaleItem    = saleServiceMod.addSaleItem    as ReturnType<typeof vi.fn>;
const mockUpdateSaleItem = saleServiceMod.updateSaleItem as ReturnType<typeof vi.fn>;
const mockRemoveSaleItem = saleServiceMod.removeSaleItem as ReturnType<typeof vi.fn>;

const mockStatus = {
  id: 'status-1', name: 'Inicial', order: 1, color: '#FFF',
  isFinal: false, isCancelled: false, isSystem: true,
};

const mockSale = {
  id: 'sale-1', clientId: 'client-1', statusId: 'status-1', status: mockStatus,
  totalAmount: 100, items: [], histories: [], assignments: [],
  createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z',
};

function makeStore() {
  const reducerMap: any = { sales: salesReducer };
  return configureStore({
    reducer: reducerMap,
    preloadedState: {
      sales: {
        sales: [mockSale], selectedSale: mockSale,
        filters: {}, loading: false, error: null, lastFetch: null,
      },
    },
  });
}

function makeWrapper(store: ReturnType<typeof makeStore>) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(Provider, { store, children });
}

describe('useSaleItems', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns loading=false and error=null initially', () => {
    const store = makeStore();
    const { result } = renderHook(() => useSaleItems('sale-1'), { wrapper: makeWrapper(store) });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  // ─── addItem ────────────────────────────────────────────────────────────────

  describe('addItem', () => {
    it('returns updated sale on success', async () => {
      const updatedSale = { ...mockSale, totalAmount: 200 };
      mockAddSaleItem.mockResolvedValue(updatedSale);
      const store = makeStore();
      const { result } = renderHook(() => useSaleItems('sale-1'), { wrapper: makeWrapper(store) });

      let returned: any;
      await act(async () => {
        returned = await result.current.addItem({
          name: 'Seguro', quantity: 1, price: 100, productId: 'prod-1',
        });
      });

      expect(returned).toEqual(updatedSale);
    });

    it('throws when thunk is rejected', async () => {
      mockAddSaleItem.mockRejectedValue(new Error('Product not found'));
      const store = makeStore();
      const { result } = renderHook(() => useSaleItems('sale-1'), { wrapper: makeWrapper(store) });

      let threw = false;
      await act(async () => {
        try {
          await result.current.addItem({ name: 'X', quantity: 1, price: 10, productId: 'x' });
        } catch { threw = true; }
      });

      expect(threw).toBe(true);
    });
  });

  // ─── updateItem ─────────────────────────────────────────────────────────────

  describe('updateItem', () => {
    it('returns updated sale on success', async () => {
      const updatedSale = { ...mockSale, totalAmount: 200 };
      mockUpdateSaleItem.mockResolvedValue(updatedSale);
      const store = makeStore();
      const { result } = renderHook(() => useSaleItems('sale-1'), { wrapper: makeWrapper(store) });

      let returned: any;
      await act(async () => {
        returned = await result.current.updateItem('item-1', { quantity: 2 });
      });

      expect(returned).toEqual(updatedSale);
    });

    it('throws when thunk is rejected', async () => {
      mockUpdateSaleItem.mockRejectedValue(new Error('Item not found'));
      const store = makeStore();
      const { result } = renderHook(() => useSaleItems('sale-1'), { wrapper: makeWrapper(store) });

      let threw = false;
      await act(async () => {
        try { await result.current.updateItem('item-1', {}); } catch { threw = true; }
      });

      expect(threw).toBe(true);
    });
  });

  // ─── removeItem ─────────────────────────────────────────────────────────────

  describe('removeItem', () => {
    it('returns updated sale on success', async () => {
      const updatedSale = { ...mockSale, items: [] };
      mockRemoveSaleItem.mockResolvedValue(updatedSale);
      const store = makeStore();
      const { result } = renderHook(() => useSaleItems('sale-1'), { wrapper: makeWrapper(store) });

      let returned: any;
      await act(async () => {
        returned = await result.current.removeItem('item-1');
      });

      expect(returned).toEqual(updatedSale);
    });

    it('throws when thunk is rejected', async () => {
      mockRemoveSaleItem.mockRejectedValue(new Error('Item not found'));
      const store = makeStore();
      const { result } = renderHook(() => useSaleItems('sale-1'), { wrapper: makeWrapper(store) });

      let threw = false;
      await act(async () => {
        try { await result.current.removeItem('item-1'); } catch { threw = true; }
      });

      expect(threw).toBe(true);
    });
  });
});
