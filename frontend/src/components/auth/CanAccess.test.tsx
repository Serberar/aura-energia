import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';

// jwt-decode is executed at authSlice module load time
vi.mock('jwt-decode', () => ({ jwtDecode: vi.fn() }));

import authReducer from '../../features/auth/authSlice';
import { CanAccess } from './CanAccess';

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

function renderWithRole(ui: React.ReactElement, role: string | null) {
  const store = makeStore(role);
  return render(<Provider store={store}>{ui}</Provider>);
}

// ─── tests ────────────────────────────────────────────────────────────────────

describe('CanAccess', () => {
  describe('usuario con rol permitido', () => {
    it('renders children when role is in allowedRoles', () => {
      renderWithRole(
        <CanAccess allowedRoles={['administrador']}>
          <span>Contenido secreto</span>
        </CanAccess>,
        'administrador'
      );
      expect(screen.getByText('Contenido secreto')).toBeDefined();
    });

    it('renders children when role matches one of multiple allowedRoles', () => {
      renderWithRole(
        <CanAccess allowedRoles={['administrador', 'coordinador', 'comercial']}>
          <span>Sección reportes</span>
        </CanAccess>,
        'coordinador'
      );
      expect(screen.getByText('Sección reportes')).toBeDefined();
    });

    it('renders children for comercial role in allowed list', () => {
      renderWithRole(
        <CanAccess allowedRoles={['administrador', 'comercial']}>
          <span>Panel ventas</span>
        </CanAccess>,
        'comercial'
      );
      expect(screen.getByText('Panel ventas')).toBeDefined();
    });
  });

  describe('usuario sin rol permitido', () => {
    it('renders nothing when role is not in allowedRoles', () => {
      const { container } = renderWithRole(
        <CanAccess allowedRoles={['administrador']}>
          <span>Solo admin</span>
        </CanAccess>,
        'comercial'
      );
      expect(screen.queryByText('Solo admin')).toBeNull();
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when not authenticated (role=null)', () => {
      const { container } = renderWithRole(
        <CanAccess allowedRoles={['administrador', 'comercial']}>
          <span>Contenido protegido</span>
        </CanAccess>,
        null
      );
      expect(screen.queryByText('Contenido protegido')).toBeNull();
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when showFallback=false even if fallback provided', () => {
      renderWithRole(
        <CanAccess
          allowedRoles={['administrador']}
          fallback={<span>Sin permiso</span>}
          showFallback={false}
        >
          <span>Solo admin</span>
        </CanAccess>,
        'comercial'
      );
      expect(screen.queryByText('Solo admin')).toBeNull();
      expect(screen.queryByText('Sin permiso')).toBeNull();
    });
  });

  describe('fallback', () => {
    it('renders fallback when showFallback=true and user lacks access', () => {
      renderWithRole(
        <CanAccess
          allowedRoles={['administrador']}
          fallback={<span>No tienes permiso</span>}
          showFallback
        >
          <span>Panel admin</span>
        </CanAccess>,
        'comercial'
      );
      expect(screen.queryByText('Panel admin')).toBeNull();
      expect(screen.getByText('No tienes permiso')).toBeDefined();
    });

    it('renders nothing when showFallback=true but no fallback prop provided', () => {
      const { container } = renderWithRole(
        <CanAccess allowedRoles={['administrador']} showFallback>
          <span>Panel admin</span>
        </CanAccess>,
        'comercial'
      );
      expect(screen.queryByText('Panel admin')).toBeNull();
      expect(container.firstChild).toBeNull();
    });

    it('does NOT render fallback when user has access', () => {
      renderWithRole(
        <CanAccess
          allowedRoles={['administrador']}
          fallback={<span>Sin permiso</span>}
          showFallback
        >
          <span>Panel admin</span>
        </CanAccess>,
        'administrador'
      );
      expect(screen.getByText('Panel admin')).toBeDefined();
      expect(screen.queryByText('Sin permiso')).toBeNull();
    });
  });
});
