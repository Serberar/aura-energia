import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/crmApi', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

vi.mock('@/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), error: vi.fn(), apiError: vi.fn(), userAction: vi.fn() },
}));

import api from '@/api/crmApi';
import {
  getAllSaleStatuses,
  getSaleStatusById,
  createSaleStatus,
  updateSaleStatus,
  deleteSaleStatus,
  reorderSaleStatuses,
} from './saleStatusService';
import type { SaleStatus } from '@/types/sales';

const mockApi = api as any;

const mockStatus: SaleStatus = {
  id: 'status-1',
  name: 'Inicial',
  order: 1,
  color: '#FFFFFF',
  isFinal: false,
  isCancelled: false,
  isSystem: true,
};

describe('saleStatusService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getAllSaleStatuses', () => {
    it('calls GET /sale-status and returns array', async () => {
      mockApi.get.mockResolvedValue({ data: [mockStatus] });

      const result = await getAllSaleStatuses();

      expect(mockApi.get).toHaveBeenCalledWith(expect.stringContaining('/sale-status'));
      expect(result).toEqual([mockStatus]);
    });

    it('throws when API fails', async () => {
      mockApi.get.mockRejectedValue(new Error('Server error'));
      await expect(getAllSaleStatuses()).rejects.toThrow('Server error');
    });
  });

  describe('getSaleStatusById', () => {
    it('calls GET /sale-status/:id and returns status', async () => {
      mockApi.get.mockResolvedValue({ data: mockStatus });

      const result = await getSaleStatusById('status-1');

      expect(mockApi.get).toHaveBeenCalledWith(expect.stringContaining('/sale-status/status-1'));
      expect(result).toEqual(mockStatus);
    });

    it('throws when not found', async () => {
      mockApi.get.mockRejectedValue(new Error('Not found'));
      await expect(getSaleStatusById('non-existent')).rejects.toThrow('Not found');
    });
  });

  describe('createSaleStatus', () => {
    it('calls POST /sale-status with data and returns status', async () => {
      mockApi.post.mockResolvedValue({ data: { status: mockStatus } });

      const result = await createSaleStatus({ name: 'Inicial', color: '#FFFFFF', order: 1 });

      expect(mockApi.post).toHaveBeenCalledWith(
        expect.stringContaining('/sale-status'),
        { name: 'Inicial', color: '#FFFFFF', order: 1 }
      );
      expect(result).toEqual(mockStatus);
    });

    it('throws when API fails', async () => {
      mockApi.post.mockRejectedValue(new Error('Duplicate name'));
      await expect(createSaleStatus({ name: 'Duplicado', color: '#000', order: 99 }))
        .rejects.toThrow('Duplicate name');
    });
  });

  describe('updateSaleStatus', () => {
    it('calls PUT /sale-status/:id with data and returns updated status', async () => {
      const updated = { ...mockStatus, name: 'Actualizado' };
      mockApi.put.mockResolvedValue({ data: { status: updated } });

      const result = await updateSaleStatus('status-1', { name: 'Actualizado' });

      expect(mockApi.put).toHaveBeenCalledWith(
        expect.stringContaining('/sale-status/status-1'),
        { name: 'Actualizado' }
      );
      expect(result.name).toBe('Actualizado');
    });

    it('throws when API fails', async () => {
      mockApi.put.mockRejectedValue(new Error('Not found'));
      await expect(updateSaleStatus('x', { name: 'X' })).rejects.toThrow('Not found');
    });
  });

  describe('deleteSaleStatus', () => {
    it('calls DELETE /sale-status/:id', async () => {
      mockApi.delete.mockResolvedValue({ data: {} });

      await deleteSaleStatus('status-1');

      expect(mockApi.delete).toHaveBeenCalledWith(expect.stringContaining('/sale-status/status-1'));
    });

    it('throws when API fails', async () => {
      mockApi.delete.mockRejectedValue(new Error('Cannot delete system status'));
      await expect(deleteSaleStatus('status-1')).rejects.toThrow('Cannot delete system status');
    });
  });

  describe('reorderSaleStatuses', () => {
    it('calls PATCH /sale-status/reorder with data and returns array', async () => {
      const reordered = [{ ...mockStatus, order: 2 }, { ...mockStatus, id: 'status-2', order: 1 }];
      mockApi.patch.mockResolvedValue({ data: reordered });

      const result = await reorderSaleStatuses({
        statuses: [{ id: 'status-1', order: 2 }, { id: 'status-2', order: 1 }],
      });

      expect(mockApi.patch).toHaveBeenCalledWith(
        expect.stringContaining('/reorder'),
        { statuses: [{ id: 'status-1', order: 2 }, { id: 'status-2', order: 1 }] }
      );
      expect(result).toEqual(reordered);
    });

    it('throws when API fails', async () => {
      mockApi.patch.mockRejectedValue(new Error('Server error'));
      await expect(reorderSaleStatuses({ statuses: [] })).rejects.toThrow('Server error');
    });
  });
});
