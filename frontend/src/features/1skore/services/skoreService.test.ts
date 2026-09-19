import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/crmApi', () => ({
  default: { post: vi.fn() },
}));

import crmApi from '@/api/crmApi';
import { login1Skore, search1Skore } from './skoreService';

const mockApi = crmApi as unknown as { post: ReturnType<typeof vi.fn> };

describe('skoreService', () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── login1Skore ─────────────────────────────────────────────────────────────

  describe('login1Skore', () => {
    it('calls POST /skore/login with no body', async () => {
      mockApi.post.mockResolvedValue({ data: { sessionId: 'sess-abc' } });

      await login1Skore();

      expect(mockApi.post).toHaveBeenCalledWith('/skore/login');
    });

    it('returns the sessionId as cookie', async () => {
      mockApi.post.mockResolvedValue({ data: { sessionId: 'sess-abc' } });

      const result = await login1Skore();

      expect(result.cookie).toBe('sess-abc');
    });

    it('throws when API fails', async () => {
      mockApi.post.mockRejectedValue(new Error('Connection refused'));
      await expect(login1Skore()).rejects.toThrow('Connection refused');
    });
  });

  // ─── search1Skore ────────────────────────────────────────────────────────────

  describe('search1Skore — type=dni', () => {
    const mockResponse = { success: 1, msg: 'Found' };

    it('calls POST /skore/search with sessionId and ws_document params for NIF', async () => {
      mockApi.post.mockResolvedValue({ data: mockResponse });

      await search1Skore('dni', '12345678A', 'session-abc');

      expect(mockApi.post).toHaveBeenCalledWith('/skore/search', {
        sessionId: 'session-abc',
        params: {
          method: 'execute_wese',
          'data[WS]': 'ws_document',
          'data[PARAMS][0][]': ['param_p_document', '12345678A'],
          'data[PARAMS][1][]': ['param_p_type', 'nif'],
        },
      });
    });

    it('normalizes DNI to uppercase', async () => {
      mockApi.post.mockResolvedValue({ data: mockResponse });

      await search1Skore('dni', '12345678a', 'session-abc');

      const body = mockApi.post.mock.calls[0][1];
      expect(body.params['data[PARAMS][0][]']).toEqual(['param_p_document', '12345678A']);
    });

    it('detects NIE (starts with X, Y or Z)', async () => {
      mockApi.post.mockResolvedValue({ data: mockResponse });

      await search1Skore('dni', 'X1234567A', 'session-abc');

      const body = mockApi.post.mock.calls[0][1];
      expect(body.params['data[PARAMS][1][]']).toEqual(['param_p_type', 'nie']);
    });

    it('detects CIF (starts with company letter)', async () => {
      mockApi.post.mockResolvedValue({ data: mockResponse });

      await search1Skore('dni', 'B12345678', 'session-abc');

      const body = mockApi.post.mock.calls[0][1];
      expect(body.params['data[PARAMS][1][]']).toEqual(['param_p_type', 'cif']);
    });

    it('sends sessionId in the request body', async () => {
      mockApi.post.mockResolvedValue({ data: mockResponse });

      await search1Skore('dni', '12345678A', 'my-session-id');

      const body = mockApi.post.mock.calls[0][1];
      expect(body.sessionId).toBe('my-session-id');
    });

    it('returns response data', async () => {
      mockApi.post.mockResolvedValue({ data: mockResponse });

      const result = await search1Skore('dni', '12345678A', 'session-abc');

      expect(result).toEqual(mockResponse);
    });
  });

  describe('search1Skore — type=phone', () => {
    it('calls POST with phone params for ws_msisdn', async () => {
      mockApi.post.mockResolvedValue({ data: { success: 1 } });

      await search1Skore('phone', '612345678', 'session-abc');

      const body = mockApi.post.mock.calls[0][1];
      expect(body.params['data[WS]']).toBe('ws_msisdn');
      expect(body.params['data[PARAMS][0][]']).toEqual(['param_p_phone', '612345678']);
    });

    it('throws when API fails', async () => {
      mockApi.post.mockRejectedValue(new Error('Connection timeout'));
      await expect(search1Skore('phone', '612345678', 'session')).rejects.toThrow('Connection timeout');
    });
  });
});
