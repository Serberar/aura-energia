import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

vi.mock('@/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), error: vi.fn(), apiError: vi.fn(), userAction: vi.fn() },
}));

import api from '@/api/axios';
import { getAllUsers, createUser, deleteUser, updateUser } from './userService';
import type { UserData } from './userService';

const mockApi = api as any;

const mockUser: UserData = {
  id: 'user-1',
  username: 'admin',
  firstName: 'Ana',
  lastName: 'García',
  role: 'administrador',
  active: true,
  failedLoginAttempts: 0,
  createdAt: '2024-01-01T00:00:00.000Z',
  lastLoginAt: null,
};

describe('userService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getAllUsers', () => {
    it('calls GET /users and returns array', async () => {
      mockApi.get.mockResolvedValue({ data: [mockUser] });

      const result = await getAllUsers();

      expect(mockApi.get).toHaveBeenCalledWith('/users');
      expect(result).toEqual([mockUser]);
    });

    it('returns empty array when no users', async () => {
      mockApi.get.mockResolvedValue({ data: [] });
      expect(await getAllUsers()).toEqual([]);
    });

    it('throws when API fails', async () => {
      mockApi.get.mockRejectedValue(new Error('Forbidden'));
      await expect(getAllUsers()).rejects.toThrow('Forbidden');
    });
  });

  describe('createUser', () => {
    it('calls POST /users/register with data and returns user', async () => {
      mockApi.post.mockResolvedValue({ data: { message: 'Created', user: mockUser } });

      const result = await createUser({
        firstName: 'Ana',
        lastName: 'García',
        username: 'admin',
        password: 'pass123',
        role: 'administrador',
      });

      expect(mockApi.post).toHaveBeenCalledWith('/users/register', {
        firstName: 'Ana',
        lastName: 'García',
        username: 'admin',
        password: 'pass123',
        role: 'administrador',
      });
      expect(result).toEqual(mockUser);
    });

    it('throws when username is taken', async () => {
      mockApi.post.mockRejectedValue(new Error('Username already exists'));
      await expect(
        createUser({ firstName: 'X', lastName: 'Y', username: 'taken', password: 'p', role: 'comercial' })
      ).rejects.toThrow('Username already exists');
    });
  });

  describe('deleteUser', () => {
    it('calls DELETE /users/:id', async () => {
      mockApi.delete.mockResolvedValue({ data: {} });

      await deleteUser('user-1');

      expect(mockApi.delete).toHaveBeenCalledWith('/users/user-1');
    });

    it('throws when user not found', async () => {
      mockApi.delete.mockRejectedValue(new Error('Not found'));
      await expect(deleteUser('non-existent')).rejects.toThrow('Not found');
    });
  });

  describe('updateUser', () => {
    it('calls PUT /users/:id with data and returns updated user', async () => {
      const updated = { ...mockUser, firstName: 'Ana María' };
      mockApi.put.mockResolvedValue({ data: { message: 'Updated', user: updated } });

      const result = await updateUser('user-1', { firstName: 'Ana María' });

      expect(mockApi.put).toHaveBeenCalledWith('/users/user-1', { firstName: 'Ana María' });
      expect(result.firstName).toBe('Ana María');
    });

    it('throws when user not found', async () => {
      mockApi.put.mockRejectedValue(new Error('Not found'));
      await expect(updateUser('x', { firstName: 'X' })).rejects.toThrow('Not found');
    });
  });
});
