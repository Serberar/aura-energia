import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

vi.mock('./services/userService', () => ({
  getAllUsers: vi.fn(),
  createUser: vi.fn(),
  deleteUser: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock('../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    userAction: vi.fn(),
  },
}));

import usersReducer, {
  clearError,
  selectUser,
  clearSelectedUser,
  resetUsersState,
  fetchUsers,
  createUser,
  deleteUser,
  updateUser,
} from './usersSlice';
import * as userService from './services/userService';
import type { UserData } from './services/userService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeStore() {
  const reducerMap: any = { users: usersReducer };
  return configureStore({ reducer: reducerMap });
}

const mockUser1: UserData = {
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

const mockUser2: UserData = {
  id: 'user-2',
  username: 'jlopez',
  firstName: 'Juan',
  lastName: 'López',
  role: 'comercial',
  active: true,
  failedLoginAttempts: 0,
  createdAt: '2024-01-02T00:00:00.000Z',
  lastLoginAt: '2024-01-10T08:00:00.000Z',
};

// ─── synchronous reducers ─────────────────────────────────────────────────────

describe('usersSlice – synchronous reducers', () => {
  it('initial state is correct', () => {
    const state = usersReducer(undefined, { type: '@@INIT' });
    expect(state.users).toEqual([]);
    expect(state.selectedUser).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.lastFetch).toBeNull();
  });

  it('clearError sets error to null', () => {
    const stateWithError = usersReducer(
      { users: [], selectedUser: null, loading: false, error: 'some error', lastFetch: null },
      clearError()
    );
    expect(stateWithError.error).toBeNull();
  });

  it('selectUser sets selectedUser', () => {
    const state = usersReducer(
      { users: [mockUser1], selectedUser: null, loading: false, error: null, lastFetch: null },
      selectUser(mockUser1)
    );
    expect(state.selectedUser).toEqual(mockUser1);
  });

  it('selectUser with null clears selectedUser', () => {
    const state = usersReducer(
      { users: [], selectedUser: mockUser1, loading: false, error: null, lastFetch: null },
      selectUser(null)
    );
    expect(state.selectedUser).toBeNull();
  });

  it('clearSelectedUser sets selectedUser to null', () => {
    const state = usersReducer(
      { users: [], selectedUser: mockUser1, loading: false, error: null, lastFetch: null },
      clearSelectedUser()
    );
    expect(state.selectedUser).toBeNull();
  });

  it('resetUsersState returns initial state', () => {
    const dirtyState = {
      users: [mockUser1],
      selectedUser: mockUser1,
      loading: true,
      error: 'error',
      lastFetch: 12345,
    };
    const reset = usersReducer(dirtyState, resetUsersState());
    expect(reset).toEqual({
      users: [],
      selectedUser: null,
      loading: false,
      error: null,
      lastFetch: null,
    });
  });
});

// ─── fetchUsers thunk ─────────────────────────────────────────────────────────

describe('fetchUsers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sets loading=true while pending', () => {
    const store = makeStore();
    vi.mocked(userService.getAllUsers).mockReturnValue(new Promise(() => {}));
    store.dispatch(fetchUsers());
    expect(store.getState().users.loading).toBe(true);
    expect(store.getState().users.error).toBeNull();
  });

  it('sets users and lastFetch on fulfilled', async () => {
    const store = makeStore();
    vi.mocked(userService.getAllUsers).mockResolvedValue([mockUser1, mockUser2]);

    await store.dispatch(fetchUsers());

    const { users } = store.getState();
    expect(users.loading).toBe(false);
    expect(users.users).toEqual([mockUser1, mockUser2]);
    expect(users.lastFetch).not.toBeNull();
  });

  it('sets error on rejected with server message', async () => {
    const store = makeStore();
    vi.mocked(userService.getAllUsers).mockRejectedValue({
      response: { data: { message: 'Forbidden' } },
    });

    await store.dispatch(fetchUsers());

    const { users } = store.getState();
    expect(users.loading).toBe(false);
    expect(users.error).toBe('Forbidden');
  });

  it('uses default error message when no server message', async () => {
    const store = makeStore();
    vi.mocked(userService.getAllUsers).mockRejectedValue(new Error('Network error'));

    await store.dispatch(fetchUsers());

    expect(store.getState().users.error).toBe('Error al obtener usuarios');
  });
});

// ─── createUser thunk ─────────────────────────────────────────────────────────

describe('createUser', () => {
  beforeEach(() => vi.clearAllMocks());

  it('appends new user to list on fulfilled', async () => {
    const store = makeStore();
    vi.mocked(userService.getAllUsers).mockResolvedValue([mockUser1]);
    await store.dispatch(fetchUsers());

    vi.mocked(userService.createUser).mockResolvedValue(mockUser2);
    await store.dispatch(createUser({
      firstName: 'Juan',
      lastName: 'López',
      username: 'jlopez',
      password: 'pass123',
      role: 'comercial',
    }));

    const { users } = store.getState().users;
    expect(users).toHaveLength(2);
    expect(users[1].id).toBe('user-2');
  });

  it('sets error on rejected with server message', async () => {
    const store = makeStore();
    vi.mocked(userService.createUser).mockRejectedValue({
      response: { data: { message: 'Username already taken' } },
    });

    await store.dispatch(createUser({
      firstName: 'Test',
      lastName: 'User',
      username: 'existing',
      password: 'pass',
      role: 'comercial',
    }));

    expect(store.getState().users.error).toBe('Username already taken');
  });

  it('uses default error message when no server message', async () => {
    const store = makeStore();
    vi.mocked(userService.createUser).mockRejectedValue(new Error('Network'));

    await store.dispatch(createUser({
      firstName: 'Test',
      lastName: 'User',
      username: 'test',
      password: 'pass',
      role: 'comercial',
    }));

    expect(store.getState().users.error).toBe('Error al crear usuario');
  });
});

// ─── deleteUser thunk ─────────────────────────────────────────────────────────

describe('deleteUser', () => {
  beforeEach(() => vi.clearAllMocks());

  it('removes deleted user from list on fulfilled', async () => {
    const store = makeStore();
    vi.mocked(userService.getAllUsers).mockResolvedValue([mockUser1, mockUser2]);
    await store.dispatch(fetchUsers());

    vi.mocked(userService.deleteUser).mockResolvedValue(undefined);
    await store.dispatch(deleteUser('user-1'));

    const { users } = store.getState().users;
    expect(users).toHaveLength(1);
    expect(users[0].id).toBe('user-2');
  });

  it('clears selectedUser when deleted user was selected', async () => {
    const store = makeStore();
    vi.mocked(userService.getAllUsers).mockResolvedValue([mockUser1, mockUser2]);
    await store.dispatch(fetchUsers());
    // Select user-1
    store.dispatch(selectUser(mockUser1));
    expect(store.getState().users.selectedUser?.id).toBe('user-1');

    vi.mocked(userService.deleteUser).mockResolvedValue(undefined);
    await store.dispatch(deleteUser('user-1'));

    expect(store.getState().users.selectedUser).toBeNull();
  });

  it('does not clear selectedUser when a different user is deleted', async () => {
    const store = makeStore();
    vi.mocked(userService.getAllUsers).mockResolvedValue([mockUser1, mockUser2]);
    await store.dispatch(fetchUsers());
    store.dispatch(selectUser(mockUser1));

    vi.mocked(userService.deleteUser).mockResolvedValue(undefined);
    await store.dispatch(deleteUser('user-2'));

    expect(store.getState().users.selectedUser?.id).toBe('user-1');
  });

  it('sets error on rejected with server message', async () => {
    const store = makeStore();
    vi.mocked(userService.deleteUser).mockRejectedValue({
      response: { data: { message: 'Cannot delete admin' } },
    });

    await store.dispatch(deleteUser('user-1'));

    expect(store.getState().users.error).toBe('Cannot delete admin');
  });

  it('uses default error message when no server message', async () => {
    const store = makeStore();
    vi.mocked(userService.deleteUser).mockRejectedValue(new Error('Network'));

    await store.dispatch(deleteUser('user-1'));

    expect(store.getState().users.error).toBe('Error al eliminar usuario');
  });
});

// ─── updateUser thunk ─────────────────────────────────────────────────────────

describe('updateUser', () => {
  beforeEach(() => vi.clearAllMocks());

  it('replaces user in list on fulfilled', async () => {
    const store = makeStore();
    vi.mocked(userService.getAllUsers).mockResolvedValue([mockUser1, mockUser2]);
    await store.dispatch(fetchUsers());

    const updatedUser = { ...mockUser2, firstName: 'Juan Carlos' };
    vi.mocked(userService.updateUser).mockResolvedValue(updatedUser);
    await store.dispatch(updateUser({ userId: 'user-2', data: { firstName: 'Juan Carlos' } }));

    const { users } = store.getState().users;
    expect(users.find((u) => u.id === 'user-2')?.firstName).toBe('Juan Carlos');
  });

  it('updates selectedUser when updated user was selected', async () => {
    const store = makeStore();
    vi.mocked(userService.getAllUsers).mockResolvedValue([mockUser1, mockUser2]);
    await store.dispatch(fetchUsers());
    store.dispatch(selectUser(mockUser2));

    const updatedUser = { ...mockUser2, firstName: 'Juan Carlos' };
    vi.mocked(userService.updateUser).mockResolvedValue(updatedUser);
    await store.dispatch(updateUser({ userId: 'user-2', data: { firstName: 'Juan Carlos' } }));

    expect(store.getState().users.selectedUser?.firstName).toBe('Juan Carlos');
  });

  it('sets error on rejected with server message', async () => {
    const store = makeStore();
    vi.mocked(userService.updateUser).mockRejectedValue({
      response: { data: { message: 'Username conflict' } },
    });

    await store.dispatch(updateUser({ userId: 'user-1', data: { username: 'taken' } }));

    expect(store.getState().users.error).toBe('Username conflict');
  });

  it('uses default error message when no server message', async () => {
    const store = makeStore();
    vi.mocked(userService.updateUser).mockRejectedValue(new Error('Network'));

    await store.dispatch(updateUser({ userId: 'user-1', data: { firstName: 'Test' } }));

    expect(store.getState().users.error).toBe('Error al actualizar usuario');
  });
});
