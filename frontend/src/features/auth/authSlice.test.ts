import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { jwtDecode } from 'jwt-decode';

// Mock jwt-decode before importing the slice so module-level code uses the mock
vi.mock('jwt-decode', () => ({
  jwtDecode: vi.fn(),
}));

// Import after mocking
import authReducer, { login, logout, setAccessToken } from './authSlice';

const mockJwtDecode = vi.mocked(jwtDecode);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeStore() {
  return configureStore({
    reducer: { auth: authReducer },
  });
}

const VALID_PAYLOAD = {
  id: 'user-1',
  firstName: 'John',
  lastName: 'Doe',
  role: 'administrador',
  exp: Math.floor(Date.now() / 1000) + 3600, // expires in 1 hour
};

// ─── Initial state ────────────────────────────────────────────────────────────

describe('authSlice – initial state', () => {
  beforeEach(() => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);
  });

  it('starts with isLoggedIn false when no token in localStorage', () => {
    const store = makeStore();
    const { auth } = store.getState();
    expect(auth.isLoggedIn).toBe(false);
    expect(auth.user).toBeNull();
    expect(auth.role).toBeNull();
    // localStorage.getItem returns undefined (vi.fn() default) at module import time
    expect(auth.accessToken).toBeFalsy();
  });
});

// ─── login action ─────────────────────────────────────────────────────────────

describe('authSlice – login', () => {
  beforeEach(() => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);
  });

  it('sets user, role, accessToken and isLoggedIn on login', () => {
    const store = makeStore();

    store.dispatch(
      login({
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        accessToken: 'token-abc',
        role: 'administrador',
      })
    );

    const { auth } = store.getState();
    expect(auth.id).toBe('user-1');
    expect(auth.user).toEqual({ id: 'user-1', firstName: 'John', lastName: 'Doe' });
    expect(auth.role).toBe('administrador');
    expect(auth.accessToken).toBe('token-abc');
    expect(auth.isLoggedIn).toBe(true);
  });

  it('persists token to localStorage on login', () => {
    const store = makeStore();

    store.dispatch(
      login({
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        accessToken: 'token-abc',
        role: 'coordinador',
      })
    );

    expect(localStorage.setItem).toHaveBeenCalledWith('accessToken', 'token-abc');
  });
});

// ─── logout action ────────────────────────────────────────────────────────────

describe('authSlice – logout', () => {
  beforeEach(() => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);
  });

  it('clears state on logout', () => {
    const store = makeStore();

    // First login
    store.dispatch(
      login({
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        accessToken: 'token-abc',
        role: 'administrador',
      })
    );

    // Then logout
    store.dispatch(logout());

    const { auth } = store.getState();
    expect(auth.id).toBeNull();
    expect(auth.user).toBeNull();
    expect(auth.accessToken).toBeNull();
    expect(auth.role).toBeNull();
    expect(auth.isLoggedIn).toBe(false);
  });

  it('removes token from localStorage on logout', () => {
    const store = makeStore();
    store.dispatch(logout());
    expect(localStorage.removeItem).toHaveBeenCalledWith('accessToken');
  });
});

// ─── setAccessToken action ────────────────────────────────────────────────────

describe('authSlice – setAccessToken', () => {
  beforeEach(() => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    mockJwtDecode.mockReturnValue(VALID_PAYLOAD as any);
  });

  it('decodes token and updates user/role/id', () => {
    const store = makeStore();

    store.dispatch(setAccessToken('new-token'));

    const { auth } = store.getState();
    expect(auth.id).toBe('user-1');
    expect(auth.user).toEqual({ id: 'user-1', firstName: 'John', lastName: 'Doe' });
    expect(auth.role).toBe('administrador');
    expect(auth.isLoggedIn).toBe(true);
    expect(auth.accessToken).toBe('new-token');
  });

  it('persists new token to localStorage', () => {
    const store = makeStore();
    store.dispatch(setAccessToken('new-token'));
    expect(localStorage.setItem).toHaveBeenCalledWith('accessToken', 'new-token');
  });

  it('clears state when token decoding fails', () => {
    mockJwtDecode.mockImplementation(() => {
      throw new Error('invalid token');
    });

    const store = makeStore();
    store.dispatch(setAccessToken('bad-token'));

    const { auth } = store.getState();
    expect(auth.user).toBeNull();
    expect(auth.role).toBeNull();
    expect(auth.isLoggedIn).toBe(false);
  });

  it('handles lastName missing in token (defaults to empty string)', () => {
    mockJwtDecode.mockReturnValue({
      ...VALID_PAYLOAD,
      lastName: undefined,
    } as any);

    const store = makeStore();
    store.dispatch(setAccessToken('new-token'));

    const { auth } = store.getState();
    expect(auth.user?.lastName).toBe('');
  });
});
