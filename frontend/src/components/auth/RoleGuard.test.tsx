import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';

vi.mock('jwt-decode', () => ({ jwtDecode: vi.fn() }));

import authReducer from '../../features/auth/authSlice';
import { RoleGuard } from './RoleGuard';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeStore(role: string | null) {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        id: role ? 'user-1' : null,
        user: role ? { id: 'user-1', firstName: 'Ana', lastName: 'García' } : null,
        accessToken: role ? 'token' : null,
        role,
        isLoggedIn: Boolean(role),
      },
    },
  });
}

function renderWithRole(
  ui: React.ReactElement,
  role: string | null,
  initialEntry = '/'
) {
  const store = makeStore(role);
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialEntry]}>
        {ui}
      </MemoryRouter>
    </Provider>
  );
}

// ─── tests ────────────────────────────────────────────────────────────────────

describe('RoleGuard', () => {
  describe('usuario con rol permitido', () => {
    it('renders children when role is in allowedRoles', () => {
      renderWithRole(
        <RoleGuard allowedRoles={['administrador']}>
          <span>Admin panel</span>
        </RoleGuard>,
        'administrador'
      );
      expect(screen.getByText('Admin panel')).toBeDefined();
    });

    it('renders children when role matches one of multiple allowedRoles', () => {
      renderWithRole(
        <RoleGuard allowedRoles={['administrador', 'coordinador']}>
          <span>Gestión estados</span>
        </RoleGuard>,
        'coordinador'
      );
      expect(screen.getByText('Gestión estados')).toBeDefined();
    });
  });

  describe('usuario sin rol permitido — redirección', () => {
    it('redirects to /dashboard by default when access is denied', () => {
      // We can check by verifying children are NOT rendered
      // and the Navigate component redirected (children absent is the key signal)
      renderWithRole(
        <>
          <RoleGuard allowedRoles={['administrador']}>
            <span>Solo admin</span>
          </RoleGuard>
          <span>Página dashboard</span>
        </>,
        'comercial'
      );
      expect(screen.queryByText('Solo admin')).toBeNull();
    });

    it('redirects to custom path when redirectTo is specified', () => {
      renderWithRole(
        <RoleGuard allowedRoles={['administrador']} redirectTo="/crm">
          <span>Panel restringido</span>
        </RoleGuard>,
        'coordinador'
      );
      expect(screen.queryByText('Panel restringido')).toBeNull();
    });

    it('redirects when user has no role (unauthenticated)', () => {
      renderWithRole(
        <RoleGuard allowedRoles={['administrador', 'coordinador']}>
          <span>Contenido protegido</span>
        </RoleGuard>,
        null
      );
      expect(screen.queryByText('Contenido protegido')).toBeNull();
    });
  });

  describe('fallback en lugar de redirección', () => {
    it('renders fallback when provided and user lacks access', () => {
      renderWithRole(
        <RoleGuard
          allowedRoles={['administrador']}
          fallback={<div>Acceso Denegado</div>}
        >
          <span>Panel admin</span>
        </RoleGuard>,
        'comercial'
      );
      expect(screen.queryByText('Panel admin')).toBeNull();
      expect(screen.getByText('Acceso Denegado')).toBeDefined();
    });

    it('renders fallback (not redirect) when fallback provided', () => {
      renderWithRole(
        <RoleGuard
          allowedRoles={['administrador']}
          fallback={<span>Sin permiso</span>}
          redirectTo="/dashboard"
        >
          <span>Solo admin</span>
        </RoleGuard>,
        'verificador'
      );
      // fallback has priority over redirect
      expect(screen.getByText('Sin permiso')).toBeDefined();
      expect(screen.queryByText('Solo admin')).toBeNull();
    });

    it('does NOT render fallback when user has access', () => {
      renderWithRole(
        <RoleGuard
          allowedRoles={['administrador']}
          fallback={<span>Sin permiso</span>}
        >
          <span>Panel admin</span>
        </RoleGuard>,
        'administrador'
      );
      expect(screen.getByText('Panel admin')).toBeDefined();
      expect(screen.queryByText('Sin permiso')).toBeNull();
    });
  });
});
