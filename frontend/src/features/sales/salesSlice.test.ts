import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

vi.mock('./services/saleService', () => ({
  getAllSales: vi.fn(),
  getSaleById: vi.fn(),
  createSale: vi.fn(),
  addSaleItem: vi.fn(),
  updateSaleItem: vi.fn(),
  removeSaleItem: vi.fn(),
  changeSaleStatus: vi.fn(),
  deleteSale: vi.fn(),
}));

vi.mock('@/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    userAction: vi.fn(),
  },
}));

import salesReducer, {
  selectSale,
  setFilters,
  clearFilters,
  clearError,
  clearSelectedSale,
  resetSalesState,
  fetchSales,
  fetchSaleById,
  createSale,
  addSaleItem,
  updateSaleItem,
  removeSaleItem,
  changeSaleStatus,
  deleteSale,
} from './salesSlice';
import * as saleService from './services/saleService';
import type { Sale } from '@/types/sales';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeStore() {
  const reducerMap: any = { sales: salesReducer };
  return configureStore({ reducer: reducerMap });
}

const mockStatus = {
  id: 'status-1',
  name: 'Inicial',
  order: 1,
  color: '#FFFFFF',
  isFinal: false,
  isCancelled: false,
  isSystem: true,
};

const mockSale1: Sale = {
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

const mockSale2: Sale = {
  id: 'sale-2',
  clientId: 'client-2',
  statusId: 'status-1',
  status: mockStatus,
  totalAmount: 200,
  items: [],
  histories: [],
  assignments: [],
  createdAt: '2024-01-02T00:00:00.000Z',
  updatedAt: '2024-01-02T00:00:00.000Z',
};

// ─── synchronous reducers ─────────────────────────────────────────────────────

describe('salesSlice – synchronous reducers', () => {
  it('initial state is correct', () => {
    const state = salesReducer(undefined, { type: '@@INIT' });
    expect(state.sales).toEqual([]);
    expect(state.selectedSale).toBeNull();
    expect(state.filters).toEqual({});
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.lastFetch).toBeNull();
  });

  it('clearError sets error to null', () => {
    const state = salesReducer(
      { sales: [], selectedSale: null, filters: {}, loading: false, error: 'some error', lastFetch: null },
      clearError()
    );
    expect(state.error).toBeNull();
  });

  it('selectSale sets selectedSale', () => {
    const state = salesReducer(
      { sales: [mockSale1], selectedSale: null, filters: {}, loading: false, error: null, lastFetch: null },
      selectSale(mockSale1)
    );
    expect(state.selectedSale).toEqual(mockSale1);
  });

  it('selectSale with null clears selectedSale', () => {
    const state = salesReducer(
      { sales: [], selectedSale: mockSale1, filters: {}, loading: false, error: null, lastFetch: null },
      selectSale(null)
    );
    expect(state.selectedSale).toBeNull();
  });

  it('clearSelectedSale sets selectedSale to null', () => {
    const state = salesReducer(
      { sales: [], selectedSale: mockSale1, filters: {}, loading: false, error: null, lastFetch: null },
      clearSelectedSale()
    );
    expect(state.selectedSale).toBeNull();
  });

  it('setFilters updates filters', () => {
    const state = salesReducer(
      { sales: [], selectedSale: null, filters: {}, loading: false, error: null, lastFetch: null },
      setFilters({ statusId: 'status-1' })
    );
    expect(state.filters).toEqual({ statusId: 'status-1' });
  });

  it('clearFilters resets filters to empty object', () => {
    const state = salesReducer(
      { sales: [], selectedSale: null, filters: { statusId: 'status-1' }, loading: false, error: null, lastFetch: null },
      clearFilters()
    );
    expect(state.filters).toEqual({});
  });

  it('resetSalesState returns initial state', () => {
    const dirtyState = {
      sales: [mockSale1],
      selectedSale: mockSale1,
      filters: { statusId: 'x' },
      loading: true,
      error: 'error',
      lastFetch: 12345,
    };
    const reset = salesReducer(dirtyState, resetSalesState());
    expect(reset).toEqual({
      sales: [],
      selectedSale: null,
      filters: {},
      loading: false,
      error: null,
      lastFetch: null,
    });
  });
});

// ─── fetchSales thunk ─────────────────────────────────────────────────────────

describe('fetchSales', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sets loading=true while pending', () => {
    const store = makeStore();
    vi.mocked(saleService.getAllSales).mockReturnValue(new Promise(() => {}));
    store.dispatch(fetchSales(undefined));
    expect(store.getState().sales.loading).toBe(true);
    expect(store.getState().sales.error).toBeNull();
  });

  it('sets sales, filters and lastFetch on fulfilled', async () => {
    const store = makeStore();
    const filters = { statusId: 'status-1' };
    vi.mocked(saleService.getAllSales).mockResolvedValue([mockSale1, mockSale2]);

    await store.dispatch(fetchSales(filters));

    const { sales } = store.getState();
    expect(sales.loading).toBe(false);
    expect(sales.sales).toEqual([mockSale1, mockSale2]);
    expect(sales.filters).toEqual(filters);
    expect(sales.lastFetch).not.toBeNull();
  });

  it('sets empty filters when no filters provided', async () => {
    const store = makeStore();
    vi.mocked(saleService.getAllSales).mockResolvedValue([mockSale1]);

    await store.dispatch(fetchSales(undefined));

    expect(store.getState().sales.filters).toEqual({});
  });

  it('sets error on rejected with server message', async () => {
    const store = makeStore();
    vi.mocked(saleService.getAllSales).mockRejectedValue({
      response: { data: { message: 'Server error' } },
    });

    await store.dispatch(fetchSales(undefined));

    expect(store.getState().sales.error).toBe('Server error');
  });

  it('uses default error message when no server message', async () => {
    const store = makeStore();
    vi.mocked(saleService.getAllSales).mockRejectedValue(new Error('Network error'));

    await store.dispatch(fetchSales(undefined));

    expect(store.getState().sales.error).toBe('Error al obtener ventas');
  });
});

// ─── fetchSaleById thunk ──────────────────────────────────────────────────────

describe('fetchSaleById', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sets selectedSale on fulfilled', async () => {
    const store = makeStore();
    vi.mocked(saleService.getSaleById).mockResolvedValue(mockSale1);

    await store.dispatch(fetchSaleById('sale-1'));

    const { sales } = store.getState();
    expect(sales.loading).toBe(false);
    expect(sales.selectedSale).toEqual(mockSale1);
  });

  it('updates sale in list when already present', async () => {
    const store = makeStore();
    vi.mocked(saleService.getAllSales).mockResolvedValue([mockSale1, mockSale2]);
    await store.dispatch(fetchSales(undefined));

    const updatedSale = { ...mockSale1, totalAmount: 150 };
    vi.mocked(saleService.getSaleById).mockResolvedValue(updatedSale);
    await store.dispatch(fetchSaleById('sale-1'));

    const { sales } = store.getState().sales;
    expect(sales.find((s) => s.id === 'sale-1')?.totalAmount).toBe(150);
  });

  it('sets error on rejected with server message', async () => {
    const store = makeStore();
    vi.mocked(saleService.getSaleById).mockRejectedValue({
      response: { data: { message: 'Not found' } },
    });

    await store.dispatch(fetchSaleById('non-existent'));

    expect(store.getState().sales.error).toBe('Not found');
  });

  it('uses default error message when no server message', async () => {
    const store = makeStore();
    vi.mocked(saleService.getSaleById).mockRejectedValue(new Error('Network'));

    await store.dispatch(fetchSaleById('sale-1'));

    expect(store.getState().sales.error).toBe('Error al obtener venta');
  });
});

// ─── createSale thunk ─────────────────────────────────────────────────────────

describe('createSale', () => {
  beforeEach(() => vi.clearAllMocks());

  it('prepends new sale and sets selectedSale on fulfilled', async () => {
    const store = makeStore();
    vi.mocked(saleService.getAllSales).mockResolvedValue([mockSale2]);
    await store.dispatch(fetchSales(undefined));

    vi.mocked(saleService.createSale).mockResolvedValue(mockSale1);
    await store.dispatch(createSale({ clientId: 'client-1', statusId: 'status-1' }));

    const { sales } = store.getState();
    expect(sales.sales).toHaveLength(2);
    expect(sales.sales[0].id).toBe('sale-1'); // unshift
    expect(sales.selectedSale?.id).toBe('sale-1');
    expect(sales.loading).toBe(false);
  });

  it('sets error on rejected with server message', async () => {
    const store = makeStore();
    vi.mocked(saleService.createSale).mockRejectedValue({
      response: { data: { message: 'Client not found' } },
    });

    await store.dispatch(createSale({ clientId: 'x', statusId: 'y' }));

    expect(store.getState().sales.error).toBe('Client not found');
  });

  it('uses default error message when no server message', async () => {
    const store = makeStore();
    vi.mocked(saleService.createSale).mockRejectedValue(new Error('Network'));

    await store.dispatch(createSale({ clientId: 'x', statusId: 'y' }));

    expect(store.getState().sales.error).toBe('Error al crear venta');
  });
});

// ─── addSaleItem thunk ────────────────────────────────────────────────────────

describe('addSaleItem', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updates sale in list and selectedSale on fulfilled', async () => {
    const store = makeStore();
    vi.mocked(saleService.getAllSales).mockResolvedValue([mockSale1]);
    await store.dispatch(fetchSales(undefined));
    store.dispatch(selectSale(mockSale1));

    const updatedSale = { ...mockSale1, totalAmount: 150, items: [{ id: 'item-1' } as any] };
    vi.mocked(saleService.addSaleItem).mockResolvedValue(updatedSale);
    await store.dispatch(addSaleItem({ saleId: 'sale-1', itemData: { name: 'Item', quantity: 1, unitPrice: 50, productId: 'p1' } }));

    const { sales } = store.getState();
    expect(sales.sales[0].totalAmount).toBe(150);
    expect(sales.selectedSale?.totalAmount).toBe(150);
  });

  it('sets error on rejected', async () => {
    const store = makeStore();
    vi.mocked(saleService.addSaleItem).mockRejectedValue({
      response: { data: { message: 'Product not found' } },
    });

    await store.dispatch(addSaleItem({ saleId: 'sale-1', itemData: { name: 'Item', quantity: 1, unitPrice: 10, productId: 'x' } }));

    expect(store.getState().sales.error).toBe('Product not found');
  });

  it('uses default error message when no server message', async () => {
    const store = makeStore();
    vi.mocked(saleService.addSaleItem).mockRejectedValue(new Error('Network'));

    await store.dispatch(addSaleItem({ saleId: 'sale-1', itemData: { name: 'Item', quantity: 1, unitPrice: 10, productId: 'x' } }));

    expect(store.getState().sales.error).toBe('Error al añadir item');
  });
});

// ─── updateSaleItem thunk ─────────────────────────────────────────────────────

describe('updateSaleItem', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updates sale in list and selectedSale on fulfilled', async () => {
    const store = makeStore();
    vi.mocked(saleService.getAllSales).mockResolvedValue([mockSale1]);
    await store.dispatch(fetchSales(undefined));
    store.dispatch(selectSale(mockSale1));

    const updatedSale = { ...mockSale1, totalAmount: 200 };
    vi.mocked(saleService.updateSaleItem).mockResolvedValue(updatedSale);
    await store.dispatch(updateSaleItem({ saleId: 'sale-1', itemId: 'item-1', itemData: { quantity: 2 } }));

    const { sales } = store.getState();
    expect(sales.sales[0].totalAmount).toBe(200);
    expect(sales.selectedSale?.totalAmount).toBe(200);
  });

  it('sets error on rejected', async () => {
    const store = makeStore();
    vi.mocked(saleService.updateSaleItem).mockRejectedValue({
      response: { data: { message: 'Item not found' } },
    });

    await store.dispatch(updateSaleItem({ saleId: 'sale-1', itemId: 'item-1', itemData: {} }));

    expect(store.getState().sales.error).toBe('Item not found');
  });

  it('uses default error message when no server message', async () => {
    const store = makeStore();
    vi.mocked(saleService.updateSaleItem).mockRejectedValue(new Error('Network'));

    await store.dispatch(updateSaleItem({ saleId: 'sale-1', itemId: 'item-1', itemData: {} }));

    expect(store.getState().sales.error).toBe('Error al actualizar item');
  });
});

// ─── removeSaleItem thunk ─────────────────────────────────────────────────────

describe('removeSaleItem', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updates sale in list and selectedSale on fulfilled', async () => {
    const store = makeStore();
    vi.mocked(saleService.getAllSales).mockResolvedValue([mockSale1]);
    await store.dispatch(fetchSales(undefined));
    store.dispatch(selectSale(mockSale1));

    const updatedSale = { ...mockSale1, items: [], totalAmount: 0 };
    vi.mocked(saleService.removeSaleItem).mockResolvedValue(updatedSale);
    await store.dispatch(removeSaleItem({ saleId: 'sale-1', itemId: 'item-1' }));

    const { sales } = store.getState();
    expect(sales.sales[0].items).toEqual([]);
    expect(sales.selectedSale?.items).toEqual([]);
  });

  it('sets error on rejected', async () => {
    const store = makeStore();
    vi.mocked(saleService.removeSaleItem).mockRejectedValue({
      response: { data: { message: 'Item not found' } },
    });

    await store.dispatch(removeSaleItem({ saleId: 'sale-1', itemId: 'item-1' }));

    expect(store.getState().sales.error).toBe('Item not found');
  });

  it('uses default error message when no server message', async () => {
    const store = makeStore();
    vi.mocked(saleService.removeSaleItem).mockRejectedValue(new Error('Network'));

    await store.dispatch(removeSaleItem({ saleId: 'sale-1', itemId: 'item-1' }));

    expect(store.getState().sales.error).toBe('Error al eliminar item');
  });
});

// ─── changeSaleStatus thunk ───────────────────────────────────────────────────

describe('changeSaleStatus', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updates sale in list and selectedSale on fulfilled', async () => {
    const store = makeStore();
    vi.mocked(saleService.getAllSales).mockResolvedValue([mockSale1]);
    await store.dispatch(fetchSales(undefined));
    store.dispatch(selectSale(mockSale1));

    const newStatus = { ...mockStatus, id: 'status-2', name: 'En Proceso' };
    const updatedSale = { ...mockSale1, statusId: 'status-2', status: newStatus };
    vi.mocked(saleService.changeSaleStatus).mockResolvedValue(updatedSale);
    await store.dispatch(changeSaleStatus({ saleId: 'sale-1', statusData: { statusId: 'status-2' } }));

    const { sales } = store.getState();
    expect(sales.sales[0].statusId).toBe('status-2');
    expect(sales.selectedSale?.statusId).toBe('status-2');
  });

  it('sets error on rejected', async () => {
    const store = makeStore();
    vi.mocked(saleService.changeSaleStatus).mockRejectedValue({
      response: { data: { message: 'Invalid status transition' } },
    });

    await store.dispatch(changeSaleStatus({ saleId: 'sale-1', statusData: { statusId: 'x' } }));

    expect(store.getState().sales.error).toBe('Invalid status transition');
  });

  it('uses default error message when no server message', async () => {
    const store = makeStore();
    vi.mocked(saleService.changeSaleStatus).mockRejectedValue(new Error('Network'));

    await store.dispatch(changeSaleStatus({ saleId: 'sale-1', statusData: { statusId: 'x' } }));

    expect(store.getState().sales.error).toBe('Error al cambiar estado');
  });
});

// ─── deleteSale thunk ─────────────────────────────────────────────────────────

describe('deleteSale', () => {
  beforeEach(() => vi.clearAllMocks());

  it('removes sale from list on fulfilled', async () => {
    const store = makeStore();
    vi.mocked(saleService.getAllSales).mockResolvedValue([mockSale1, mockSale2]);
    await store.dispatch(fetchSales(undefined));

    vi.mocked(saleService.deleteSale).mockResolvedValue(undefined);
    await store.dispatch(deleteSale('sale-1'));

    const { sales } = store.getState().sales;
    expect(sales).toHaveLength(1);
    expect(sales[0].id).toBe('sale-2');
  });

  it('clears selectedSale when deleted sale was selected', async () => {
    const store = makeStore();
    vi.mocked(saleService.getAllSales).mockResolvedValue([mockSale1, mockSale2]);
    await store.dispatch(fetchSales(undefined));
    store.dispatch(selectSale(mockSale1));

    vi.mocked(saleService.deleteSale).mockResolvedValue(undefined);
    await store.dispatch(deleteSale('sale-1'));

    expect(store.getState().sales.selectedSale).toBeNull();
  });

  it('does not clear selectedSale when a different sale is deleted', async () => {
    const store = makeStore();
    vi.mocked(saleService.getAllSales).mockResolvedValue([mockSale1, mockSale2]);
    await store.dispatch(fetchSales(undefined));
    store.dispatch(selectSale(mockSale1));

    vi.mocked(saleService.deleteSale).mockResolvedValue(undefined);
    await store.dispatch(deleteSale('sale-2'));

    expect(store.getState().sales.selectedSale?.id).toBe('sale-1');
  });

  it('sets error on rejected with server message', async () => {
    const store = makeStore();
    vi.mocked(saleService.deleteSale).mockRejectedValue({
      response: { data: { message: 'Cannot delete closed sale' } },
    });

    await store.dispatch(deleteSale('sale-1'));

    expect(store.getState().sales.error).toBe('Cannot delete closed sale');
  });

  it('uses default error message when no server message', async () => {
    const store = makeStore();
    vi.mocked(saleService.deleteSale).mockRejectedValue(new Error('Network'));

    await store.dispatch(deleteSale('sale-1'));

    expect(store.getState().sales.error).toBe('Error al eliminar venta');
  });
});
