import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';

vi.mock('@/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), error: vi.fn(), apiError: vi.fn(), userAction: vi.fn() },
}));

vi.mock('../services/allowedIpService', () => ({
  getAllAllowedIps: vi.fn(),
  createAllowedIp: vi.fn(),
  deleteAllowedIp: vi.fn(),
}));

import allowedIpReducer from '../allowedIpSlice';
import { useAllowedIps } from './useAllowedIps';
import * as allowedIpServiceMod from '../services/allowedIpService';

const mockGetAllowedIps  = allowedIpServiceMod.getAllAllowedIps  as ReturnType<typeof vi.fn>;
const mockCreateAllowedIp = allowedIpServiceMod.createAllowedIp as ReturnType<typeof vi.fn>;
const mockDeleteAllowedIp = allowedIpServiceMod.deleteAllowedIp as ReturnType<typeof vi.fn>;

const mockIp = {
  id: 'ip-1', ip: '192.168.1.1', description: 'Oficina', createdAt: '2024-01-01',
};

function makeStore(preloaded: Record<string, any> = {}) {
  const reducerMap: any = { allowedIps: allowedIpReducer };
  return configureStore({
    reducer: reducerMap,
    preloadedState: {
      allowedIps: {
        ips: [],
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

describe('useAllowedIps', () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── auto-load on mount ───────────────────────────────────────────────────

  it('auto-loads IPs on mount when no lastFetch', async () => {
    mockGetAllowedIps.mockResolvedValue([mockIp]);
    const store = makeStore();
    await act(async () => {
      renderHook(() => useAllowedIps(), { wrapper: makeWrapper(store) });
    });

    expect(mockGetAllowedIps).toHaveBeenCalledTimes(1);
  });

  it('skips auto-load when lastFetch is recent', async () => {
    const store = makeStore({ lastFetch: Date.now() });
    await act(async () => {
      renderHook(() => useAllowedIps(), { wrapper: makeWrapper(store) });
    });

    expect(mockGetAllowedIps).not.toHaveBeenCalled();
  });

  it('returns IPs and state from store', async () => {
    mockGetAllowedIps.mockResolvedValue([]);
    const store = makeStore({ ips: [mockIp], lastFetch: Date.now() });
    const { result } = renderHook(() => useAllowedIps(), { wrapper: makeWrapper(store) });

    expect(result.current.ips).toHaveLength(1);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  // ─── loadIps ─────────────────────────────────────────────────────────────

  it('loadIps(force=true) fetches even with recent lastFetch', async () => {
    mockGetAllowedIps.mockResolvedValue([]);
    const store = makeStore({ lastFetch: Date.now() });
    const { result } = renderHook(() => useAllowedIps(), { wrapper: makeWrapper(store) });

    await act(async () => { result.current.loadIps(true); });

    expect(mockGetAllowedIps).toHaveBeenCalledTimes(1);
  });

  // ─── addIp ───────────────────────────────────────────────────────────────

  describe('addIp', () => {
    it('returns created IP on success', async () => {
      mockGetAllowedIps.mockResolvedValue([]);
      mockCreateAllowedIp.mockResolvedValue(mockIp);
      const store = makeStore({ lastFetch: Date.now() });
      const { result } = renderHook(() => useAllowedIps(), { wrapper: makeWrapper(store) });

      let created: any;
      await act(async () => {
        created = await result.current.addIp({ ip: '192.168.1.1', description: 'Oficina' });
      });

      expect(created).toEqual(mockIp);
    });

    it('adds IP to store on success', async () => {
      mockGetAllowedIps.mockResolvedValue([]);
      mockCreateAllowedIp.mockResolvedValue(mockIp);
      const store = makeStore({ lastFetch: Date.now() });
      const { result } = renderHook(() => useAllowedIps(), { wrapper: makeWrapper(store) });

      await act(async () => {
        await result.current.addIp({ ip: '192.168.1.1', description: 'Oficina' });
      });

      expect(store.getState().allowedIps.ips).toHaveLength(1);
    });

    it('throws when thunk is rejected', async () => {
      mockGetAllowedIps.mockResolvedValue([]);
      mockCreateAllowedIp.mockRejectedValue(new Error('IP already exists'));
      const store = makeStore({ lastFetch: Date.now() });
      const { result } = renderHook(() => useAllowedIps(), { wrapper: makeWrapper(store) });

      let threw = false;
      await act(async () => {
        try { await result.current.addIp({ ip: '192.168.1.1' }); } catch { threw = true; }
      });

      expect(threw).toBe(true);
    });
  });

  // ─── removeIp ────────────────────────────────────────────────────────────

  describe('removeIp', () => {
    it('returns true on success', async () => {
      mockGetAllowedIps.mockResolvedValue([]);
      mockDeleteAllowedIp.mockResolvedValue(undefined);
      const store = makeStore({ ips: [mockIp], lastFetch: Date.now() });
      const { result } = renderHook(() => useAllowedIps(), { wrapper: makeWrapper(store) });

      let returned: any;
      await act(async () => { returned = await result.current.removeIp('ip-1'); });

      expect(returned).toBe(true);
    });

    it('removes IP from store', async () => {
      mockGetAllowedIps.mockResolvedValue([]);
      mockDeleteAllowedIp.mockResolvedValue(undefined);
      const store = makeStore({ ips: [mockIp], lastFetch: Date.now() });
      const { result } = renderHook(() => useAllowedIps(), { wrapper: makeWrapper(store) });

      await act(async () => { await result.current.removeIp('ip-1'); });

      expect(store.getState().allowedIps.ips).toHaveLength(0);
    });

    it('throws when thunk is rejected', async () => {
      mockGetAllowedIps.mockResolvedValue([]);
      mockDeleteAllowedIp.mockRejectedValue(new Error('Not found'));
      const store = makeStore({ lastFetch: Date.now() });
      const { result } = renderHook(() => useAllowedIps(), { wrapper: makeWrapper(store) });

      let threw = false;
      await act(async () => {
        try { await result.current.removeIp('nonexistent'); } catch { threw = true; }
      });

      expect(threw).toBe(true);
    });
  });

  // ─── clearErrors ─────────────────────────────────────────────────────────

  it('clearErrors resets error to null', () => {
    const store = makeStore({ error: 'Some error', lastFetch: Date.now() });
    const { result } = renderHook(() => useAllowedIps(), { wrapper: makeWrapper(store) });

    act(() => { result.current.clearErrors(); });

    expect(store.getState().allowedIps.error).toBeNull();
  });
});
