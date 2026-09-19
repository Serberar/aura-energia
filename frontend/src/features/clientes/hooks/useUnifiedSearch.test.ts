import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';

vi.mock('@/features/clientes/services/clientService', () => ({
  searchClient: vi.fn(),
  getClientById: vi.fn(),
  createClient: vi.fn(),
  updateClient: vi.fn(),
  pushClientData: vi.fn(),
  clientService: {
    searchClient: vi.fn(),
  },
  default: {
    searchClient: vi.fn(),
  },
}));

vi.mock('@/features/1skore/skoreSlice', () => ({
  doSearch1Skore: vi.fn(),
}));

vi.mock('../utils/clientDeduplication', () => ({
  calculateClientCompleteness: vi.fn(() => 0),
  deduplicateCrmClients: vi.fn((clients: any[]) => clients),
}));

import { useUnifiedSearch } from './useUnifiedSearch';
import * as clientServiceMod from '@/features/clientes/services/clientService';
import * as skoreSliceMod from '@/features/1skore/skoreSlice';

const mockClientServiceSearch = (clientServiceMod as any).clientService.searchClient as ReturnType<typeof vi.fn>;
const mockDoSearch1Skore = skoreSliceMod.doSearch1Skore as unknown as ReturnType<typeof vi.fn>;

const mockClient = {
  id: 'client-1', firstName: 'María', lastName: 'González', dni: '12345678A',
  email: 'maria@example.com', phones: ['600000001'],
  addresses: [{ address: 'Calle Mayor 1', cupsGas: '', cupsLuz: '' }],
  bankAccounts: [], comments: [],
};

const mockSkoreResult = {
  nombre: 'María', apellidos: 'González', documento: '12345678A',
};

// doSearch1Skore(term) must return a thunk function.
// When Redux dispatch calls that thunk, it must return a Promise with .unwrap().
function makeSkoreThunk(resolveWith: any = mockSkoreResult) {
  return (_searchTerm: string) => (_dispatch: any) => {
    const p = Promise.resolve(resolveWith);
    return Object.assign(p, { unwrap: () => p });
  };
}

function makeSkoreThunkReject(error: Error) {
  return (_searchTerm: string) => (_dispatch: any) => {
    // Outer dispatch result resolves to avoid unhandled rejection; unwrap() rejects.
    const outer = Promise.resolve(null);
    return Object.assign(outer, { unwrap: () => Promise.reject(error) });
  };
}

function makeStore() {
  const appSettingsReducer = (s = {
    callsModuleEnabled: true, crmModuleEnabled: true,
    firmaModuleEnabled: false, crmOnlineSearchEnabled: true, loaded: true,
  }) => s;
  return configureStore({ reducer: { _: (s = {}) => s, appSettings: appSettingsReducer } });
}

function makeWrapper(store: ReturnType<typeof makeStore>) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(Provider, { store, children });
}

describe('useUnifiedSearch', () => {
  beforeEach(() => vi.clearAllMocks());

  it('starts with empty results and not loading', () => {
    const store = makeStore();
    const { result } = renderHook(() => useUnifiedSearch(), { wrapper: makeWrapper(store) });

    expect(result.current.searchResults).toHaveLength(0);
    expect(result.current.hasResults).toBe(false);
    expect(result.current.isAnyLoading).toBe(false);
  });

  it('throws if search term is empty', async () => {
    const store = makeStore();
    const { result } = renderHook(() => useUnifiedSearch(), { wrapper: makeWrapper(store) });

    let error: Error | undefined;
    await act(async () => {
      try { await result.current.performUnifiedSearch(''); } catch (e) { error = e as Error; }
    });

    expect(error?.message).toContain('Introduce');
  });

  it('performUnifiedSearch adds result to searchResults', async () => {
    mockClientServiceSearch.mockResolvedValue([mockClient]);
    mockDoSearch1Skore.mockImplementation(makeSkoreThunk());

    const store = makeStore();
    const { result } = renderHook(() => useUnifiedSearch(), { wrapper: makeWrapper(store) });

    await act(async () => {
      await result.current.performUnifiedSearch('12345678A');
    });

    expect(result.current.searchResults).toHaveLength(1);
    expect(result.current.searchResults[0].searchTerm).toBe('12345678A');
    expect(result.current.hasResults).toBe(true);
  });

  it('sets crmClients from CRM search', async () => {
    mockClientServiceSearch.mockResolvedValue([mockClient]);
    mockDoSearch1Skore.mockImplementation(makeSkoreThunk());

    const store = makeStore();
    const { result } = renderHook(() => useUnifiedSearch(), { wrapper: makeWrapper(store) });

    await act(async () => {
      await result.current.performUnifiedSearch('12345678A');
    });

    expect(result.current.searchResults[0].crmClients).toHaveLength(1);
    expect(result.current.searchResults[0].isLoading).toBe(false);
  });

  it('handles both CRM and Skore failure gracefully', async () => {
    mockClientServiceSearch.mockRejectedValue(new Error('CRM error'));
    mockDoSearch1Skore.mockImplementation(makeSkoreThunkReject(new Error('Skore error')));

    const store = makeStore();
    const { result } = renderHook(() => useUnifiedSearch(), { wrapper: makeWrapper(store) });

    await act(async () => {
      await result.current.performUnifiedSearch('999999999');
    });

    const searchResult = result.current.searchResults[0];
    expect(searchResult.error).toBeDefined();
    expect(searchResult.isLoading).toBe(false);
  });

  // ─── clearResults / removeResult ────────────────────────────────────────────

  it('clearResults empties searchResults', async () => {
    mockClientServiceSearch.mockResolvedValue([mockClient]);
    mockDoSearch1Skore.mockImplementation(makeSkoreThunk());

    const store = makeStore();
    const { result } = renderHook(() => useUnifiedSearch(), { wrapper: makeWrapper(store) });

    await act(async () => {
      await result.current.performUnifiedSearch('12345678A');
    });

    expect(result.current.searchResults).toHaveLength(1);

    act(() => { result.current.clearResults(); });

    expect(result.current.searchResults).toHaveLength(0);
  });

  it('removeResult removes a specific search result', async () => {
    mockClientServiceSearch.mockResolvedValue([mockClient]);
    mockDoSearch1Skore.mockImplementation(makeSkoreThunk());

    const store = makeStore();
    const { result } = renderHook(() => useUnifiedSearch(), { wrapper: makeWrapper(store) });

    await act(async () => {
      await result.current.performUnifiedSearch('12345678A');
    });

    act(() => { result.current.removeResult('12345678A'); });

    expect(result.current.searchResults).toHaveLength(0);
  });

  it('removeResult does not affect other results', async () => {
    mockClientServiceSearch.mockResolvedValue([]);
    mockDoSearch1Skore.mockImplementation(makeSkoreThunk({ nombre: 'Test' }));

    const store = makeStore();
    const { result } = renderHook(() => useUnifiedSearch(), { wrapper: makeWrapper(store) });

    await act(async () => {
      await result.current.performUnifiedSearch('term1');
      await result.current.performUnifiedSearch('term2');
    });

    act(() => { result.current.removeResult('term1'); });

    expect(result.current.searchResults).toHaveLength(1);
    expect(result.current.searchResults[0].searchTerm).toBe('term2');
  });
});
