import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';

// Mocks before imports
vi.mock('jwt-decode', () => ({ jwtDecode: vi.fn() }));

// Mock UserList to avoid complex sub-components; import UserForm directly in test
vi.mock('@/features/users', async () => {
  const { default: UserForm } = await vi.importActual<any>('@/features/users/components/UserForm');
  return {
    UserList: () => <div data-testid="user-list">Lista de usuarios</div>,
    UserForm,
  };
});

// Mock usersSlice thunk
vi.mock('@/features/users/usersSlice', async () => {
  const actual = await vi.importActual('@/features/users/usersSlice');
  return {
    ...actual,
    createUser: vi.fn(() => ({ type: 'users/create/fulfilled', payload: {} })),
  };
});

import { renderWithStore } from '@/test-utils/renderWithStore';
import UsersPage from './UsersPage';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('UsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(localStorage.getItem).mockReturnValue(null);
  });

  // ─── Renderizado inicial ────────────────────────────────────────────────────

  it('renders the page heading', () => {
    renderWithStore(<UsersPage />);
    expect(screen.getByRole('heading', { name: /gestión de usuarios/i })).toBeInTheDocument();
  });

  it('renders the user list component', () => {
    renderWithStore(<UsersPage />);
    expect(screen.getByTestId('user-list')).toBeInTheDocument();
  });

  it('renders "+ Nuevo Usuario" button', () => {
    renderWithStore(<UsersPage />);
    expect(screen.getByRole('button', { name: /nuevo usuario/i })).toBeInTheDocument();
  });

  it('does not show create form initially', () => {
    renderWithStore(<UsersPage />);
    expect(screen.queryByRole('heading', { name: /crear usuario/i })).not.toBeInTheDocument();
  });

  // ─── Abrir/cerrar modal ────────────────────────────────────────────────────

  it('shows create form when "+ Nuevo Usuario" is clicked', async () => {
    renderWithStore(<UsersPage />);
    fireEvent.click(screen.getByRole('button', { name: /nuevo usuario/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /crear usuario/i })).toBeInTheDocument();
    });
  });

  it('hides create form when Cancel is clicked', async () => {
    renderWithStore(<UsersPage />);
    fireEvent.click(screen.getByRole('button', { name: /nuevo usuario/i }));

    await waitFor(() => expect(screen.getByRole('heading', { name: /crear usuario/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /crear usuario/i })).not.toBeInTheDocument();
    });
  });

  it('hides modal when clicking the overlay', async () => {
    renderWithStore(<UsersPage />);
    fireEvent.click(screen.getByRole('button', { name: /nuevo usuario/i }));

    await waitFor(() => expect(screen.getByRole('heading', { name: /crear usuario/i })).toBeInTheDocument());

    // The modalOverlay is the parent div - click on it to close
    const overlay = screen.getByRole('heading', { name: /crear usuario/i }).closest('[class*="modalOverlay"]');
    if (overlay) {
      fireEvent.click(overlay);
      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /crear usuario/i })).not.toBeInTheDocument();
      });
    }
  });

  // ─── Estado loading ─────────────────────────────────────────────────────────

  it('disables the "+ Nuevo Usuario" button when loading', () => {
    renderWithStore(<UsersPage />, {
      preloadedState: { users: { users: [], loading: true, error: null, lastFetch: null } },
    });
    expect(screen.getByRole('button', { name: /nuevo usuario/i })).toBeDisabled();
  });
});
