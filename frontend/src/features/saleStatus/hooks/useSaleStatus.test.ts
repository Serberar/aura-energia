import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';

vi.mock('@/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), error: vi.fn(), apiError: vi.fn(), userAction: vi.fn() },
}));

vi.mock('../services/saleStatusService', () => ({
  getAllSaleStatuses: vi.fn(),
  getSaleStatusById: vi.fn(),
  createSaleStatus: vi.fn(),
  updateSaleStatus: vi.fn(),
  deleteSaleStatus: vi.fn(),
  reorderSaleStatuses: vi.fn(),
}));

import saleStatusReducer from '../saleStatusSlice';
import { useSaleStatus } from './useSaleStatus';
import * as saleStatusServiceMod from '../services/saleStatusService';

const mockGetAll       = saleStatusServiceMod.getAllSaleStatuses as ReturnType<typeof vi.fn>;
const mockCreate       = saleStatusServiceMod.createSaleStatus  as ReturnType<typeof vi.fn>;
const mockUpdate       = saleStatusServiceMod.updateSaleStatus  as ReturnType<typeof vi.fn>;
const mockDelete       = saleStatusServiceMod.deleteSaleStatus  as ReturnType<typeof vi.fn>;
const mockReorder      = saleStatusServiceMod.reorderSaleStatuses as ReturnType<typeof vi.fn>;

const mockStatus = {
  id: 'status-1', name: 'Inicial', order: 1, color: '#FFF',
  isFinal: false, isCancelled: false, isSystem: true,
};

const mockFinalStatus = {
  id: 'status-2', name: 'Completado', order: 2, color: '#0F0',
  isFinal: true, isCancelled: false, isSystem: false,
};

function makeStore(preloaded: Record<string, any> = {}) {
  const reducerMap: any = { saleStatus: saleStatusReducer };
  return configureStore({
    reducer: reducerMap,
    preloadedState: {
      saleStatus: {
        statuses: [],
        selectedStatus: null,
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

describe('useSaleStatus', () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── auto-load on mount ───────────────────────────────────────────────────

  it('auto-loads statuses on mount when no lastFetch', async () => {
    mockGetAll.mockResolvedValue([mockStatus]);
    const store = makeStore();
    await act(async () => {
      renderHook(() => useSaleStatus(), { wrapper: makeWrapper(store) });
    });

    expect(mockGetAll).toHaveBeenCalledTimes(1);
  });

  it('skips auto-load when lastFetch is recent', async () => {
    const store = makeStore({ lastFetch: Date.now() });
    await act(async () => {
      renderHook(() => useSaleStatus(), { wrapper: makeWrapper(store) });
    });

    expect(mockGetAll).not.toHaveBeenCalled();
  });

  it('returns statuses from store', async () => {
    const store = makeStore({ statuses: [mockStatus], lastFetch: Date.now() });
    const { result } = renderHook(() => useSaleStatus(), { wrapper: makeWrapper(store) });

    expect(result.current.statuses).toHaveLength(1);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  // ─── loadStatuses with force ───────────────────────────────────────────────

  it('loadStatuses(force=true) fetches even with recent lastFetch', async () => {
    mockGetAll.mockResolvedValue([]);
    const store = makeStore({ lastFetch: Date.now() });
    const { result } = renderHook(() => useSaleStatus(), { wrapper: makeWrapper(store) });

    await act(async () => { result.current.loadStatuses(true); });

    expect(mockGetAll).toHaveBeenCalledTimes(1);
  });

  // ─── createStatus ──────────────────────────────────────────────────────────

  describe('createStatus', () => {
    it('returns created status on success', async () => {
      mockGetAll.mockResolvedValue([]);
      mockCreate.mockResolvedValue(mockStatus);
      const store = makeStore({ lastFetch: Date.now() });
      const { result } = renderHook(() => useSaleStatus(), { wrapper: makeWrapper(store) });

      let created: any;
      await act(async () => {
        created = await result.current.createStatus({
          name: 'Inicial', order: 1, color: '#FFF', isFinal: false, isCancelled: false,
        });
      });

      expect(created).toEqual(mockStatus);
    });

    it('throws when thunk is rejected', async () => {
      mockGetAll.mockResolvedValue([]);
      mockCreate.mockRejectedValue(new Error('Duplicate order'));
      const store = makeStore({ lastFetch: Date.now() });
      const { result } = renderHook(() => useSaleStatus(), { wrapper: makeWrapper(store) });

      let threw = false;
      await act(async () => {
        try {
          await result.current.createStatus({ name: 'X', order: 1, color: '#FFF', isFinal: false, isCancelled: false });
        } catch { threw = true; }
      });

      expect(threw).toBe(true);
    });
  });

  // ─── updateStatus ─────────────────────────────────────────────────────────

  it('updateStatus returns updated status on success', async () => {
    mockGetAll.mockResolvedValue([]);
    const updated = { ...mockStatus, name: 'Actualizado' };
    mockUpdate.mockResolvedValue(updated);
    const store = makeStore({ lastFetch: Date.now() });
    const { result } = renderHook(() => useSaleStatus(), { wrapper: makeWrapper(store) });

    let returned: any;
    await act(async () => { returned = await result.current.updateStatus('status-1', { name: 'Actualizado' }); });

    expect(returned.name).toBe('Actualizado');
  });

  // ─── deleteStatus ─────────────────────────────────────────────────────────

  it('deleteStatus returns true on success', async () => {
    mockGetAll.mockResolvedValue([]);
    mockDelete.mockResolvedValue(undefined);
    const store = makeStore({ statuses: [mockStatus], lastFetch: Date.now() });
    const { result } = renderHook(() => useSaleStatus(), { wrapper: makeWrapper(store) });

    let returned: any;
    await act(async () => { returned = await result.current.deleteStatus('status-1'); });

    expect(returned).toBe(true);
  });

  // ─── reorderStatuses ──────────────────────────────────────────────────────

  it('reorderStatuses returns reordered list on success', async () => {
    mockGetAll.mockResolvedValue([]);
    const reordered = [mockStatus, mockFinalStatus];
    mockReorder.mockResolvedValue(reordered);
    const store = makeStore({ lastFetch: Date.now() });
    const { result } = renderHook(() => useSaleStatus(), { wrapper: makeWrapper(store) });

    let returned: any;
    await act(async () => {
      returned = await result.current.reorderStatuses({ statuses: [{ id: 'status-1', order: 1 }] });
    });

    expect(returned).toEqual(reordered);
  });

  // ─── helpers ─────────────────────────────────────────────────────────────

  it('finalStatuses returns only final statuses', () => {
    const store = makeStore({ statuses: [mockStatus, mockFinalStatus], lastFetch: Date.now() });
    const { result } = renderHook(() => useSaleStatus(), { wrapper: makeWrapper(store) });

    expect(result.current.finalStatuses).toHaveLength(1);
    expect(result.current.finalStatuses[0].id).toBe('status-2');
  });

  it('nonFinalStatuses returns only non-final statuses', () => {
    const store = makeStore({ statuses: [mockStatus, mockFinalStatus], lastFetch: Date.now() });
    const { result } = renderHook(() => useSaleStatus(), { wrapper: makeWrapper(store) });

    expect(result.current.nonFinalStatuses).toHaveLength(1);
    expect(result.current.nonFinalStatuses[0].id).toBe('status-1');
  });

  it('getStatusById returns the matching status', () => {
    const store = makeStore({ statuses: [mockStatus, mockFinalStatus], lastFetch: Date.now() });
    const { result } = renderHook(() => useSaleStatus(), { wrapper: makeWrapper(store) });

    expect(result.current.getStatusById('status-1')).toEqual(mockStatus);
    expect(result.current.getStatusById('nonexistent')).toBeUndefined();
  });

  it('hasStatusWithOrder returns true when order exists', () => {
    const store = makeStore({ statuses: [mockStatus], lastFetch: Date.now() });
    const { result } = renderHook(() => useSaleStatus(), { wrapper: makeWrapper(store) });

    expect(result.current.hasStatusWithOrder(1)).toBe(true);
    expect(result.current.hasStatusWithOrder(99)).toBe(false);
  });

  it('getNextOrder returns max order + 1', () => {
    const store = makeStore({ statuses: [mockStatus, mockFinalStatus], lastFetch: Date.now() });
    const { result } = renderHook(() => useSaleStatus(), { wrapper: makeWrapper(store) });

    expect(result.current.getNextOrder()).toBe(3);
  });

  it('getNextOrder returns 0 when no statuses', () => {
    const store = makeStore({ statuses: [], lastFetch: Date.now() });
    const { result } = renderHook(() => useSaleStatus(), { wrapper: makeWrapper(store) });

    expect(result.current.getNextOrder()).toBe(0);
  });
});
