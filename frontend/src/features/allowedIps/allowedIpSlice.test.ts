import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

vi.mock('./services/allowedIpService', () => ({
  getAllAllowedIps: vi.fn(),
  createAllowedIp: vi.fn(),
  deleteAllowedIp: vi.fn(),
}));

vi.mock('@/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    userAction: vi.fn(),
  },
}));

import allowedIpReducer, {
  clearError,
  fetchAllowedIps,
  createAllowedIp,
  deleteAllowedIp,
} from './allowedIpSlice';
import * as allowedIpService from './services/allowedIpService';
import type { AllowedIp } from './services/allowedIpService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeStore() {
  const reducerMap: any = { allowedIps: allowedIpReducer };
  return configureStore({ reducer: reducerMap });
}

const mockIp1: AllowedIp = {
  id: 'ip-1',
  ip: '192.168.1.10',
  description: 'Oficina principal',
  createdAt: '2024-01-01T00:00:00.000Z',
};

const mockIp2: AllowedIp = {
  id: 'ip-2',
  ip: '10.0.0.5',
  description: 'Servidor backup',
  createdAt: '2024-01-02T00:00:00.000Z',
};

// ─── synchronous reducers ─────────────────────────────────────────────────────

describe('allowedIpSlice – synchronous reducers', () => {
  it('clearError sets error to null', () => {
    const stateWithError = allowedIpReducer(
      { ips: [], loading: false, error: 'some error', lastFetch: null },
      clearError()
    );
    expect(stateWithError.error).toBeNull();
  });

  it('initial state has empty ips array', () => {
    const state = allowedIpReducer(undefined, { type: '@@INIT' });
    expect(state.ips).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.lastFetch).toBeNull();
  });
});

// ─── fetchAllowedIps thunk ────────────────────────────────────────────────────

describe('fetchAllowedIps', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sets loading=true while pending', () => {
    const store = makeStore();
    vi.mocked(allowedIpService.getAllAllowedIps).mockReturnValue(new Promise(() => {}));
    store.dispatch(fetchAllowedIps());
    expect(store.getState().allowedIps.loading).toBe(true);
    expect(store.getState().allowedIps.error).toBeNull();
  });

  it('sets ips and lastFetch on fulfilled', async () => {
    const store = makeStore();
    vi.mocked(allowedIpService.getAllAllowedIps).mockResolvedValue([mockIp1, mockIp2]);

    await store.dispatch(fetchAllowedIps());

    const { allowedIps } = store.getState();
    expect(allowedIps.loading).toBe(false);
    expect(allowedIps.ips).toEqual([mockIp1, mockIp2]);
    expect(allowedIps.lastFetch).not.toBeNull();
  });

  it('sets error on rejected with server message', async () => {
    const store = makeStore();
    vi.mocked(allowedIpService.getAllAllowedIps).mockRejectedValue({
      response: { data: { message: 'Unauthorized' } },
    });

    await store.dispatch(fetchAllowedIps());

    const { allowedIps } = store.getState();
    expect(allowedIps.loading).toBe(false);
    expect(allowedIps.error).toBe('Unauthorized');
  });

  it('uses default error message when no server message', async () => {
    const store = makeStore();
    vi.mocked(allowedIpService.getAllAllowedIps).mockRejectedValue(new Error('Network error'));

    await store.dispatch(fetchAllowedIps());

    expect(store.getState().allowedIps.error).toBe('Error al obtener IPs permitidas');
  });
});

// ─── createAllowedIp thunk ────────────────────────────────────────────────────

describe('createAllowedIp', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sets loading=true while pending', () => {
    const store = makeStore();
    vi.mocked(allowedIpService.createAllowedIp).mockReturnValue(new Promise(() => {}));
    store.dispatch(createAllowedIp({ ip: '192.168.1.1', description: 'Test' }));
    expect(store.getState().allowedIps.loading).toBe(true);
  });

  it('prepends new ip to list on fulfilled', async () => {
    const store = makeStore();
    // Pre-populate with existing ip
    vi.mocked(allowedIpService.getAllAllowedIps).mockResolvedValue([mockIp2]);
    await store.dispatch(fetchAllowedIps());

    vi.mocked(allowedIpService.createAllowedIp).mockResolvedValue(mockIp1);
    await store.dispatch(createAllowedIp({ ip: '192.168.1.10', description: 'Oficina principal' }));

    const { ips } = store.getState().allowedIps;
    expect(ips).toHaveLength(2);
    // unshift — new ip is first
    expect(ips[0].id).toBe('ip-1');
    expect(ips[1].id).toBe('ip-2');
  });

  it('sets error on rejected with server message', async () => {
    const store = makeStore();
    vi.mocked(allowedIpService.createAllowedIp).mockRejectedValue({
      response: { data: { message: 'IP already exists' } },
    });

    await store.dispatch(createAllowedIp({ ip: '192.168.1.1' }));

    expect(store.getState().allowedIps.error).toBe('IP already exists');
  });

  it('uses default error message when no server message', async () => {
    const store = makeStore();
    vi.mocked(allowedIpService.createAllowedIp).mockRejectedValue(new Error('Network'));

    await store.dispatch(createAllowedIp({ ip: '1.2.3.4' }));

    expect(store.getState().allowedIps.error).toBe('Error al crear IP permitida');
  });
});

// ─── deleteAllowedIp thunk ────────────────────────────────────────────────────

describe('deleteAllowedIp', () => {
  beforeEach(() => vi.clearAllMocks());

  it('removes deleted ip from list on fulfilled', async () => {
    const store = makeStore();
    vi.mocked(allowedIpService.getAllAllowedIps).mockResolvedValue([mockIp1, mockIp2]);
    await store.dispatch(fetchAllowedIps());

    vi.mocked(allowedIpService.deleteAllowedIp).mockResolvedValue(undefined);
    await store.dispatch(deleteAllowedIp('ip-1'));

    const { ips } = store.getState().allowedIps;
    expect(ips).toHaveLength(1);
    expect(ips[0].id).toBe('ip-2');
  });

  it('sets loading=false and ips unchanged on fulfilled when id not in list', async () => {
    const store = makeStore();
    vi.mocked(allowedIpService.getAllAllowedIps).mockResolvedValue([mockIp1]);
    await store.dispatch(fetchAllowedIps());

    vi.mocked(allowedIpService.deleteAllowedIp).mockResolvedValue(undefined);
    await store.dispatch(deleteAllowedIp('non-existent-id'));

    const { ips, loading } = store.getState().allowedIps;
    expect(loading).toBe(false);
    expect(ips).toHaveLength(1);
  });

  it('sets error on rejected with server message', async () => {
    const store = makeStore();
    vi.mocked(allowedIpService.deleteAllowedIp).mockRejectedValue({
      response: { data: { message: 'Cannot delete last IP' } },
    });

    await store.dispatch(deleteAllowedIp('ip-1'));

    expect(store.getState().allowedIps.error).toBe('Cannot delete last IP');
  });

  it('uses default error message when no server message', async () => {
    const store = makeStore();
    vi.mocked(allowedIpService.deleteAllowedIp).mockRejectedValue(new Error('Network'));

    await store.dispatch(deleteAllowedIp('ip-1'));

    expect(store.getState().allowedIps.error).toBe('Error al eliminar IP permitida');
  });
});
