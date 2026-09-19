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
import { useSales } from './useSales';
import * as saleServiceMod from '../services/saleService';

const mockGetAllSales = saleServiceMod.getAllSales as ReturnType<typeof vi.fn>;
const mockCreateSale  = saleServiceMod.createSale  as ReturnType<typeof vi.fn>;
const mockDeleteSale  = saleServiceMod.deleteSale  as ReturnType<typeof vi.fn>;

const mockStatus = {
  id: 'status-1', name: 'Inicial', order: 1, color: '#FFF',
  isFinal: false, isCancelled: false, isSystem: true,
};

const mockSale = {
  id: 'sale-1',
  clientId: 'client-1',
  statusId: 'status-1',
  status: mockStatus,
  totalAmount: 100,
  items: [],
  histories: [],
  assignments: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

function makeStore(preloaded: Record<string, any> = {}) {
  const reducerMap: any = { sales: salesReducer };
  return configureStore({
    reducer: reducerMap,
    preloadedState: {
      sales: {
        sales: [],
        selectedSale: null,
        filters: {},
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
    React.createElement(Provider, { store, children });
}

describe('useSales', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns sales and loading state from store', () => {
    const store = makeStore({ sales: [mockSale] });
    const { result } = renderHook(() => useSales(), { wrapper: makeWrapper(store) });

    expect(result.current.sales).toHaveLength(1);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  // ─── loadSales ──────────────────────────────────────────────────────────────

  describe('loadSales', () => {
    it('dispatches fetchSales when no lastFetch', async () => {
      mockGetAllSales.mockResolvedValue([mockSale]);
      const store = makeStore();
      const { result } = renderHook(() => useSales(), { wrapper: makeWrapper(store) });

      await act(async () => { result.current.loadSales(); });

      expect(mockGetAllSales).toHaveBeenCalledTimes(1);
    });

    it('skips fetch when lastFetch is recent', async () => {
      const store = makeStore({ lastFetch: Date.now() });
      const { result } = renderHook(() => useSales(), { wrapper: makeWrapper(store) });

      await act(async () => { result.current.loadSales(); });

      expect(mockGetAllSales).not.toHaveBeenCalled();
    });

    it('fetches even with recent lastFetch when force=true', async () => {
      mockGetAllSales.mockResolvedValue([]);
      const store = makeStore({ lastFetch: Date.now() });
      const { result } = renderHook(() => useSales(), { wrapper: makeWrapper(store) });

      await act(async () => { result.current.loadSales(undefined, true); });

      expect(mockGetAllSales).toHaveBeenCalledTimes(1);
    });

    it('passes filters to getAllSales', async () => {
      mockGetAllSales.mockResolvedValue([]);
      const store = makeStore();
      const { result } = renderHook(() => useSales(), { wrapper: makeWrapper(store) });

      await act(async () => { result.current.loadSales({ statusId: 'status-1' }); });

      expect(mockGetAllSales).toHaveBeenCalledWith({ statusId: 'status-1' });
    });
  });

  // ─── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('returns created sale on success', async () => {
      mockCreateSale.mockResolvedValue(mockSale);
      const store = makeStore();
      const { result } = renderHook(() => useSales(), { wrapper: makeWrapper(store) });

      let created: any;
      await act(async () => { created = await result.current.create({} as any); });

      expect(created).toEqual(mockSale);
    });

    it('throws when thunk is rejected', async () => {
      mockCreateSale.mockRejectedValue(new Error('Server error'));
      const store = makeStore();
      const { result } = renderHook(() => useSales(), { wrapper: makeWrapper(store) });

      let threw = false;
      await act(async () => {
        try { await result.current.create({} as any); } catch { threw = true; }
      });

      expect(threw).toBe(true);
    });
  });

  // ─── remove ─────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('returns true on success', async () => {
      mockDeleteSale.mockResolvedValue(undefined);
      const store = makeStore({ sales: [mockSale] });
      const { result } = renderHook(() => useSales(), { wrapper: makeWrapper(store) });

      let removed: any;
      await act(async () => { removed = await result.current.remove('sale-1'); });

      expect(removed).toBe(true);
    });

    it('throws when thunk is rejected', async () => {
      mockDeleteSale.mockRejectedValue(new Error('Not found'));
      const store = makeStore({ sales: [mockSale] });
      const { result } = renderHook(() => useSales(), { wrapper: makeWrapper(store) });

      let threw = false;
      await act(async () => {
        try { await result.current.remove('sale-1'); } catch { threw = true; }
      });

      expect(threw).toBe(true);
    });
  });

  // ─── applyFilters / removeFilters ────────────────────────────────────────────

  it('applyFilters updates filters and fetches with them', async () => {
    mockGetAllSales.mockResolvedValue([]);
    const store = makeStore();
    const { result } = renderHook(() => useSales(), { wrapper: makeWrapper(store) });

    await act(async () => { result.current.applyFilters({ statusId: 'status-1' }); });

    expect(store.getState().sales.filters).toEqual({ statusId: 'status-1' });
    expect(mockGetAllSales).toHaveBeenCalledWith({ statusId: 'status-1' });
  });

  it('removeFilters clears filters state', () => {
    const store = makeStore({ filters: { statusId: 'status-1' } });
    const { result } = renderHook(() => useSales(), { wrapper: makeWrapper(store) });

    act(() => { result.current.removeFilters(); });

    expect(store.getState().sales.filters).toEqual({});
  });

  // ─── selectSaleById ──────────────────────────────────────────────────────────

  it('selectSaleById sets selectedSale from list', () => {
    const store = makeStore({ sales: [mockSale] });
    const { result } = renderHook(() => useSales(), { wrapper: makeWrapper(store) });

    act(() => { result.current.selectSaleById('sale-1'); });

    expect(store.getState().sales.selectedSale).toEqual(mockSale);
  });

  it('selectSaleById with null clears selectedSale', () => {
    const store = makeStore({ sales: [mockSale], selectedSale: mockSale });
    const { result } = renderHook(() => useSales(), { wrapper: makeWrapper(store) });

    act(() => { result.current.selectSaleById(null); });

    expect(store.getState().sales.selectedSale).toBeNull();
  });

  // ─── clearErrors ─────────────────────────────────────────────────────────────

  it('clearErrors resets error to null', () => {
    const store = makeStore({ error: 'Some error' });
    const { result } = renderHook(() => useSales(), { wrapper: makeWrapper(store) });

    act(() => { result.current.clearErrors(); });

    expect(store.getState().sales.error).toBeNull();
  });
});
