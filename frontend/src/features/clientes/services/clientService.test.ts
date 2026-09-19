import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/crmApi', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}));

vi.mock('@/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), error: vi.fn(), apiError: vi.fn(), userAction: vi.fn() },
}));

import api from '@/api/crmApi';
import {
  searchClient,
  getClientById,
  createClient,
  updateClient,
  pushClientData,
} from './clientService';
import type { Client } from '@/types/sales';

const mockApi = api as any;

const mockClient: Client = {
  id: 'client-1',
  firstName: 'María',
  lastName: 'González',
  dni: '12345678A',
  email: 'maria@example.com',
  phones: ['600000001'],
  addresses: [{ address: 'Calle Mayor 1', cupsGas: '', cupsLuz: '' }],
  bankAccounts: [],
  comments: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('clientService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('searchClient', () => {
    it('calls GET /clients/:value and returns single client normalized', async () => {
      mockApi.get.mockResolvedValue({ data: mockClient });

      const result = await searchClient('client-1');

      expect(mockApi.get).toHaveBeenCalledWith('/clients/client-1', expect.any(Object));
      expect((result as Client).id).toBe('client-1');
    });

    it('returns array of clients when backend returns array', async () => {
      mockApi.get.mockResolvedValue({ data: [mockClient, { ...mockClient, id: 'client-2' }] });

      const result = await searchClient('12345678A');

      expect(Array.isArray(result)).toBe(true);
      expect((result as Client[]).length).toBe(2);
    });

    it('normalizes address strings to AddressInfo objects', async () => {
      const clientWithStringAddr = { ...mockClient, addresses: ['Calle Mayor 1'] as any };
      mockApi.get.mockResolvedValue({ data: clientWithStringAddr });

      const result = await searchClient('client-1') as Client;

      expect(result.addresses[0]).toEqual({ address: 'Calle Mayor 1', cupsGas: '', cupsLuz: '' });
    });

    it('converts CanceledError to AbortError', async () => {
      const canceledError = new Error('Request canceled');
      canceledError.name = 'CanceledError';
      mockApi.get.mockRejectedValue(canceledError);

      await expect(searchClient('test')).rejects.toMatchObject({ name: 'AbortError' });
    });

    it('throws non-cancel errors', async () => {
      mockApi.get.mockRejectedValue(new Error('Server error'));
      await expect(searchClient('12345678A')).rejects.toThrow('Server error');
    });

    it('supports AbortSignal option', async () => {
      const controller = new AbortController();
      mockApi.get.mockResolvedValue({ data: mockClient });

      await searchClient('client-1', controller.signal);

      expect(mockApi.get).toHaveBeenCalledWith(
        '/clients/client-1',
        { signal: controller.signal }
      );
    });
  });

  describe('getClientById', () => {
    it('calls GET /clients/:id and returns normalized client', async () => {
      mockApi.get.mockResolvedValue({ data: mockClient });

      const result = await getClientById('client-1');

      expect(mockApi.get).toHaveBeenCalledWith('/clients/client-1');
      expect(result.id).toBe('client-1');
    });

    it('normalizes string addresses', async () => {
      const withStringAddr = { ...mockClient, addresses: ['Mi calle'] as any };
      mockApi.get.mockResolvedValue({ data: withStringAddr });

      const result = await getClientById('client-1');

      expect(result.addresses[0]).toHaveProperty('address', 'Mi calle');
    });

    it('throws when not found', async () => {
      mockApi.get.mockRejectedValue(new Error('Not found'));
      await expect(getClientById('non-existent')).rejects.toThrow('Not found');
    });
  });

  describe('createClient', () => {
    it('calls POST /clients with data and returns client from response.data.client', async () => {
      mockApi.post.mockResolvedValue({ data: { client: mockClient } });

      const result = await createClient({
        firstName: 'María',
        lastName: 'González',
        dni: '12345678A',
        phones: ['600000001'],
        addresses: [{ address: 'Calle Mayor 1', cupsGas: '', cupsLuz: '' }],
        bankAccounts: [],
      });

      expect(mockApi.post).toHaveBeenCalledWith('/clients', expect.any(Object));
      expect(result.id).toBe('client-1');
    });

    it('throws when API fails', async () => {
      mockApi.post.mockRejectedValue(new Error('Duplicate DNI'));
      await expect(
        createClient({ firstName: 'X', lastName: 'Y', dni: '12345678A', phones: [], addresses: [], bankAccounts: [] })
      ).rejects.toThrow('Duplicate DNI');
    });
  });

  describe('updateClient', () => {
    it('calls PUT /clients/:id and returns normalized updated client', async () => {
      const updated = { ...mockClient, email: 'new@example.com' };
      mockApi.put.mockResolvedValue({ data: { client: updated } });

      const result = await updateClient('client-1', { email: 'new@example.com' });

      expect(mockApi.put).toHaveBeenCalledWith('/clients/client-1', { email: 'new@example.com' });
      expect(result.email).toBe('new@example.com');
    });

    it('throws when API fails', async () => {
      mockApi.put.mockRejectedValue(new Error('Not found'));
      await expect(updateClient('x', {})).rejects.toThrow('Not found');
    });
  });

  describe('pushClientData', () => {
    it('calls POST /clients/:id/push with data and returns normalized client', async () => {
      mockApi.post.mockResolvedValue({ data: { client: mockClient } });

      const result = await pushClientData('client-1', { field: 'phones', value: '600000002' });

      expect(mockApi.post).toHaveBeenCalledWith(
        '/clients/client-1/push',
        { field: 'phones', value: '600000002' }
      );
      expect(result.id).toBe('client-1');
    });

    it('throws when API fails', async () => {
      mockApi.post.mockRejectedValue(new Error('Not found'));
      await expect(pushClientData('x', { field: 'phones', value: '123' })).rejects.toThrow('Not found');
    });
  });
});
