import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

vi.mock('./services/clientService', () => ({
  searchClient: vi.fn(),
  getClientById: vi.fn(),
  createClient: vi.fn(),
}));

vi.mock('../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    userAction: vi.fn(),
  },
}));

import clientsReducer, {
  clearError,
  selectClient,
  clearSelectedClient,
  addClient,
  resetClientsState,
  fetchClients,
  searchClient,
  fetchClientById,
  createClient,
} from './clientsSlice';
import * as clientService from './services/clientService';
import type { Client } from '../../types/sales';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeStore() {
  const reducerMap: any = { clients: clientsReducer };
  return configureStore({ reducer: reducerMap });
}

const mockClient1: Client = {
  id: 'client-1',
  firstName: 'María',
  lastName: 'González',
  dni: '12345678A',
  email: 'maria@example.com',
  phones: ['600000001'],
  addresses: [],
  bankAccounts: [],
  comments: [],
};

const mockClient2: Client = {
  id: 'client-2',
  firstName: 'Pedro',
  lastName: 'Martínez',
  dni: '87654321B',
  phones: ['600000002'],
  addresses: [],
  bankAccounts: [],
  comments: [],
};

// ─── synchronous reducers ─────────────────────────────────────────────────────

describe('clientsSlice – synchronous reducers', () => {
  it('initial state is correct', () => {
    const state = clientsReducer(undefined, { type: '@@INIT' });
    expect(state.clients).toEqual([]);
    expect(state.selectedClient).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.lastFetch).toBeNull();
  });

  it('clearError sets error to null', () => {
    const stateWithError = clientsReducer(
      { clients: [], selectedClient: null, loading: false, error: 'some error', lastFetch: null },
      clearError()
    );
    expect(stateWithError.error).toBeNull();
  });

  it('selectClient sets selectedClient', () => {
    const state = clientsReducer(
      { clients: [mockClient1], selectedClient: null, loading: false, error: null, lastFetch: null },
      selectClient(mockClient1)
    );
    expect(state.selectedClient).toEqual(mockClient1);
  });

  it('selectClient with null clears selectedClient', () => {
    const state = clientsReducer(
      { clients: [], selectedClient: mockClient1, loading: false, error: null, lastFetch: null },
      selectClient(null)
    );
    expect(state.selectedClient).toBeNull();
  });

  it('clearSelectedClient sets selectedClient to null', () => {
    const state = clientsReducer(
      { clients: [], selectedClient: mockClient1, loading: false, error: null, lastFetch: null },
      clearSelectedClient()
    );
    expect(state.selectedClient).toBeNull();
  });

  it('addClient prepends client to list', () => {
    const state = clientsReducer(
      { clients: [mockClient2], selectedClient: null, loading: false, error: null, lastFetch: null },
      addClient(mockClient1)
    );
    expect(state.clients).toHaveLength(2);
    expect(state.clients[0].id).toBe('client-1');
  });

  it('addClient does not add duplicate client', () => {
    const state = clientsReducer(
      { clients: [mockClient1], selectedClient: null, loading: false, error: null, lastFetch: null },
      addClient(mockClient1)
    );
    expect(state.clients).toHaveLength(1);
  });

  it('resetClientsState returns initial state', () => {
    const dirtyState = {
      clients: [mockClient1],
      selectedClient: mockClient1,
      loading: true,
      error: 'error',
      lastFetch: 12345,
    };
    const reset = clientsReducer(dirtyState, resetClientsState());
    expect(reset).toEqual({
      clients: [],
      selectedClient: null,
      loading: false,
      error: null,
      lastFetch: null,
    });
  });
});

// ─── fetchClients thunk ───────────────────────────────────────────────────────

describe('fetchClients', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sets loading=true while pending', () => {
    const store = makeStore();
    store.dispatch(fetchClients());
    // fetchClients is a sync-ish thunk that always returns []
    // but we can check loading was set
  });

  it('returns empty array on fulfilled (no backend endpoint yet)', async () => {
    const store = makeStore();
    await store.dispatch(fetchClients());

    const { clients } = store.getState();
    expect(clients.loading).toBe(false);
    expect(clients.clients).toEqual([]);
    expect(clients.lastFetch).not.toBeNull();
  });
});

// ─── searchClient thunk ───────────────────────────────────────────────────────

describe('searchClient', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sets loading=true while pending', () => {
    const store = makeStore();
    vi.mocked(clientService.searchClient).mockReturnValue(new Promise(() => {}));
    store.dispatch(searchClient('12345678A'));
    expect(store.getState().clients.loading).toBe(true);
    expect(store.getState().clients.error).toBeNull();
  });

  it('adds single client result on fulfilled', async () => {
    const store = makeStore();
    vi.mocked(clientService.searchClient).mockResolvedValue(mockClient1);

    await store.dispatch(searchClient('12345678A'));

    const { clients } = store.getState().clients;
    expect(clients).toHaveLength(1);
    expect(clients[0].id).toBe('client-1');
    expect(store.getState().clients.loading).toBe(false);
  });

  it('adds array client results on fulfilled', async () => {
    const store = makeStore();
    vi.mocked(clientService.searchClient).mockResolvedValue([mockClient1, mockClient2] as any);

    await store.dispatch(searchClient('600000001'));

    const { clients } = store.getState().clients;
    expect(clients).toHaveLength(2);
  });

  it('does not add duplicate clients on multiple searches', async () => {
    const store = makeStore();
    vi.mocked(clientService.searchClient).mockResolvedValue(mockClient1);

    await store.dispatch(searchClient('12345678A'));
    await store.dispatch(searchClient('12345678A'));

    const { clients } = store.getState().clients;
    expect(clients).toHaveLength(1);
  });

  it('sets error on rejected with server message', async () => {
    const store = makeStore();
    vi.mocked(clientService.searchClient).mockRejectedValue({
      response: { data: { message: 'Client not found' } },
    });

    await store.dispatch(searchClient('99999999Z'));

    expect(store.getState().clients.error).toBe('Client not found');
  });

  it('uses default error message when no server message', async () => {
    const store = makeStore();
    vi.mocked(clientService.searchClient).mockRejectedValue(new Error('Network error'));

    await store.dispatch(searchClient('12345678A'));

    expect(store.getState().clients.error).toBe('Error al buscar cliente');
  });
});

// ─── fetchClientById thunk ────────────────────────────────────────────────────

describe('fetchClientById', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sets selectedClient on fulfilled', async () => {
    const store = makeStore();
    vi.mocked(clientService.getClientById).mockResolvedValue(mockClient1);

    await store.dispatch(fetchClientById('client-1'));

    const { clients } = store.getState();
    expect(clients.selectedClient).toEqual(mockClient1);
    expect(clients.loading).toBe(false);
  });

  it('adds client to list when not already present', async () => {
    const store = makeStore();
    vi.mocked(clientService.getClientById).mockResolvedValue(mockClient1);

    await store.dispatch(fetchClientById('client-1'));

    const { clients } = store.getState().clients;
    expect(clients).toHaveLength(1);
    expect(clients[0].id).toBe('client-1');
  });

  it('does not duplicate client already in list', async () => {
    const store = makeStore();
    // First fetch puts client-1 in list
    vi.mocked(clientService.getClientById).mockResolvedValue(mockClient1);
    await store.dispatch(fetchClientById('client-1'));
    // Second fetch returns same client
    vi.mocked(clientService.getClientById).mockResolvedValue(mockClient1);
    await store.dispatch(fetchClientById('client-1'));

    expect(store.getState().clients.clients).toHaveLength(1);
  });

  it('sets error on rejected with server message', async () => {
    const store = makeStore();
    vi.mocked(clientService.getClientById).mockRejectedValue({
      response: { data: { message: 'Not found' } },
    });

    await store.dispatch(fetchClientById('non-existent'));

    expect(store.getState().clients.error).toBe('Not found');
  });

  it('uses default error message when no server message', async () => {
    const store = makeStore();
    vi.mocked(clientService.getClientById).mockRejectedValue(new Error('Network'));

    await store.dispatch(fetchClientById('client-1'));

    expect(store.getState().clients.error).toBe('Error al obtener cliente');
  });
});

// ─── createClient thunk ───────────────────────────────────────────────────────

describe('createClient', () => {
  beforeEach(() => vi.clearAllMocks());

  it('prepends new client to list on fulfilled', async () => {
    const store = makeStore();
    // Add client2 first
    vi.mocked(clientService.getClientById).mockResolvedValue(mockClient2);
    await store.dispatch(fetchClientById('client-2'));

    vi.mocked(clientService.createClient).mockResolvedValue(mockClient1);
    await store.dispatch(createClient({
      firstName: 'María',
      lastName: 'González',
      dni: '12345678A',
      phones: ['600000001'],
      addresses: [],
      bankAccounts: [],
    }));

    const { clients } = store.getState().clients;
    expect(clients).toHaveLength(2);
    // unshift — new client is first
    expect(clients[0].id).toBe('client-1');
    expect(clients[1].id).toBe('client-2');
  });

  it('sets error on rejected with server message', async () => {
    const store = makeStore();
    vi.mocked(clientService.createClient).mockRejectedValue({
      response: { data: { message: 'DNI already exists' } },
    });

    await store.dispatch(createClient({
      firstName: 'Test',
      lastName: 'Client',
      dni: '99999999Z',
      phones: [],
      addresses: [],
      bankAccounts: [],
    }));

    expect(store.getState().clients.error).toBe('DNI already exists');
  });

  it('uses default error message when no server message', async () => {
    const store = makeStore();
    vi.mocked(clientService.createClient).mockRejectedValue(new Error('Network'));

    await store.dispatch(createClient({
      firstName: 'Test',
      lastName: 'Client',
      dni: '12345678A',
      phones: [],
      addresses: [],
      bankAccounts: [],
    }));

    expect(store.getState().clients.error).toBe('Error al crear cliente');
  });
});
