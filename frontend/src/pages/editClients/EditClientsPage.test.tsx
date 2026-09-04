import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithStore } from '@/test-utils/renderWithStore';
import type { Client } from '@/types/sales';

vi.mock('../../features/clientes/services/clientService', () => ({
  clientService: {
    searchClient: vi.fn(),
    updateClient: vi.fn(),
    pushClientData: vi.fn(),
    getClientById: vi.fn(),
    createClient: vi.fn(),
    deleteClient: vi.fn(),
  },
}));

import EditClientsPage from './EditClientsPage';
import { clientService } from '../../features/clientes/services/clientService';

const mockSearch = clientService.searchClient as ReturnType<typeof vi.fn>;
const mockUpdate = clientService.updateClient as ReturnType<typeof vi.fn>;

const mockClient: Client = {
  id: 'client-1',
  firstName: 'María',
  lastName: 'González',
  dni: '12345678A',
  email: 'maria@example.com',
  phones: ['612345678'],
  addresses: [{ address: 'Calle Mayor 1', cupsGas: '', cupsLuz: '' }],
  bankAccounts: ['ES1234567890123456789012'],
  comments: [],
  birthday: '1985-06-15',
  businessName: undefined,
  authorized: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

function renderPage() {
  return renderWithStore(<EditClientsPage />, {
    preloadedState: {
      auth: {
        id: 'user-1',
        user: { id: 'user-1', firstName: 'Carlos', lastName: 'Ruiz' },
        accessToken: 'token',
        role: 'administrador',
        isLoggedIn: true,
      },
    },
  });
}

describe('EditClientsPage', () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── render ────────────────────────────────────────────────────────────────

  it('renders "Editar cliente" heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /editar cliente/i, level: 1 })).toBeInTheDocument();
  });

  it('shows welcome message with user name', () => {
    renderPage();
    expect(screen.getByText(/bienvenido, carlos/i)).toBeInTheDocument();
  });

  it('renders search input', () => {
    renderPage();
    expect(screen.getByPlaceholderText(/número de teléfono o dni/i)).toBeInTheDocument();
  });

  it('renders Buscar and Limpiar buttons', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /^buscar$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /limpiar/i })).toBeInTheDocument();
  });

  // ─── search validation ─────────────────────────────────────────────────────

  it('shows error when searching with empty input', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /^buscar$/i }));
    expect(screen.getByText(/introduce un número de teléfono o dni/i)).toBeInTheDocument();
  });

  // ─── successful search ────────────────────────────────────────────────────

  it('shows client edit form after successful search', async () => {
    mockSearch.mockResolvedValue([mockClient]);
    renderPage();
    await userEvent.type(screen.getByPlaceholderText(/número de teléfono o dni/i), '12345678A');
    await userEvent.click(screen.getByRole('button', { name: /^buscar$/i }));
    // Client form should appear with firstName input
    expect(await screen.findByDisplayValue('María')).toBeInTheDocument();
  });

  it('shows "no se encontró" error when search returns empty array', async () => {
    mockSearch.mockResolvedValue([]);
    renderPage();
    await userEvent.type(screen.getByPlaceholderText(/número de teléfono o dni/i), 'NOTFOUND');
    await userEvent.click(screen.getByRole('button', { name: /^buscar$/i }));
    expect(await screen.findByText(/no se encontró ningún cliente/i)).toBeInTheDocument();
  });

  it('shows error message when search throws', async () => {
    mockSearch.mockRejectedValue({ response: { data: { error: 'Error servidor' } } });
    renderPage();
    await userEvent.type(screen.getByPlaceholderText(/número de teléfono o dni/i), '12345678A');
    await userEvent.click(screen.getByRole('button', { name: /^buscar$/i }));
    expect(await screen.findByText('Error servidor')).toBeInTheDocument();
  });

  // ─── save ──────────────────────────────────────────────────────────────────

  it('calls updateClient when Guardar changes clicked', async () => {
    mockSearch.mockResolvedValue([mockClient]);
    mockUpdate.mockResolvedValue(mockClient);
    renderPage();
    await userEvent.type(screen.getByPlaceholderText(/número de teléfono o dni/i), '12345678A');
    await userEvent.click(screen.getByRole('button', { name: /^buscar$/i }));
    await screen.findByDisplayValue('María');
    await userEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));
    expect(mockUpdate).toHaveBeenCalledWith('client-1', expect.objectContaining({ id: 'client-1' }));
  });

  it('shows success message after save', async () => {
    mockSearch.mockResolvedValue([mockClient]);
    mockUpdate.mockResolvedValue(mockClient);
    renderPage();
    await userEvent.type(screen.getByPlaceholderText(/número de teléfono o dni/i), '12345678A');
    await userEvent.click(screen.getByRole('button', { name: /^buscar$/i }));
    await screen.findByDisplayValue('María');
    await userEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));
    expect(await screen.findByText(/cliente editado correctamente/i)).toBeInTheDocument();
  });

  // ─── limpiar ───────────────────────────────────────────────────────────────

  it('clears form when Limpiar clicked', async () => {
    mockSearch.mockResolvedValue([mockClient]);
    renderPage();
    const input = screen.getByPlaceholderText(/número de teléfono o dni/i);
    await userEvent.type(input, '12345678A');
    await userEvent.click(screen.getByRole('button', { name: /limpiar/i }));
    expect(input).toHaveValue('');
  });

  // ─── phone management ─────────────────────────────────────────────────────

  it('shows "Añadir teléfono" button when client is loaded', async () => {
    mockSearch.mockResolvedValue([mockClient]);
    renderPage();
    await userEvent.type(screen.getByPlaceholderText(/número de teléfono o dni/i), '12345678A');
    await userEvent.click(screen.getByRole('button', { name: /^buscar$/i }));
    expect(await screen.findByRole('button', { name: /añadir teléfono/i })).toBeInTheDocument();
  });

  // ─── auto-carga desde URL ?dni= ────────────────────────────────────────────

  it('auto-calls searchClient when ?dni= param is present in URL', async () => {
    mockSearch.mockResolvedValue([mockClient]);
    renderWithStore(<EditClientsPage />, {
      initialRoute: '/edit?dni=12345678A',
      preloadedState: {
        auth: {
          id: 'user-1',
          user: { id: 'user-1', firstName: 'Carlos', lastName: 'Ruiz' },
          accessToken: 'token',
          role: 'administrador',
          isLoggedIn: true,
        },
      },
    });
    await waitFor(() => expect(mockSearch).toHaveBeenCalledWith('12345678A'));
  });

  it('auto-populates search input from ?dni= param', async () => {
    mockSearch.mockResolvedValue([mockClient]);
    renderWithStore(<EditClientsPage />, {
      initialRoute: '/edit?dni=12345678A',
      preloadedState: {
        auth: {
          id: 'user-1',
          user: { id: 'user-1', firstName: 'Carlos', lastName: 'Ruiz' },
          accessToken: 'token',
          role: 'administrador',
          isLoggedIn: true,
        },
      },
    });
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/número de teléfono o dni/i)).toHaveValue('12345678A');
    });
  });

  it('loads client edit form automatically from ?dni= param', async () => {
    mockSearch.mockResolvedValue([mockClient]);
    renderWithStore(<EditClientsPage />, {
      initialRoute: '/edit?dni=12345678A',
      preloadedState: {
        auth: {
          id: 'user-1',
          user: { id: 'user-1', firstName: 'Carlos', lastName: 'Ruiz' },
          accessToken: 'token',
          role: 'administrador',
          isLoggedIn: true,
        },
      },
    });
    expect(await screen.findByDisplayValue('María')).toBeInTheDocument();
  });

  it('shows not-found error when ?dni= client does not exist', async () => {
    mockSearch.mockResolvedValue([]);
    renderWithStore(<EditClientsPage />, {
      initialRoute: '/edit?dni=NOTFOUND',
      preloadedState: {
        auth: {
          id: 'user-1',
          user: { id: 'user-1', firstName: 'Carlos', lastName: 'Ruiz' },
          accessToken: 'token',
          role: 'administrador',
          isLoggedIn: true,
        },
      },
    });
    expect(await screen.findByText(/no se encontró ningún cliente con ese dni/i)).toBeInTheDocument();
  });

  it('does NOT auto-search when no ?dni= param is present', () => {
    renderPage(); // uses default route '/'
    expect(mockSearch).not.toHaveBeenCalled();
  });
});
