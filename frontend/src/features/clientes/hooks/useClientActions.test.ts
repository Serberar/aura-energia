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
import { useClientActions } from './useClientActions';
import * as clientServiceMod from '../services/clientService';

const mockCreateClientService = clientServiceMod.createClient as ReturnType<typeof vi.fn>;
const mockSearchClientService = clientServiceMod.searchClient as ReturnType<typeof vi.fn>;

const mockClient = {
  id: 'client-1', firstName: 'María', lastName: 'González', dni: '12345678A',
  email: 'maria@example.com', phones: ['600000001'],
  addresses: [{ address: 'Calle Mayor 1', cupsGas: '', cupsLuz: '' }],
  bankAccounts: [], comments: [],
};

function makeStore() {
  const reducerMap: any = { clients: clientsReducer };
  return configureStore({
    reducer: reducerMap,
    preloadedState: {
      clients: { clients: [], loading: false, error: null, lastFetch: null },
    },
  });
}

function makeWrapper(store: ReturnType<typeof makeStore>) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(Provider, { store }, children);
}

describe('useClientActions', () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── createClient ───────────────────────────────────────────────────────────

  describe('createClient', () => {
    it('returns created client on success', async () => {
      mockCreateClientService.mockResolvedValue(mockClient);
      const store = makeStore();
      const { result } = renderHook(() => useClientActions(), { wrapper: makeWrapper(store) });

      let created: any;
      await act(async () => {
        created = await result.current.createClient({
          firstName: 'María', lastName: 'González', dni: '12345678A',
          phones: ['600000001'], addresses: [], bankAccounts: [],
        });
      });

      expect(created).toEqual(mockClient);
    });

    it('adds created client to store', async () => {
      mockCreateClientService.mockResolvedValue(mockClient);
      const store = makeStore();
      const { result } = renderHook(() => useClientActions(), { wrapper: makeWrapper(store) });

      await act(async () => {
        await result.current.createClient({
          firstName: 'María', lastName: 'González', dni: '12345678A',
          phones: [], addresses: [], bankAccounts: [],
        });
      });

      expect(store.getState().clients.clients).toHaveLength(1);
    });

    it('throws when thunk is rejected', async () => {
      mockCreateClientService.mockRejectedValue(new Error('Duplicate DNI'));
      const store = makeStore();
      const { result } = renderHook(() => useClientActions(), { wrapper: makeWrapper(store) });

      let threw = false;
      await act(async () => {
        try {
          await result.current.createClient({
            firstName: 'X', lastName: 'Y', dni: '12345678A',
            phones: [], addresses: [], bankAccounts: [],
          });
        } catch { threw = true; }
      });

      expect(threw).toBe(true);
    });
  });

  // ─── searchClient ───────────────────────────────────────────────────────────

  describe('searchClient', () => {
    it('returns client(s) on success', async () => {
      mockSearchClientService.mockResolvedValue(mockClient);
      const store = makeStore();
      const { result } = renderHook(() => useClientActions(), { wrapper: makeWrapper(store) });

      let found: any;
      await act(async () => {
        found = await result.current.searchClient('12345678A');
      });

      expect(found).toEqual([mockClient]);
    });

    it('throws when thunk is rejected', async () => {
      mockSearchClientService.mockRejectedValue(new Error('Not found'));
      const store = makeStore();
      const { result } = renderHook(() => useClientActions(), { wrapper: makeWrapper(store) });

      let threw = false;
      await act(async () => {
        try { await result.current.searchClient('unknown'); } catch { threw = true; }
      });

      expect(threw).toBe(true);
    });
  });
});
