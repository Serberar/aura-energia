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
import { useSaleStatusChange } from './useSaleStatusChange';
import * as saleServiceMod from '../services/saleService';

const mockChangeSaleStatus = saleServiceMod.changeSaleStatus as ReturnType<typeof vi.fn>;

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

describe('useSaleStatusChange', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns loading=false and error=null initially', () => {
    const store = makeStore();
    const { result } = renderHook(() => useSaleStatusChange('sale-1'), { wrapper: makeWrapper(store) });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  // ─── changeStatus ───────────────────────────────────────────────────────────

  describe('changeStatus', () => {
    it('returns updated sale on success', async () => {
      const updatedSale = { ...mockSale, statusId: 'status-2' };
      mockChangeSaleStatus.mockResolvedValue(updatedSale);
      const store = makeStore();
      const { result } = renderHook(() => useSaleStatusChange('sale-1'), { wrapper: makeWrapper(store) });

      let returned: any;
      await act(async () => {
        returned = await result.current.changeStatus('status-2');
      });

      expect(returned).toEqual(updatedSale);
    });

    it('calls service with correct saleId and statusId', async () => {
      const updatedSale = { ...mockSale, statusId: 'status-2' };
      mockChangeSaleStatus.mockResolvedValue(updatedSale);
      const store = makeStore();
      const { result } = renderHook(() => useSaleStatusChange('sale-1'), { wrapper: makeWrapper(store) });

      await act(async () => {
        await result.current.changeStatus('status-2');
      });

      expect(mockChangeSaleStatus).toHaveBeenCalledWith('sale-1', { statusId: 'status-2' });
    });

    it('updates selectedSale in store after success', async () => {
      const updatedSale = { ...mockSale, statusId: 'status-2' };
      mockChangeSaleStatus.mockResolvedValue(updatedSale);
      const store = makeStore();
      const { result } = renderHook(() => useSaleStatusChange('sale-1'), { wrapper: makeWrapper(store) });

      await act(async () => {
        await result.current.changeStatus('status-2');
      });

      expect(store.getState().sales.selectedSale?.statusId).toBe('status-2');
    });

    it('throws when thunk is rejected', async () => {
      mockChangeSaleStatus.mockRejectedValue(new Error('Invalid transition'));
      const store = makeStore();
      const { result } = renderHook(() => useSaleStatusChange('sale-1'), { wrapper: makeWrapper(store) });

      let threw = false;
      await act(async () => {
        try { await result.current.changeStatus('status-final'); } catch { threw = true; }
      });

      expect(threw).toBe(true);
    });
  });
});
