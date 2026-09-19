import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithStore } from '@/test-utils/renderWithStore';
import type { UserData } from '../services/userService';

vi.mock('./UserCard', () => ({
  default: ({ user, onDelete, onUpdate, isDeleting }: any) => (
    <div data-testid={`user-card-${user.id}`}>
      <span>{user.firstName} {user.lastName}</span>
      <button onClick={() => onDelete(user.id)} disabled={isDeleting}>
        {isDeleting ? 'Eliminando...' : 'Eliminar'}
      </button>
      <button onClick={() => onUpdate(user.id, { firstName: 'Updated' })}>
        Editar
      </button>
    </div>
  ),
}));

vi.mock('../usersSlice', async () => {
  const actual = await vi.importActual('../usersSlice');
  // Action creators must return thunks so dispatch(...).unwrap() works
  const makeThunk = (payload: any) => () => {
    const p = Promise.resolve(payload);
    return Object.assign(p, { unwrap: () => p });
  };
  return {
    ...actual,
    fetchUsers: vi.fn(() => makeThunk([])),
    deleteUser: vi.fn((id: string) => makeThunk(id)),
    updateUser: vi.fn((args: any) => makeThunk(args)),
  };
});

import UserList from './UserList';

const mockAdmin: UserData = {
  id: 'user-1', username: 'carlos', firstName: 'Carlos', lastName: 'Admin', role: 'administrador',
  active: true, failedLoginAttempts: 0, createdAt: '2024-01-01T00:00:00Z', lastLoginAt: null,
};
const mockComercial: UserData = {
  id: 'user-2', username: 'ana', firstName: 'Ana', lastName: 'López', role: 'comercial',
  active: true, failedLoginAttempts: 0, createdAt: '2024-01-01T00:00:00Z', lastLoginAt: null,
};

describe('UserList', () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── loading ───────────────────────────────────────────────────────────────

  it('shows loading text when loading=true', () => {
    renderWithStore(<UserList autoFetch={false} />, {
      preloadedState: { users: { users: [], loading: true, error: null } },
    });
    expect(screen.getByText(/cargando usuarios/i)).toBeInTheDocument();
  });

  // ─── empty ─────────────────────────────────────────────────────────────────

  it('shows empty state when no users', () => {
    renderWithStore(<UserList autoFetch={false} />, {
      preloadedState: { users: { users: [], loading: false, error: null } },
    });
    expect(screen.getByRole('heading', { name: /no hay usuarios/i })).toBeInTheDocument();
  });

  // ─── error ─────────────────────────────────────────────────────────────────

  it('shows error message when error is set', () => {
    renderWithStore(<UserList autoFetch={false} />, {
      preloadedState: { users: { users: [], loading: false, error: 'Error de red' } },
    });
    expect(screen.getByText(/error al cargar usuarios/i)).toBeInTheDocument();
    expect(screen.getByText('Error de red')).toBeInTheDocument();
  });

  it('shows Reintentar button on error', () => {
    renderWithStore(<UserList autoFetch={false} />, {
      preloadedState: { users: { users: [], loading: false, error: 'Error' } },
    });
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });

  // ─── list render ───────────────────────────────────────────────────────────

  it('renders user cards', () => {
    renderWithStore(<UserList autoFetch={false} />, {
      preloadedState: { users: { users: [mockAdmin, mockComercial], loading: false, error: null } },
    });
    expect(screen.getByTestId('user-card-user-1')).toBeInTheDocument();
    expect(screen.getByTestId('user-card-user-2')).toBeInTheDocument();
  });

  it('renders user names', () => {
    renderWithStore(<UserList autoFetch={false} />, {
      preloadedState: { users: { users: [mockAdmin], loading: false, error: null } },
    });
    expect(screen.getByText('Carlos Admin')).toBeInTheDocument();
  });

  it('groups users by role - shows role section header', () => {
    renderWithStore(<UserList autoFetch={false} />, {
      preloadedState: { users: { users: [mockAdmin, mockComercial], loading: false, error: null } },
    });
    expect(screen.getByText('Administradores')).toBeInTheDocument();
    expect(screen.getByText('Comerciales')).toBeInTheDocument();
  });

  it('shows total users count', () => {
    renderWithStore(<UserList autoFetch={false} />, {
      preloadedState: { users: { users: [mockAdmin, mockComercial], loading: false, error: null } },
    });
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  // ─── delete action ─────────────────────────────────────────────────────────

  it('triggers delete flow when UserCard delete called', async () => {
    renderWithStore(<UserList autoFetch={false} />, {
      preloadedState: { users: { users: [mockAdmin], loading: false, error: null } },
    });
    await userEvent.click(screen.getByRole('button', { name: /eliminar/i }));
    // Button click should not throw and remains visible
    expect(screen.getByTestId('user-card-user-1')).toBeInTheDocument();
  });
});
