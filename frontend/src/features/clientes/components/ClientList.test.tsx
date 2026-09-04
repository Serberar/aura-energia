import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock ClientCard para aislar ClientList
vi.mock('./ClientCard', () => ({
  default: ({ client, onEdit, onClick }: any) => (
    <div data-testid={`client-card-${client.id}`}>
      <span>{client.firstName} {client.lastName}</span>
      {onEdit && <button onClick={() => onEdit(client)}>Editar</button>}
      {onClick && <button onClick={() => onClick(client)}>Ver</button>}
    </div>
  ),
}));

// Mock useToast
const mockShowError = vi.fn();
vi.mock('@/design-system', async () => {
  const actual = await vi.importActual('@/design-system');
  return { ...actual, useToast: vi.fn(() => ({ showError: mockShowError })) };
});

// Hook mocks
const mockRefresh = vi.fn();
const mockSearchClient = vi.fn().mockResolvedValue(undefined);

vi.mock('../hooks', () => ({
  useClients: vi.fn(() => ({ clients: [], loading: false, error: null, refresh: mockRefresh })),
  useClientActions: vi.fn(() => ({ searchClient: mockSearchClient })),
}));

import ClientList from './ClientList';
import * as clientHooks from '../hooks';

const SAMPLE_CLIENTS = [
  { id: 'c1', firstName: 'Ana', lastName: 'García', dni: '11111111A', phones: [], addresses: [], bankAccounts: [], createdAt: '' },
  { id: 'c2', firstName: 'Luis', lastName: 'Pérez', dni: '22222222B', phones: [], addresses: [], bankAccounts: [], createdAt: '' },
];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ClientList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(clientHooks.useClients).mockReturnValue({
      clients: [],
      loading: false,
      error: null,
      refresh: mockRefresh,
    } as any);
    vi.mocked(clientHooks.useClientActions).mockReturnValue({
      searchClient: mockSearchClient,
    } as any);
  });

  // ─── Estado vacío ─────────────────────────────────────────────────────────

  it('renders the empty state when no clients', () => {
    render(<ClientList />);
    expect(screen.getByText(/búsqueda de clientes/i)).toBeInTheDocument();
  });

  it('shows hint text when no search term and empty', () => {
    render(<ClientList />);
    expect(screen.getByText(/filtra por dni/i)).toBeInTheDocument();
  });

  it('shows search input', () => {
    render(<ClientList />);
    expect(screen.getByPlaceholderText(/buscar por dni/i)).toBeInTheDocument();
  });

  // ─── Loading state ────────────────────────────────────────────────────────

  it('shows loading spinner when loading=true', () => {
    vi.mocked(clientHooks.useClients).mockReturnValue({
      clients: [], loading: true, error: null, refresh: mockRefresh,
    } as any);
    render(<ClientList />);
    expect(screen.getByText(/cargando clientes/i)).toBeInTheDocument();
  });

  // ─── Error state ──────────────────────────────────────────────────────────

  it('shows error message and retry button when error', () => {
    vi.mocked(clientHooks.useClients).mockReturnValue({
      clients: [], loading: false, error: 'Error de red', refresh: mockRefresh,
    } as any);
    render(<ClientList />);
    expect(screen.getByText(/error al cargar clientes/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });

  it('calls refresh when "Reintentar" is clicked', () => {
    vi.mocked(clientHooks.useClients).mockReturnValue({
      clients: [], loading: false, error: 'Error', refresh: mockRefresh,
    } as any);
    render(<ClientList />);
    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }));
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  // ─── Lista de clientes ────────────────────────────────────────────────────

  it('renders client cards when clients are provided', () => {
    vi.mocked(clientHooks.useClients).mockReturnValue({
      clients: SAMPLE_CLIENTS, loading: false, error: null, refresh: mockRefresh,
    } as any);
    render(<ClientList />);
    expect(screen.getByTestId('client-card-c1')).toBeInTheDocument();
    expect(screen.getByTestId('client-card-c2')).toBeInTheDocument();
  });

  it('calls onEdit when Editar is clicked on a card', () => {
    const handleEdit = vi.fn();
    vi.mocked(clientHooks.useClients).mockReturnValue({
      clients: SAMPLE_CLIENTS, loading: false, error: null, refresh: mockRefresh,
    } as any);
    render(<ClientList onEdit={handleEdit} />);
    fireEvent.click(screen.getAllByRole('button', { name: /editar/i })[0]);
    expect(handleEdit).toHaveBeenCalledWith(SAMPLE_CLIENTS[0]);
  });

  it('calls onClientClick when Ver is clicked on a card', () => {
    const handleClick = vi.fn();
    vi.mocked(clientHooks.useClients).mockReturnValue({
      clients: SAMPLE_CLIENTS, loading: false, error: null, refresh: mockRefresh,
    } as any);
    render(<ClientList onClientClick={handleClick} />);
    fireEvent.click(screen.getAllByRole('button', { name: /ver/i })[0]);
    expect(handleClick).toHaveBeenCalledWith(SAMPLE_CLIENTS[0]);
  });

  // ─── Búsqueda ─────────────────────────────────────────────────────────────

  it('renders "Buscar" button', () => {
    render(<ClientList />);
    expect(screen.getByRole('button', { name: /buscar/i })).toBeInTheDocument();
  });

  it('"Buscar" button is disabled when search input is empty', () => {
    render(<ClientList />);
    expect(screen.getByRole('button', { name: /buscar/i })).toBeDisabled();
  });

  it('enables Buscar button when search term is entered', async () => {
    const user = userEvent.setup();
    render(<ClientList />);
    await user.type(screen.getByPlaceholderText(/buscar por dni/i), '12345678');
    expect(screen.getByRole('button', { name: /buscar/i })).toBeEnabled();
  });

  it('calls searchClient when Buscar is clicked with a term', async () => {
    const user = userEvent.setup();
    render(<ClientList />);
    await user.type(screen.getByPlaceholderText(/buscar por dni/i), '12345678A');
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));
    await waitFor(() => expect(mockSearchClient).toHaveBeenCalledWith('12345678A'));
  });

  it('calls searchClient when Enter key is pressed', async () => {
    const user = userEvent.setup();
    render(<ClientList />);
    await user.type(screen.getByPlaceholderText(/buscar por dni/i), '12345678A');
    await user.keyboard('{Enter}');
    await waitFor(() => expect(mockSearchClient).toHaveBeenCalledWith('12345678A'));
  });

  it('does NOT call searchClient when search term is empty and Enter is pressed', async () => {
    const user = userEvent.setup();
    render(<ClientList />);
    await user.click(screen.getByPlaceholderText(/buscar por dni/i));
    await user.keyboard('{Enter}');
    expect(mockSearchClient).not.toHaveBeenCalled();
  });

  // ─── Botón limpiar búsqueda ────────────────────────────────────────────────

  it('shows clear button when search term is entered', async () => {
    const user = userEvent.setup();
    render(<ClientList />);
    await user.type(screen.getByPlaceholderText(/buscar por dni/i), 'test');
    expect(screen.getByRole('button', { name: /✕/i })).toBeInTheDocument();
  });

  it('clears search term when ✕ is clicked', async () => {
    const user = userEvent.setup();
    render(<ClientList />);
    await user.type(screen.getByPlaceholderText(/buscar por dni/i), 'test');
    fireEvent.click(screen.getByRole('button', { name: /✕/i }));
    expect(screen.getByPlaceholderText(/buscar por dni/i)).toHaveValue('');
  });

  // ─── Prop onCreate ────────────────────────────────────────────────────────

  it('renders "+ Nuevo Cliente" button when onCreate prop is provided', () => {
    render(<ClientList onCreate={vi.fn()} />);
    expect(screen.getByRole('button', { name: /nuevo cliente/i })).toBeInTheDocument();
  });

  it('does not render "+ Nuevo Cliente" when onCreate is not provided', () => {
    render(<ClientList />);
    expect(screen.queryByRole('button', { name: /nuevo cliente/i })).not.toBeInTheDocument();
  });

  it('calls onCreate when "+ Nuevo Cliente" is clicked', () => {
    const handleCreate = vi.fn();
    render(<ClientList onCreate={handleCreate} />);
    fireEvent.click(screen.getByRole('button', { name: /nuevo cliente/i }));
    expect(handleCreate).toHaveBeenCalledTimes(1);
  });
});
