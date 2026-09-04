import { describe, it, expect, vi, beforeEach } from 'vitest';
import { localStorageMock } from '../../../../vitest.setup';

vi.mock('../../../api/axios', () => ({
  default: {
    post: vi.fn(),
  },
}));

import api from '../../../api/axios';
import { loginAPI, refreshAPI, logoutUser } from './authService';

const mockApi = api as { post: ReturnType<typeof vi.fn> };

// Backing store for localStorage mock
const store = new Map<string, string>();

describe('authService', () => {
  beforeEach(() => {
    store.clear();
    vi.clearAllMocks();
    // Configure the global localStorage mock to behave like real localStorage
    localStorageMock.getItem.mockImplementation((key: string) => store.get(key) ?? null);
    localStorageMock.setItem.mockImplementation((key: string, value: string) => store.set(key, value));
    localStorageMock.removeItem.mockImplementation((key: string) => { store.delete(key); });
    localStorageMock.clear.mockImplementation(() => store.clear());
  });

  // ─── loginAPI ──────────────────────────────────────────────────────────────

  describe('loginAPI', () => {
    const loginResponse = {
      accessToken: 'access-token-123',
      refreshToken: 'refresh-token-abc',
      id: 'user-1',
      firstName: 'Ana',
      lastName: 'García',
      role: 'administrador',
    };

    it('calls POST /users/login with credentials', async () => {
      mockApi.post.mockResolvedValue({ data: loginResponse });

      await loginAPI({ username: 'admin', password: 'pass123' });

      expect(mockApi.post).toHaveBeenCalledWith(
        '/users/login',
        { username: 'admin', password: 'pass123' }
      );
    });

    it('returns the login response data', async () => {
      mockApi.post.mockResolvedValue({ data: loginResponse });

      const result = await loginAPI({ username: 'admin', password: 'pass123' });

      expect(result).toEqual(loginResponse);
    });

    it('stores refreshToken in localStorage', async () => {
      mockApi.post.mockResolvedValue({ data: loginResponse });

      await loginAPI({ username: 'admin', password: 'pass123' });

      expect(localStorage.getItem('refreshToken')).toBe('refresh-token-abc');
    });

    it('does not throw if refreshToken is missing from response', async () => {
      const responseWithoutRefresh = { ...loginResponse, refreshToken: undefined };
      mockApi.post.mockResolvedValue({ data: responseWithoutRefresh });

      await expect(loginAPI({ username: 'admin', password: 'pass123' }))
        .resolves.toBeDefined();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });

    it('throws when API call fails', async () => {
      mockApi.post.mockRejectedValue(new Error('Network error'));

      await expect(loginAPI({ username: 'admin', password: 'wrong' }))
        .rejects.toThrow('Network error');
    });
  });

  // ─── refreshAPI ────────────────────────────────────────────────────────────

  describe('refreshAPI', () => {
    it('calls POST /users/refresh with refreshToken from localStorage', async () => {
      localStorage.setItem('refreshToken', 'stored-refresh-token');
      mockApi.post.mockResolvedValue({ data: { accessToken: 'new-access-token' } });

      await refreshAPI();

      expect(mockApi.post).toHaveBeenCalledWith('/users/refresh', {
        refreshToken: 'stored-refresh-token',
      });
    });

    it('returns new accessToken', async () => {
      localStorage.setItem('refreshToken', 'stored-refresh-token');
      mockApi.post.mockResolvedValue({ data: { accessToken: 'new-access-token' } });

      const result = await refreshAPI();

      expect(result).toEqual({ accessToken: 'new-access-token' });
    });

    it('throws when no refreshToken in localStorage', async () => {
      await expect(refreshAPI()).rejects.toThrow('No hay refresh token guardado');
      expect(mockApi.post).not.toHaveBeenCalled();
    });

    it('throws when API call fails', async () => {
      localStorage.setItem('refreshToken', 'stored-refresh-token');
      mockApi.post.mockRejectedValue(new Error('Token expired'));

      await expect(refreshAPI()).rejects.toThrow('Token expired');
    });
  });

  // ─── logoutUser ────────────────────────────────────────────────────────────

  describe('logoutUser', () => {
    it('removes refreshToken from localStorage before calling API', async () => {
      localStorage.setItem('refreshToken', 'old-token');
      mockApi.post.mockResolvedValue({ data: {} });

      await logoutUser();

      expect(localStorage.getItem('refreshToken')).toBeNull();
    });

    it('calls POST /users/logout with refreshToken', async () => {
      localStorage.setItem('refreshToken', 'old-token');
      mockApi.post.mockResolvedValue({ data: {} });

      await logoutUser();

      expect(mockApi.post).toHaveBeenCalledWith('/users/logout', {
        refreshToken: 'old-token',
      });
    });

    it('returns true on success', async () => {
      localStorage.setItem('refreshToken', 'old-token');
      mockApi.post.mockResolvedValue({ data: {} });

      const result = await logoutUser();

      expect(result).toBe(true);
    });

    it('returns false when API call fails (does not throw)', async () => {
      localStorage.setItem('refreshToken', 'old-token');
      mockApi.post.mockRejectedValue(new Error('Server error'));

      const result = await logoutUser();

      expect(result).toBe(false);
    });

    it('calls POST with undefined refreshToken when none stored', async () => {
      mockApi.post.mockResolvedValue({ data: {} });

      await logoutUser();

      expect(mockApi.post).toHaveBeenCalledWith('/users/logout', {
        refreshToken: undefined,
      });
    });
  });
});
