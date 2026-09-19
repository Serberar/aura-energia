import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';

// Mocks before imports
vi.mock('jwt-decode', () => ({ jwtDecode: vi.fn() }));

const mockNavigate = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// Capture onEdit from ClientList to test role-based behaviour
let capturedOnEdit: ((client: any) => void) | undefined = undefined;

vi.mock('@/features/clientes', () => ({
  ClientList: ({ onEdit }: { onEdit?: (client: any) => void }) => {
    capturedOnEdit = onEdit;
    return <div data-testid="client-list">Lista de clientes</div>;
  },
}));

// Mock clientsSlice thunk so it doesn't call the API
vi.mock('@/features/clientes/clientsSlice', async () => {
  const actual = await vi.importActual('@/features/clientes/clientsSlice');
  return {
    ...actual,
    createClient: vi.fn(() => ({ type: 'clients/create/fulfilled', payload: {} })),
  };
});

import { renderWithStore } from '@/test-utils/renderWithStore';
import ClientsPage from './ClientsPage';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ClientsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedOnEdit = undefined;
    vi.mocked(localStorage.getItem).mockReturnValue(null);
  });

  // ─── Renderizado inicial ────────────────────────────────────────────────────

  it('renders the page heading', () => {
    renderWithStore(<ClientsPage />);
    expect(screen.getByRole('heading', { name: /gestión de clientes/i })).toBeInTheDocument();
  });

  it('renders the client list component', () => {
    renderWithStore(<ClientsPage />);
    expect(screen.getByTestId('client-list')).toBeInTheDocument();
  });

  it('renders "+ Nuevo Cliente" button', () => {
    renderWithStore(<ClientsPage />);
    expect(screen.getByRole('button', { name: /nuevo cliente/i })).toBeInTheDocument();
  });

  it('does NOT show the create form initially', () => {
    renderWithStore(<ClientsPage />);
    expect(screen.queryByRole('heading', { name: /crear cliente/i })).not.toBeInTheDocument();
  });

  // ─── Botón nuevo cliente ────────────────────────────────────────────────────

  it('shows the create form when "+ Nuevo Cliente" is clicked', async () => {
    renderWithStore(<ClientsPage />);
    fireEvent.click(screen.getByRole('button', { name: /nuevo cliente/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /crear cliente/i })).toBeInTheDocument();
    });
  });

  it('hides the create form when Cancel is clicked', async () => {
    renderWithStore(<ClientsPage />);
    fireEvent.click(screen.getByRole('button', { name: /nuevo cliente/i }));

    await waitFor(() => expect(screen.getByRole('heading', { name: /crear cliente/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /crear cliente/i })).not.toBeInTheDocument();
    });
  });

  // ─── Estado loading ─────────────────────────────────────────────────────────

  it('disables "+ Nuevo Cliente" button when store is loading', () => {
    renderWithStore(<ClientsPage />, {
      preloadedState: { clients: { clients: [], loading: true, error: null, lastFetch: null } },
    });
    expect(screen.getByRole('button', { name: /nuevo cliente/i })).toBeDisabled();
  });

  // ─── onEdit por rol ─────────────────────────────────────────────────────────

  it('passes onEdit to ClientList for administrador', () => {
    renderWithStore(<ClientsPage />, {
      preloadedState: { auth: { role: 'administrador' } },
    });
    expect(capturedOnEdit).toBeDefined();
  });

  it('passes onEdit to ClientList for coordinador', () => {
    renderWithStore(<ClientsPage />, {
      preloadedState: { auth: { role: 'coordinador' } },
    });
    expect(capturedOnEdit).toBeDefined();
  });

  it('passes undefined onEdit to ClientList for verificador', () => {
    renderWithStore(<ClientsPage />, {
      preloadedState: { auth: { role: 'verificador' } },
    });
    expect(capturedOnEdit).toBeUndefined();
  });

  it('passes undefined onEdit to ClientList for comercial', () => {
    renderWithStore(<ClientsPage />, {
      preloadedState: { auth: { role: 'comercial' } },
    });
    expect(capturedOnEdit).toBeUndefined();
  });

  // ─── Navegación al editar ────────────────────────────────────────────────────

  it('navigates to /edit?dni=... when onEdit callback is invoked', () => {
    renderWithStore(<ClientsPage />, {
      preloadedState: { auth: { role: 'administrador' } },
    });
    expect(capturedOnEdit).toBeDefined();
    capturedOnEdit!({ id: 'c1', dni: '12345678A', firstName: 'Test', lastName: 'User' });
    expect(mockNavigate).toHaveBeenCalledWith('/edit?dni=12345678A');
  });

  it('encodes special chars in DNI when navigating', () => {
    renderWithStore(<ClientsPage />, {
      preloadedState: { auth: { role: 'administrador' } },
    });
    capturedOnEdit!({ id: 'c1', dni: 'X-1234567A', firstName: 'Test', lastName: 'User' });
    expect(mockNavigate).toHaveBeenCalledWith('/edit?dni=X-1234567A');
  });
});
