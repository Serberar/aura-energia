import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';

vi.mock('jwt-decode', () => ({ jwtDecode: vi.fn() }));

import authReducer from '../features/auth/authSlice';
import PrivateRoute from './PrivateRoute';

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface AuthState {
  isLoggedIn: boolean;
  role: string | null;
}

function makeStore({ isLoggedIn, role }: AuthState) {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        id: isLoggedIn ? 'user-1' : null,
        user: isLoggedIn ? { id: 'user-1', firstName: 'Ana', lastName: 'García' } : null,
        accessToken: isLoggedIn ? 'token' : null,
        role,
        isLoggedIn,
      },
    },
  });
}

/**
 * Renders PrivateRoute inside a full router with sentinel pages for
 * /login and /unauthorized so we can assert redirects by text content.
 */
function renderPrivateRoute(
  children: React.ReactNode,
  auth: AuthState,
  allowedRoles?: string[],
  initialEntry = '/protected'
) {
  const store = makeStore(auth);
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route
            path="/protected"
            element={
              <PrivateRoute allowedRoles={allowedRoles}>
                {children}
              </PrivateRoute>
            }
          />
          <Route path="/login" element={<span>Página de login</span>} />
          <Route path="/unauthorized" element={<span>Página no autorizada</span>} />
          <Route path="/dashboard" element={<span>Dashboard</span>} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

// ─── tests ────────────────────────────────────────────────────────────────────

describe('PrivateRoute', () => {
  describe('usuario no autenticado', () => {
    it('redirects to /login when not logged in', () => {
      renderPrivateRoute(
        <span>Contenido protegido</span>,
        { isLoggedIn: false, role: null }
      );
      expect(screen.queryByText('Contenido protegido')).toBeNull();
      expect(screen.getByText('Página de login')).toBeDefined();
    });

    it('redirects to /login even when allowedRoles is specified', () => {
      renderPrivateRoute(
        <span>Solo admin</span>,
        { isLoggedIn: false, role: null },
        ['administrador']
      );
      expect(screen.queryByText('Solo admin')).toBeNull();
      expect(screen.getByText('Página de login')).toBeDefined();
    });
  });

  describe('usuario autenticado sin restricción de rol', () => {
    it('renders children when logged in and no allowedRoles specified', () => {
      renderPrivateRoute(
        <span>Dashboard principal</span>,
        { isLoggedIn: true, role: 'comercial' }
      );
      expect(screen.getByText('Dashboard principal')).toBeDefined();
    });

    it('renders children for any role when allowedRoles is undefined', () => {
      renderPrivateRoute(
        <span>Vista general</span>,
        { isLoggedIn: true, role: 'verificador' }
      );
      expect(screen.getByText('Vista general')).toBeDefined();
    });
  });

  describe('usuario autenticado con restricción de rol — acceso permitido', () => {
    it('renders children when role is in allowedRoles', () => {
      renderPrivateRoute(
        <span>Panel admin</span>,
        { isLoggedIn: true, role: 'administrador' },
        ['administrador']
      );
      expect(screen.getByText('Panel admin')).toBeDefined();
    });

    it('renders children when role matches one of multiple allowedRoles', () => {
      renderPrivateRoute(
        <span>Gestión ventas</span>,
        { isLoggedIn: true, role: 'coordinador' },
        ['administrador', 'coordinador']
      );
      expect(screen.getByText('Gestión ventas')).toBeDefined();
    });

    it('renders children for comercial in mixed allowedRoles', () => {
      renderPrivateRoute(
        <span>Mis ventas</span>,
        { isLoggedIn: true, role: 'comercial' },
        ['administrador', 'coordinador', 'comercial']
      );
      expect(screen.getByText('Mis ventas')).toBeDefined();
    });
  });

  describe('usuario autenticado con restricción de rol — acceso denegado', () => {
    it('redirects to /unauthorized when role is not in allowedRoles', () => {
      renderPrivateRoute(
        <span>Solo admin</span>,
        { isLoggedIn: true, role: 'comercial' },
        ['administrador']
      );
      expect(screen.queryByText('Solo admin')).toBeNull();
      expect(screen.getByText('Página no autorizada')).toBeDefined();
    });

    it('redirects to /unauthorized for coordinador when only administrador allowed', () => {
      renderPrivateRoute(
        <span>Configuración sistema</span>,
        { isLoggedIn: true, role: 'coordinador' },
        ['administrador']
      );
      expect(screen.queryByText('Configuración sistema')).toBeNull();
      expect(screen.getByText('Página no autorizada')).toBeDefined();
    });

    it('redirects to /unauthorized for verificador in admin-only route', () => {
      renderPrivateRoute(
        <span>Gestión usuarios</span>,
        { isLoggedIn: true, role: 'verificador' },
        ['administrador', 'coordinador']
      );
      expect(screen.queryByText('Gestión usuarios')).toBeNull();
      expect(screen.getByText('Página no autorizada')).toBeDefined();
    });
  });
});
