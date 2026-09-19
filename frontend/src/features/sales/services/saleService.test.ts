import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/crmApi', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

vi.mock('@/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), error: vi.fn(), apiError: vi.fn(), userAction: vi.fn() },
}));

vi.mock('@/features/clientes/services/clientService', () => ({
  createClient: vi.fn(),
}));

import api from '@/api/crmApi';
import { createClient } from '@/features/clientes/services/clientService';
import {
  getAllSales,
  getSaleById,
  createSale,
  addSaleItem,
  updateSaleItem,
  removeSaleItem,
  changeSaleStatus,
  deleteSale,
  getSalesStats,
  getComerciales,
} from './saleService';
import type { Sale, SaleFilters } from '@/types/sales';

const mockApi = api as any;
const mockCreateClient = createClient as ReturnType<typeof vi.fn>;

const mockStatus = {
  id: 'status-1', name: 'Inicial', order: 1, color: '#FFF',
  isFinal: false, isCancelled: false, isSystem: true,
};

const mockSale: Sale = {
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

describe('saleService', () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── getAllSales ─────────────────────────────────────────────────────────────

  describe('getAllSales', () => {
    it('calls GET /sales without params when no filters', async () => {
      mockApi.get.mockResolvedValue({ data: [mockSale] });

      const result = await getAllSales();

      expect(mockApi.get).toHaveBeenCalledWith(expect.stringContaining('/sales'));
      expect(result).toEqual([mockSale]);
    });

    it('appends filter params to URL', async () => {
      mockApi.get.mockResolvedValue({ data: [] });
      const filters: SaleFilters = { statusId: 'status-1', clientId: 'client-1' };

      await getAllSales(filters);

      const calledUrl: string = mockApi.get.mock.calls[0][0];
      expect(calledUrl).toContain('statusId=status-1');
      expect(calledUrl).toContain('clientId=client-1');
    });

    it('appends numeric filters correctly', async () => {
      mockApi.get.mockResolvedValue({ data: [] });
      await getAllSales({ minTotal: 100, maxTotal: 500 });

      const calledUrl: string = mockApi.get.mock.calls[0][0];
      expect(calledUrl).toContain('minTotal=100');
      expect(calledUrl).toContain('maxTotal=500');
    });

    it('throws when API fails', async () => {
      mockApi.get.mockRejectedValue(new Error('Server error'));
      await expect(getAllSales()).rejects.toThrow('Server error');
    });
  });

  // ─── getSaleById ─────────────────────────────────────────────────────────────

  describe('getSaleById', () => {
    it('calls GET /sales/:id and returns sale', async () => {
      mockApi.get.mockResolvedValue({ data: mockSale });

      const result = await getSaleById('sale-1');

      expect(mockApi.get).toHaveBeenCalledWith(expect.stringContaining('/sales/sale-1'));
      expect(result).toEqual(mockSale);
    });

    it('throws when not found', async () => {
      mockApi.get.mockRejectedValue(new Error('Not found'));
      await expect(getSaleById('non-existent')).rejects.toThrow('Not found');
    });
  });

  // ─── createSale ──────────────────────────────────────────────────────────────

  describe('createSale', () => {
    const saleDataWithClientId = {
      client: {
        id: 'client-1',
        firstName: 'María',
        lastName: 'González',
        dni: '12345678A',
        phones: ['600000001'],
        bankAccounts: [],
        address: { address: 'Calle Mayor 1', cupsGas: '', cupsLuz: '' },
      },
      items: [{ productId: 'prod-1', name: 'Seguro', quantity: 1, price: 100 }],
      comercial: 'comercial@example.com',
      statusId: 'status-1',
    };

    it('calls POST /sales when client has id and returns sale from data.sale', async () => {
      mockApi.post.mockResolvedValue({ data: { sale: mockSale } });

      const result = await createSale(saleDataWithClientId as any);

      expect(mockApi.post).toHaveBeenCalledWith(
        expect.stringContaining('/sales'),
        expect.any(Object)
      );
      expect(result).toEqual(mockSale);
      expect(mockCreateClient).not.toHaveBeenCalled();
    });

    it('creates client first when client has no id', async () => {
      const newClient = { ...saleDataWithClientId.client, id: 'new-client-id' };
      mockCreateClient.mockResolvedValue(newClient);
      mockApi.post.mockResolvedValue({ data: { sale: mockSale } });

      const dataWithoutId = {
        ...saleDataWithClientId,
        client: { ...saleDataWithClientId.client, id: undefined },
      };

      await createSale(dataWithoutId as any);

      expect(mockCreateClient).toHaveBeenCalledTimes(1);
      // The POST to /sales should include the new client's id
      const postedBody = mockApi.post.mock.calls[0][1];
      expect(postedBody.client.id).toBe('new-client-id');
    });

    it('throws when API fails', async () => {
      mockApi.post.mockRejectedValue(new Error('Client not found'));
      await expect(createSale(saleDataWithClientId as any)).rejects.toThrow('Client not found');
    });
  });

  // ─── addSaleItem ─────────────────────────────────────────────────────────────

  describe('addSaleItem', () => {
    it('calls POST /sales/:id/items and returns sale', async () => {
      mockApi.post.mockResolvedValue({ data: { sale: mockSale } });

      const result = await addSaleItem('sale-1', {
        name: 'Seguro', quantity: 1, price: 100, productId: 'prod-1',
      });

      expect(mockApi.post).toHaveBeenCalledWith(
        expect.stringContaining('/sales/sale-1/items'),
        expect.any(Object)
      );
      expect(result).toEqual(mockSale);
    });

    it('throws when API fails', async () => {
      mockApi.post.mockRejectedValue(new Error('Product not found'));
      await expect(
        addSaleItem('sale-1', { name: 'X', quantity: 1, price: 10, productId: 'x' })
      ).rejects.toThrow('Product not found');
    });
  });

  // ─── updateSaleItem ──────────────────────────────────────────────────────────

  describe('updateSaleItem', () => {
    it('calls PUT /sales/:saleId/items/:itemId and returns sale', async () => {
      const updatedSale = { ...mockSale, totalAmount: 200 };
      mockApi.put.mockResolvedValue({ data: { sale: updatedSale } });

      const result = await updateSaleItem('sale-1', 'item-1', { quantity: 2 });

      expect(mockApi.put).toHaveBeenCalledWith(
        expect.stringContaining('/sales/sale-1/items/item-1'),
        { quantity: 2 }
      );
      expect(result.totalAmount).toBe(200);
    });

    it('throws when API fails', async () => {
      mockApi.put.mockRejectedValue(new Error('Item not found'));
      await expect(updateSaleItem('sale-1', 'item-1', {})).rejects.toThrow('Item not found');
    });
  });

  // ─── removeSaleItem ──────────────────────────────────────────────────────────

  describe('removeSaleItem', () => {
    it('calls DELETE /sales/:saleId/items/:itemId and returns sale', async () => {
      const updatedSale = { ...mockSale, items: [] };
      mockApi.delete.mockResolvedValue({ data: { sale: updatedSale } });

      const result = await removeSaleItem('sale-1', 'item-1');

      expect(mockApi.delete).toHaveBeenCalledWith(
        expect.stringContaining('/sales/sale-1/items/item-1')
      );
      expect(result.items).toEqual([]);
    });

    it('throws when API fails', async () => {
      mockApi.delete.mockRejectedValue(new Error('Item not found'));
      await expect(removeSaleItem('sale-1', 'item-1')).rejects.toThrow('Item not found');
    });
  });

  // ─── changeSaleStatus ────────────────────────────────────────────────────────

  describe('changeSaleStatus', () => {
    it('calls PATCH /sales/:id/status with statusData and returns sale', async () => {
      const updatedSale = { ...mockSale, statusId: 'status-2' };
      mockApi.patch.mockResolvedValue({ data: { sale: updatedSale } });

      const result = await changeSaleStatus('sale-1', { statusId: 'status-2' });

      expect(mockApi.patch).toHaveBeenCalledWith(
        expect.stringContaining('/sales/sale-1/status'),
        { statusId: 'status-2' }
      );
      expect(result.statusId).toBe('status-2');
    });

    it('throws when API fails', async () => {
      mockApi.patch.mockRejectedValue(new Error('Invalid transition'));
      await expect(changeSaleStatus('sale-1', { statusId: 'x' })).rejects.toThrow('Invalid transition');
    });
  });

  // ─── deleteSale ──────────────────────────────────────────────────────────────

  describe('deleteSale', () => {
    it('calls DELETE /sales/:id', async () => {
      mockApi.delete.mockResolvedValue({ data: {} });

      await deleteSale('sale-1');

      expect(mockApi.delete).toHaveBeenCalledWith(expect.stringContaining('/sales/sale-1'));
    });

    it('throws when API fails', async () => {
      mockApi.delete.mockRejectedValue(new Error('Not found'));
      await expect(deleteSale('sale-1')).rejects.toThrow('Not found');
    });
  });

  // ─── getSalesStats ───────────────────────────────────────────────────────────

  describe('getSalesStats', () => {
    it('calls GET /sales/stats and returns stats', async () => {
      const stats = { totalSales: 10, totalAmount: 5000, byStatus: [] };
      mockApi.get.mockResolvedValue({ data: stats });

      const result = await getSalesStats();

      expect(mockApi.get).toHaveBeenCalledWith(expect.stringContaining('/sales/stats'));
      expect(result).toEqual(stats);
    });

    it('throws when API fails', async () => {
      mockApi.get.mockRejectedValue(new Error('Server error'));
      await expect(getSalesStats()).rejects.toThrow('Server error');
    });
  });

  // ─── getComerciales ──────────────────────────────────────────────────────────

  describe('getComerciales', () => {
    it('calls GET /sales/comerciales and returns string array', async () => {
      mockApi.get.mockResolvedValue({ data: ['comercial1', 'comercial2'] });

      const result = await getComerciales();

      expect(mockApi.get).toHaveBeenCalledWith(expect.stringContaining('/sales/comerciales'));
      expect(result).toEqual(['comercial1', 'comercial2']);
    });

    it('throws when API fails', async () => {
      mockApi.get.mockRejectedValue(new Error('Server error'));
      await expect(getComerciales()).rejects.toThrow('Server error');
    });
  });
});
