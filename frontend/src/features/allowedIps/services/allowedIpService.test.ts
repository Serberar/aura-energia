import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

vi.mock('@/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), error: vi.fn(), apiError: vi.fn(), userAction: vi.fn() },
}));

import api from '@/api/axios';
import {
  getAllAllowedIps,
  createAllowedIp,
  deleteAllowedIp,
  getIpFilterMode,
  setIpFilterMode,
  getMyIp,
} from './allowedIpService';

const mockApi = api as any;

const mockIp = { id: 'ip-1', ip: '192.168.1.10', description: 'Oficina', createdAt: '2024-01-01T00:00:00.000Z' };

describe('allowedIpService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getAllAllowedIps', () => {
    it('calls GET /allowed-ips and returns array', async () => {
      mockApi.get.mockResolvedValue({ data: [mockIp] });

      const result = await getAllAllowedIps();

      expect(mockApi.get).toHaveBeenCalledWith(expect.stringContaining('/allowed-ips'));
      expect(result).toEqual([mockIp]);
    });

    it('returns empty array when no IPs', async () => {
      mockApi.get.mockResolvedValue({ data: [] });
      expect(await getAllAllowedIps()).toEqual([]);
    });

    it('throws when API fails', async () => {
      mockApi.get.mockRejectedValue(new Error('Network error'));
      await expect(getAllAllowedIps()).rejects.toThrow('Network error');
    });
  });

  describe('createAllowedIp', () => {
    it('calls POST /allowed-ips with data and returns allowedIp', async () => {
      mockApi.post.mockResolvedValue({ data: { message: 'Created', allowedIp: mockIp } });

      const result = await createAllowedIp({ ip: '192.168.1.10', description: 'Oficina' });

      expect(mockApi.post).toHaveBeenCalledWith(
        expect.stringContaining('/allowed-ips'),
        { ip: '192.168.1.10', description: 'Oficina' }
      );
      expect(result).toEqual(mockIp);
    });

    it('works without description', async () => {
      mockApi.post.mockResolvedValue({ data: { message: 'Created', allowedIp: { ...mockIp, description: null } } });

      const result = await createAllowedIp({ ip: '10.0.0.1' });

      expect(result.description).toBeNull();
    });

    it('throws when API fails', async () => {
      mockApi.post.mockRejectedValue(new Error('Duplicate IP'));
      await expect(createAllowedIp({ ip: '192.168.1.1' })).rejects.toThrow('Duplicate IP');
    });
  });

  describe('deleteAllowedIp', () => {
    it('calls DELETE /allowed-ips/:id', async () => {
      mockApi.delete.mockResolvedValue({ data: {} });

      await deleteAllowedIp('ip-1');

      expect(mockApi.delete).toHaveBeenCalledWith(expect.stringContaining('/allowed-ips/ip-1'));
    });

    it('throws when API fails', async () => {
      mockApi.delete.mockRejectedValue(new Error('Not found'));
      await expect(deleteAllowedIp('ip-999')).rejects.toThrow('Not found');
    });
  });

  describe('getIpFilterMode', () => {
    const filterMode = { filteringEnabled: true, allowAll: false };

    it('calls GET /allowed-ips/filter-mode and returns mode', async () => {
      mockApi.get.mockResolvedValue({ data: filterMode });

      const result = await getIpFilterMode();

      expect(mockApi.get).toHaveBeenCalledWith(expect.stringContaining('/filter-mode'));
      expect(result).toEqual(filterMode);
    });

    it('throws when API fails', async () => {
      mockApi.get.mockRejectedValue(new Error('Unauthorized'));
      await expect(getIpFilterMode()).rejects.toThrow('Unauthorized');
    });
  });

  describe('setIpFilterMode', () => {
    it('calls PUT /allowed-ips/filter-mode with patch', async () => {
      mockApi.put.mockResolvedValue({ data: {} });

      await setIpFilterMode({ filteringEnabled: true });

      expect(mockApi.put).toHaveBeenCalledWith(
        expect.stringContaining('/filter-mode'),
        { filteringEnabled: true }
      );
    });

    it('throws when API fails', async () => {
      mockApi.put.mockRejectedValue(new Error('Server error'));
      await expect(setIpFilterMode({ allowAll: false })).rejects.toThrow('Server error');
    });
  });

  describe('getMyIp', () => {
    const myIpInfo = { ip: '1.2.3.4', isWhitelisted: true, isPrivate: false, alwaysAllowed: false };

    it('calls GET /allowed-ips/my-ip and returns info', async () => {
      mockApi.get.mockResolvedValue({ data: myIpInfo });

      const result = await getMyIp();

      expect(mockApi.get).toHaveBeenCalledWith(expect.stringContaining('/my-ip'));
      expect(result).toEqual(myIpInfo);
    });

    it('handles null ip', async () => {
      mockApi.get.mockResolvedValue({ data: { ip: null, isWhitelisted: false, isPrivate: true, alwaysAllowed: true } });
      const result = await getMyIp();
      expect(result.ip).toBeNull();
    });

    it('throws when API fails', async () => {
      mockApi.get.mockRejectedValue(new Error('Network error'));
      await expect(getMyIp()).rejects.toThrow('Network error');
    });
  });
});
