import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import React from 'react';

// Mock jwt-decode so authSlice module-level code won't crash
vi.mock('jwt-decode', () => ({ jwtDecode: vi.fn() }));

import authReducer from '../features/auth/authSlice';
import {
  useRole,
  useHasRole,
  useIsAdmin,
  useCanManageProducts,
  useCanCreateSales,
  useCanEditAnySale,
  useCanDeleteSales,
  useCanManageSaleStatus,
  useCanViewReports,
  useCanManageClients,
  useCanChangeSaleStatus,
} from './useRole';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeStore(role: string | null) {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        id: role ? 'user-1' : null,
        user: role ? { id: 'user-1', firstName: 'John', lastName: 'Doe' } : null,
        accessToken: role ? 'token' : null,
        role,
        isLoggedIn: Boolean(role),
      },
    },
  });
}

function renderWithStore<T>(hook: () => T, role: string | null) {
  const store = makeStore(role);
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(Provider, { store }, children);
  return renderHook(hook, { wrapper });
}

// ─── useRole ─────────────────────────────────────────────────────────────────

describe('useRole', () => {
  beforeEach(() => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);
  });

  it('returns the current role', () => {
    const { result } = renderWithStore(useRole, 'administrador');
    expect(result.current).toBe('administrador');
  });

  it('returns null when not logged in', () => {
    const { result } = renderWithStore(useRole, null);
    expect(result.current).toBeNull();
  });
});

// ─── useHasRole ───────────────────────────────────────────────────────────────

describe('useHasRole', () => {
  it('returns true when user has one of the allowed roles', () => {
    const { result } = renderWithStore(
      () => useHasRole(['administrador', 'coordinador']),
      'coordinador'
    );
    expect(result.current).toBe(true);
  });

  it('returns false when user does not have an allowed role', () => {
    const { result } = renderWithStore(
      () => useHasRole(['administrador']),
      'comercial'
    );
    expect(result.current).toBe(false);
  });

  it('returns false when role is null', () => {
    const { result } = renderWithStore(
      () => useHasRole(['administrador']),
      null
    );
    expect(result.current).toBe(false);
  });
});

// ─── useIsAdmin ───────────────────────────────────────────────────────────────

describe('useIsAdmin', () => {
  it('returns true for administrador', () => {
    const { result } = renderWithStore(useIsAdmin, 'administrador');
    expect(result.current).toBe(true);
  });

  it.each(['coordinador', 'comercial', 'verificador'])('returns false for %s', (role) => {
    const { result } = renderWithStore(useIsAdmin, role);
    expect(result.current).toBe(false);
  });
});

// ─── useCanManageProducts ─────────────────────────────────────────────────────

describe('useCanManageProducts', () => {
  it.each(['administrador', 'coordinador', 'comercial'])('returns true for %s', (role) => {
    const { result } = renderWithStore(useCanManageProducts, role);
    expect(result.current).toBe(true);
  });

  it('returns false for verificador', () => {
    const { result } = renderWithStore(useCanManageProducts, 'verificador');
    expect(result.current).toBe(false);
  });

  it('returns false when not logged in', () => {
    const { result } = renderWithStore(useCanManageProducts, null);
    expect(result.current).toBe(false);
  });
});

// ─── useCanCreateSales ────────────────────────────────────────────────────────

describe('useCanCreateSales', () => {
  it.each(['administrador', 'coordinador', 'comercial', 'verificador'])(
    'returns true for authenticated %s',
    (role) => {
      const { result } = renderWithStore(useCanCreateSales, role);
      expect(result.current).toBe(true);
    }
  );

  it('returns false when not logged in', () => {
    const { result } = renderWithStore(useCanCreateSales, null);
    expect(result.current).toBe(false);
  });
});

// ─── useCanEditAnySale ────────────────────────────────────────────────────────

describe('useCanEditAnySale', () => {
  it.each(['administrador', 'coordinador'])('returns true for %s', (role) => {
    const { result } = renderWithStore(useCanEditAnySale, role);
    expect(result.current).toBe(true);
  });

  it.each(['comercial', 'verificador'])('returns false for %s', (role) => {
    const { result } = renderWithStore(useCanEditAnySale, role);
    expect(result.current).toBe(false);
  });
});

// ─── useCanDeleteSales ────────────────────────────────────────────────────────

describe('useCanDeleteSales', () => {
  it('returns true only for administrador', () => {
    const { result } = renderWithStore(useCanDeleteSales, 'administrador');
    expect(result.current).toBe(true);
  });

  it.each(['coordinador', 'comercial', 'verificador'])('returns false for %s', (role) => {
    const { result } = renderWithStore(useCanDeleteSales, role);
    expect(result.current).toBe(false);
  });
});

// ─── useCanManageSaleStatus ───────────────────────────────────────────────────

describe('useCanManageSaleStatus', () => {
  it('returns true only for administrador', () => {
    const { result } = renderWithStore(useCanManageSaleStatus, 'administrador');
    expect(result.current).toBe(true);
  });

  it.each(['coordinador', 'comercial', 'verificador'])('returns false for %s', (role) => {
    const { result } = renderWithStore(useCanManageSaleStatus, role);
    expect(result.current).toBe(false);
  });
});

// ─── useCanViewReports ────────────────────────────────────────────────────────

describe('useCanViewReports', () => {
  it.each(['administrador', 'coordinador'])('returns true for %s', (role) => {
    const { result } = renderWithStore(useCanViewReports, role);
    expect(result.current).toBe(true);
  });

  it.each(['comercial', 'verificador'])('returns false for %s', (role) => {
    const { result } = renderWithStore(useCanViewReports, role);
    expect(result.current).toBe(false);
  });
});

// ─── useCanManageClients ──────────────────────────────────────────────────────

describe('useCanManageClients', () => {
  it.each(['administrador', 'coordinador', 'verificador'])('returns true for %s', (role) => {
    const { result } = renderWithStore(useCanManageClients, role);
    expect(result.current).toBe(true);
  });

  it('returns false for comercial', () => {
    const { result } = renderWithStore(useCanManageClients, 'comercial');
    expect(result.current).toBe(false);
  });
});

// ─── useCanChangeSaleStatus ───────────────────────────────────────────────────

describe('useCanChangeSaleStatus', () => {
  it.each(['administrador', 'coordinador', 'comercial', 'verificador'])(
    'returns true for authenticated %s',
    (role) => {
      const { result } = renderWithStore(useCanChangeSaleStatus, role);
      expect(result.current).toBe(true);
    }
  );

  it('returns false when not logged in', () => {
    const { result } = renderWithStore(useCanChangeSaleStatus, null);
    expect(result.current).toBe(false);
  });
});
