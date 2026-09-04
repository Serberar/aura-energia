import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

// Mock the service module before importing the slice
vi.mock('./services/saleStatusService', () => ({
  getAllSaleStatuses: vi.fn(),
  getSaleStatusById: vi.fn(),
  createSaleStatus: vi.fn(),
  updateSaleStatus: vi.fn(),
  deleteSaleStatus: vi.fn(),
  reorderSaleStatuses: vi.fn(),
}));

// Mock logger to avoid console noise
vi.mock('../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    userAction: vi.fn(),
  },
}));

import saleStatusReducer, {
  clearError,
  resetSaleStatusState,
  updateLocalOrder,
  fetchSaleStatuses,
  fetchSaleStatusById,
  createSaleStatus,
  updateSaleStatus,
  deleteSaleStatus,
  reorderSaleStatuses,
} from './saleStatusSlice';
import * as saleStatusService from './services/saleStatusService';
import type { SaleStatus } from '../../types/sales';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeStore() {
  return configureStore({ reducer: { saleStatus: saleStatusReducer } });
}

const mockStatus1: SaleStatus = {
  id: 'status-1',
  name: 'Inicial',
  order: 1,
  color: '#FFFFFF',
  isFinal: false,
  isCancelled: false,
  isSystem: true,
};

const mockStatus2: SaleStatus = {
  id: 'status-2',
  name: 'En Proceso',
  order: 2,
  color: '#00FF00',
  isFinal: false,
  isCancelled: false,
  isSystem: false,
};

const mockStatus3: SaleStatus = {
  id: 'status-3',
  name: 'Finalizado',
  order: 3,
  color: '#0000FF',
  isFinal: true,
  isCancelled: false,
  isSystem: false,
};

// ─── synchronous reducers ─────────────────────────────────────────────────────

describe('saleStatusSlice – synchronous reducers', () => {
  it('clearError sets error to null', () => {
    const stateWithError = saleStatusReducer(
      { statuses: [], selectedStatus: null, loading: false, error: 'some error', lastFetch: null },
      clearError()
    );
    expect(stateWithError.error).toBeNull();
  });

  it('resetSaleStatusState returns initial state', () => {
    const dirtyState = {
      statuses: [mockStatus1],
      selectedStatus: mockStatus1,
      loading: true,
      error: 'error',
      lastFetch: 12345,
    };
    const reset = saleStatusReducer(dirtyState, resetSaleStatusState());
    expect(reset).toEqual({
      statuses: [],
      selectedStatus: null,
      loading: false,
      error: null,
      lastFetch: null,
    });
  });

  it('updateLocalOrder replaces statuses array', () => {
    const newOrder = [mockStatus2, mockStatus1];
    const updated = saleStatusReducer(
      { statuses: [mockStatus1, mockStatus2], selectedStatus: null, loading: false, error: null, lastFetch: null },
      updateLocalOrder(newOrder)
    );
    expect(updated.statuses).toEqual([mockStatus2, mockStatus1]);
  });
});

// ─── fetchSaleStatuses thunk ──────────────────────────────────────────────────

describe('fetchSaleStatuses', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sets loading=true while pending', () => {
    const store = makeStore();
    vi.mocked(saleStatusService.getAllSaleStatuses).mockReturnValue(new Promise(() => {}));
    store.dispatch(fetchSaleStatuses());
    expect(store.getState().saleStatus.loading).toBe(true);
    expect(store.getState().saleStatus.error).toBeNull();
  });

  it('sets statuses and lastFetch on fulfilled', async () => {
    const store = makeStore();
    vi.mocked(saleStatusService.getAllSaleStatuses).mockResolvedValue([mockStatus1, mockStatus2]);

    await store.dispatch(fetchSaleStatuses());

    const { saleStatus } = store.getState();
    expect(saleStatus.loading).toBe(false);
    expect(saleStatus.statuses).toEqual([mockStatus1, mockStatus2]);
    expect(saleStatus.lastFetch).not.toBeNull();
  });

  it('sets error on rejected', async () => {
    const store = makeStore();
    vi.mocked(saleStatusService.getAllSaleStatuses).mockRejectedValue({
      response: { data: { message: 'Server error' } },
    });

    await store.dispatch(fetchSaleStatuses());

    const { saleStatus } = store.getState();
    expect(saleStatus.loading).toBe(false);
    expect(saleStatus.error).toBe('Server error');
  });

  it('uses default error message when response has no message', async () => {
    const store = makeStore();
    vi.mocked(saleStatusService.getAllSaleStatuses).mockRejectedValue(new Error('Network error'));

    await store.dispatch(fetchSaleStatuses());

    expect(store.getState().saleStatus.error).toBe('Error al obtener estados de venta');
  });
});

// ─── fetchSaleStatusById thunk ────────────────────────────────────────────────

describe('fetchSaleStatusById', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updates existing status in list on fulfilled', async () => {
    const store = makeStore();
    // Pre-populate
    vi.mocked(saleStatusService.getAllSaleStatuses).mockResolvedValue([mockStatus1, mockStatus2]);
    await store.dispatch(fetchSaleStatuses());

    // Fetch by ID returns updated version
    const updatedStatus = { ...mockStatus2, name: 'En Proceso (Updated)' };
    vi.mocked(saleStatusService.getSaleStatusById).mockResolvedValue(updatedStatus);
    await store.dispatch(fetchSaleStatusById('status-2'));

    const { statuses } = store.getState().saleStatus;
    expect(statuses.find((s) => s.id === 'status-2')?.name).toBe('En Proceso (Updated)');
  });

  it('sets error on rejected', async () => {
    const store = makeStore();
    vi.mocked(saleStatusService.getSaleStatusById).mockRejectedValue({
      response: { data: { message: 'Not found' } },
    });

    await store.dispatch(fetchSaleStatusById('non-existent'));

    expect(store.getState().saleStatus.error).toBe('Not found');
  });
});

// ─── createSaleStatus thunk ───────────────────────────────────────────────────

describe('createSaleStatus', () => {
  beforeEach(() => vi.clearAllMocks());

  it('appends new status to list on fulfilled and sorts by order', async () => {
    const store = makeStore();
    // Start with status3 (order 3) in the store
    vi.mocked(saleStatusService.getAllSaleStatuses).mockResolvedValue([mockStatus3]);
    await store.dispatch(fetchSaleStatuses());

    // Create a new status with lower order
    vi.mocked(saleStatusService.createSaleStatus).mockResolvedValue(mockStatus1);
    await store.dispatch(createSaleStatus({ name: 'Inicial', color: '#FFF', order: 1 }));

    const { statuses } = store.getState().saleStatus;
    expect(statuses).toHaveLength(2);
    // Should be sorted: status1 (order 1) before status3 (order 3)
    expect(statuses[0].id).toBe('status-1');
    expect(statuses[1].id).toBe('status-3');
  });

  it('sets error on rejected', async () => {
    const store = makeStore();
    vi.mocked(saleStatusService.createSaleStatus).mockRejectedValue({
      response: { data: { message: 'Duplicate name' } },
    });

    await store.dispatch(createSaleStatus({ name: 'Duplicado', color: '#FFF', order: 99 }));

    expect(store.getState().saleStatus.error).toBe('Duplicate name');
  });
});

// ─── updateSaleStatus thunk ───────────────────────────────────────────────────

describe('updateSaleStatus', () => {
  beforeEach(() => vi.clearAllMocks());

  it('replaces status in list on fulfilled', async () => {
    const store = makeStore();
    vi.mocked(saleStatusService.getAllSaleStatuses).mockResolvedValue([mockStatus1, mockStatus2]);
    await store.dispatch(fetchSaleStatuses());

    const updated = { ...mockStatus2, name: 'Updated Name' };
    vi.mocked(saleStatusService.updateSaleStatus).mockResolvedValue(updated);
    await store.dispatch(updateSaleStatus({ id: 'status-2', data: { name: 'Updated Name' } }));

    const { statuses } = store.getState().saleStatus;
    expect(statuses.find((s) => s.id === 'status-2')?.name).toBe('Updated Name');
  });

  it('sets error on rejected', async () => {
    const store = makeStore();
    vi.mocked(saleStatusService.updateSaleStatus).mockRejectedValue(new Error('DB error'));

    await store.dispatch(updateSaleStatus({ id: 'x', data: { name: 'X' } }));

    expect(store.getState().saleStatus.error).toBe('Error al actualizar estado de venta');
  });
});

// ─── deleteSaleStatus thunk ───────────────────────────────────────────────────

describe('deleteSaleStatus', () => {
  beforeEach(() => vi.clearAllMocks());

  it('removes deleted status from list on fulfilled', async () => {
    const store = makeStore();
    vi.mocked(saleStatusService.getAllSaleStatuses).mockResolvedValue([mockStatus1, mockStatus2]);
    await store.dispatch(fetchSaleStatuses());

    vi.mocked(saleStatusService.deleteSaleStatus).mockResolvedValue(undefined);
    await store.dispatch(deleteSaleStatus('status-1'));

    const { statuses } = store.getState().saleStatus;
    expect(statuses).toHaveLength(1);
    expect(statuses[0].id).toBe('status-2');
  });

  it('sets error on rejected', async () => {
    const store = makeStore();
    vi.mocked(saleStatusService.deleteSaleStatus).mockRejectedValue({
      response: { data: { message: 'Cannot delete system status' } },
    });

    await store.dispatch(deleteSaleStatus('status-1'));

    expect(store.getState().saleStatus.error).toBe('Cannot delete system status');
  });
});

// ─── reorderSaleStatuses thunk ────────────────────────────────────────────────

describe('reorderSaleStatuses', () => {
  beforeEach(() => vi.clearAllMocks());

  it('replaces statuses with server response on fulfilled', async () => {
    const store = makeStore();
    const reordered = [mockStatus2, mockStatus1];
    vi.mocked(saleStatusService.reorderSaleStatuses).mockResolvedValue(reordered);

    await store.dispatch(reorderSaleStatuses({ statuses: [{ id: 'status-2', order: 1 }, { id: 'status-1', order: 2 }] }));

    const { statuses } = store.getState().saleStatus;
    expect(statuses[0].id).toBe('status-2');
    expect(statuses[1].id).toBe('status-1');
  });

  it('sets error on rejected', async () => {
    const store = makeStore();
    vi.mocked(saleStatusService.reorderSaleStatuses).mockRejectedValue(new Error('Network'));

    await store.dispatch(reorderSaleStatuses({ statuses: [] }));

    expect(store.getState().saleStatus.error).toBe('Error al reordenar estados de venta');
  });
});
