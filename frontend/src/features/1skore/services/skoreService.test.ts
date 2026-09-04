import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./api', () => ({
  default: { post: vi.fn() },
}));

import api1Skore from './api';
import { login1Skore, search1Skore } from './skoreService';

const mockApi = api1Skore as any;

describe('skoreService', () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── login1Skore ─────────────────────────────────────────────────────────────

  describe('login1Skore', () => {
    it('calls POST /process_login.php with login params', async () => {
      mockApi.post.mockResolvedValue({ headers: {}, data: { success: 1 } });

      await login1Skore();

      expect(mockApi.post).toHaveBeenCalledWith(
        '/process_login.php',
        expect.any(URLSearchParams)
      );
      const params: URLSearchParams = mockApi.post.mock.calls[0][1];
      expect(params.get('method')).toBe('login');
    });

    it('extracts cookie from set-cookie header when present', async () => {
      mockApi.post.mockResolvedValue({
        headers: { 'set-cookie': ['PHPSESSID=abc123; Path=/; HttpOnly'] },
        data: { success: 1 },
      });

      const result = await login1Skore();

      expect(result.cookie).toBe('abc123');
    });

    it('falls back to document.cookie when no set-cookie header', async () => {
      Object.defineProperty(document, 'cookie', {
        get: vi.fn().mockReturnValue('PHPSESSID=doc-cookie'),
        configurable: true,
      });
      mockApi.post.mockResolvedValue({ headers: {}, data: { success: 1 } });

      const result = await login1Skore();

      expect(result.cookie).toBe('doc-cookie');
    });

    it('throws when API fails', async () => {
      mockApi.post.mockRejectedValue(new Error('Connection refused'));
      await expect(login1Skore()).rejects.toThrow('Connection refused');
    });
  });

  // ─── search1Skore ────────────────────────────────────────────────────────────

  describe('search1Skore — type=dni', () => {
    const mockResponse = { success: 1, msg: 'Found' };

    it('calls POST /process_user.php with dni params for NIF', async () => {
      mockApi.post.mockResolvedValue({ data: mockResponse });

      await search1Skore('dni', '12345678A', 'session-abc');

      const params: URLSearchParams = mockApi.post.mock.calls[0][1];
      expect(params.get('data[WS]')).toBe('ws_document');
      // Each key is appended twice: [0] = param name label, [1] = actual value
      expect(params.getAll('data[PARAMS][1][]')[1]).toBe('nif');
    });

    it('normalizes DNI to uppercase', async () => {
      mockApi.post.mockResolvedValue({ data: mockResponse });

      await search1Skore('dni', '12345678a', 'session-abc');

      const params: URLSearchParams = mockApi.post.mock.calls[0][1];
      expect(params.getAll('data[PARAMS][0][]')[1]).toBe('12345678A');
    });

    it('detects NIE (starts with X, Y or Z)', async () => {
      mockApi.post.mockResolvedValue({ data: mockResponse });

      await search1Skore('dni', 'X1234567A', 'session-abc');

      const params: URLSearchParams = mockApi.post.mock.calls[0][1];
      expect(params.getAll('data[PARAMS][1][]')[1]).toBe('nie');
    });

    it('detects CIF (starts with company letter)', async () => {
      mockApi.post.mockResolvedValue({ data: mockResponse });

      await search1Skore('dni', 'B12345678', 'session-abc');

      const params: URLSearchParams = mockApi.post.mock.calls[0][1];
      expect(params.getAll('data[PARAMS][1][]')[1]).toBe('cif');
    });

    it('sends PHPSESSID cookie in headers', async () => {
      mockApi.post.mockResolvedValue({ data: mockResponse });

      await search1Skore('dni', '12345678A', 'my-session-id');

      const options = mockApi.post.mock.calls[0][2];
      expect(options.headers.Cookie).toBe('PHPSESSID=my-session-id');
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

      const params: URLSearchParams = mockApi.post.mock.calls[0][1];
      expect(params.get('data[WS]')).toBe('ws_msisdn');
      // param_p_phone is the label at [0], actual phone value is at [1]
      expect(params.getAll('data[PARAMS][0][]')[1]).toBe('612345678');
    });

    it('throws when API fails', async () => {
      mockApi.post.mockRejectedValue(new Error('Connection timeout'));
      await expect(search1Skore('phone', '612345678', 'session')).rejects.toThrow('Connection timeout');
    });
  });
});
