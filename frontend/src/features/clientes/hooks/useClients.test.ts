import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';

vi.mock('@/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), error: vi.fn(), apiError: vi.fn(), userAction: vi.fn() },
}));

vi.mock('../services/clientService', () => ({
  searchClient: vi.fn(),
  getClientById: vi.fn(),
  createClient: vi.fn(),
  updateClient: vi.fn(),
  pushClientData: vi.fn(),
  clientService: {
    searchClient: vi.fn(),
    getClientById: vi.fn(),
    createClient: vi.fn(),
    updateClient: vi.fn(),
    pushClientData: vi.fn(),
  },
}));

import clientsReducer from '../clientsSlice';
import { useClients } from './useClients';
import * as clientServiceMod from '../services/clientService';

const mockFetchClients = clientServiceMod.searchClient as ReturnType<typeof vi.fn>;

const mockClient = {
  id: 'client-1', firstName: 'María', lastName: 'González', dni: '12345678A',
  email: 'maria@example.com', phones: ['600000001'],
  addresses: [{ address: 'Calle Mayor 1', cupsGas: '', cupsLuz: '' }],
  bankAccounts: [], comments: [],
};

const mockClient2 = { ...mockClient, id: 'client-2', firstName: 'Pedro', lastName: 'Martínez', dni: 'B87654321', phones: ['600000002'] };

function makeStore(preloaded: Record<string, any> = {}) {
  const reducerMap: any = { clients: clientsReducer };
  return configureStore({
    reducer: reducerMap,
    preloadedState: {
      clients: {
        clients: [],
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

describe('useClients', () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── auto-fetch ────────────────────────────────────────────────────────────

  it('skips auto-fetch when autoFetch=false', async () => {
    const store = makeStore();
    await act(async () => {
      renderHook(() => useClients({ autoFetch: false }), { wrapper: makeWrapper(store) });
    });

    expect(mockFetchClients).not.toHaveBeenCalled();
  });

  it('skips auto-fetch when lastFetch exists', async () => {
    const store = makeStore({ lastFetch: Date.now() });
    await act(async () => {
      renderHook(() => useClients(), { wrapper: makeWrapper(store) });
    });

    expect(mockFetchClients).not.toHaveBeenCalled();
  });

  // ─── state ────────────────────────────────────────────────────────────────

  it('returns clients and state from store', () => {
    const store = makeStore({ clients: [mockClient], lastFetch: Date.now() });
    const { result } = renderHook(
      () => useClients({ autoFetch: false }),
      { wrapper: makeWrapper(store) }
    );

    expect(result.current.clients).toHaveLength(1);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('returns all clients in allClients', () => {
    const store = makeStore({ clients: [mockClient, mockClient2], lastFetch: Date.now() });
    const { result } = renderHook(
      () => useClients({ autoFetch: false }),
      { wrapper: makeWrapper(store) }
    );

    expect(result.current.allClients).toHaveLength(2);
  });

  // ─── searchTerm filtering ─────────────────────────────────────────────────

  it('filters clients by firstName', () => {
    const store = makeStore({ clients: [mockClient, mockClient2], lastFetch: Date.now() });
    const { result } = renderHook(
      () => useClients({ autoFetch: false, searchTerm: 'María' }),
      { wrapper: makeWrapper(store) }
    );

    expect(result.current.clients).toHaveLength(1);
    expect(result.current.clients[0].firstName).toBe('María');
  });

  it('filters clients by DNI', () => {
    const store = makeStore({ clients: [mockClient, mockClient2], lastFetch: Date.now() });
    const { result } = renderHook(
      () => useClients({ autoFetch: false, searchTerm: '12345678A' }),
      { wrapper: makeWrapper(store) }
    );

    expect(result.current.clients).toHaveLength(1);
  });

  it('filters clients by phone', () => {
    const store = makeStore({ clients: [mockClient, mockClient2], lastFetch: Date.now() });
    const { result } = renderHook(
      () => useClients({ autoFetch: false, searchTerm: '600000002' }),
      { wrapper: makeWrapper(store) }
    );

    expect(result.current.clients).toHaveLength(1);
    expect(result.current.clients[0].id).toBe('client-2');
  });

  it('returns empty list when no match', () => {
    const store = makeStore({ clients: [mockClient], lastFetch: Date.now() });
    const { result } = renderHook(
      () => useClients({ autoFetch: false, searchTerm: 'NoExiste' }),
      { wrapper: makeWrapper(store) }
    );

    expect(result.current.clients).toHaveLength(0);
  });

  // ─── stats ─────────────────────────────────────────────────────────────────

  it('returns correct total stats', () => {
    const store = makeStore({ clients: [mockClient, mockClient2], lastFetch: Date.now() });
    const { result } = renderHook(
      () => useClients({ autoFetch: false }),
      { wrapper: makeWrapper(store) }
    );

    expect(result.current.stats.total).toBe(2);
  });
});
