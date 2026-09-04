import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Client } from '@/types/sales';

vi.mock('../services/clientService', () => ({
  clientService: {
    searchClient: vi.fn(),
    pushClientData: vi.fn(),
    getClientById: vi.fn(),
    createClient: vi.fn(),
    updateClient: vi.fn(),
    deleteClient: vi.fn(),
  },
}));

import ClientSearch from './ClientSearch';
import { clientService } from '../services/clientService';

const mockClient: Client = {
  id: 'client-1',
  firstName: 'María',
  lastName: 'González',
  dni: '12345678A',
  email: 'maria@example.com',
  phones: ['612345678'],
  addresses: [],
  bankAccounts: [],
  comments: [],
  birthday: null,
  businessName: undefined,
  authorized: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockSearch = clientService.searchClient as ReturnType<typeof vi.fn>;

describe('ClientSearch', () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── render ────────────────────────────────────────────────────────────────

  it('renders the search input with default placeholder', () => {
    render(<ClientSearch />);
    expect(screen.getByPlaceholderText(/buscar por id, dni o teléfono/i)).toBeInTheDocument();
  });

  it('renders custom placeholder', () => {
    render(<ClientSearch placeholder="Escribe tu DNI..." />);
    expect(screen.getByPlaceholderText(/escribe tu dni/i)).toBeInTheDocument();
  });

  it('renders Buscar button', () => {
    render(<ClientSearch />);
    expect(screen.getByRole('button', { name: /buscar/i })).toBeInTheDocument();
  });

  it('Buscar button is disabled when input is empty', () => {
    render(<ClientSearch />);
    expect(screen.getByRole('button', { name: /buscar/i })).toBeDisabled();
  });

  it('Buscar button is enabled after typing', async () => {
    render(<ClientSearch />);
    await userEvent.type(screen.getByPlaceholderText(/buscar por id/i), '12345678A');
    expect(screen.getByRole('button', { name: /buscar/i })).toBeEnabled();
  });

  // ─── validation ────────────────────────────────────────────────────────────

  it('shows error when search attempted with whitespace only', async () => {
    render(<ClientSearch />);
    await userEvent.type(screen.getByPlaceholderText(/buscar por id/i), '   ');
    // After typing spaces the button may still be disabled due to !searchValue.trim()
    // The error shows when Enter is pressed (or button with empty trimmed value)
    // Let's use keyboard Enter approach
    const input = screen.getByPlaceholderText(/buscar por id/i);
    // Clear and ensure it's just whitespace
    await userEvent.clear(input);
    await userEvent.type(input, '   ');
    // The button is disabled when value doesn't trim, so test the error via keyboard
    // Since button is disabled, fire directly with a searchValue that trims to empty
    // This tests the internal guard — actually the button is disabled already for empty/whitespace
    // so the error is only triggered via keyboard Enter
    await userEvent.keyboard('{Enter}');
    expect(screen.getByText(/ingresa un valor/i)).toBeInTheDocument();
  });

  // ─── search results ────────────────────────────────────────────────────────

  it('shows client name after successful search', async () => {
    mockSearch.mockResolvedValue([mockClient]);
    render(<ClientSearch />);
    await userEvent.type(screen.getByPlaceholderText(/buscar por id/i), '12345678A');
    await userEvent.click(screen.getByRole('button', { name: /buscar/i }));
    expect(await screen.findByText('María González')).toBeInTheDocument();
  });

  it('shows result count header', async () => {
    mockSearch.mockResolvedValue([mockClient]);
    render(<ClientSearch />);
    await userEvent.type(screen.getByPlaceholderText(/buscar por id/i), '12345678A');
    await userEvent.click(screen.getByRole('button', { name: /buscar/i }));
    expect(await screen.findByText(/resultados \(1\)/i)).toBeInTheDocument();
  });

  it('shows "no se encontraron clientes" when empty result', async () => {
    mockSearch.mockResolvedValue([]);
    render(<ClientSearch />);
    await userEvent.type(screen.getByPlaceholderText(/buscar por id/i), 'NOEEXISTE');
    await userEvent.click(screen.getByRole('button', { name: /buscar/i }));
    expect(await screen.findByText(/no se encontraron clientes/i)).toBeInTheDocument();
  });

  it('shows error message on search failure', async () => {
    mockSearch.mockRejectedValue({ response: { data: { message: 'No autorizado' } } });
    render(<ClientSearch />);
    await userEvent.type(screen.getByPlaceholderText(/buscar por id/i), '12345678A');
    await userEvent.click(screen.getByRole('button', { name: /buscar/i }));
    expect(await screen.findByText('No autorizado')).toBeInTheDocument();
  });

  // ─── client click ──────────────────────────────────────────────────────────

  it('calls onClientSelect when client card clicked', async () => {
    mockSearch.mockResolvedValue([mockClient]);
    const onClientSelect = vi.fn();
    render(<ClientSearch onClientSelect={onClientSelect} />);
    await userEvent.type(screen.getByPlaceholderText(/buscar por id/i), '12345678A');
    await userEvent.click(screen.getByRole('button', { name: /buscar/i }));
    const clientCard = await screen.findByText('María González');
    await userEvent.click(clientCard);
    expect(onClientSelect).toHaveBeenCalledWith(mockClient);
  });

  // ─── clear ─────────────────────────────────────────────────────────────────

  it('shows Limpiar button when input has value', async () => {
    render(<ClientSearch />);
    await userEvent.type(screen.getByPlaceholderText(/buscar por id/i), 'test');
    expect(screen.getByRole('button', { name: /limpiar/i })).toBeInTheDocument();
  });

  it('Limpiar button resets input and hides results', async () => {
    mockSearch.mockResolvedValue([mockClient]);
    render(<ClientSearch />);
    await userEvent.type(screen.getByPlaceholderText(/buscar por id/i), '12345678A');
    await userEvent.click(screen.getByRole('button', { name: /buscar/i }));
    await screen.findByText('María González');
    await userEvent.click(screen.getByRole('button', { name: /limpiar/i }));
    expect(screen.getByPlaceholderText(/buscar por id/i)).toHaveValue('');
    expect(screen.queryByText('María González')).toBeNull();
  });

  // ─── close results ─────────────────────────────────────────────────────────

  it('shows close results button and hides results when clicked', async () => {
    mockSearch.mockResolvedValue([mockClient]);
    render(<ClientSearch />);
    await userEvent.type(screen.getByPlaceholderText(/buscar por id/i), '12345678A');
    await userEvent.click(screen.getByRole('button', { name: /buscar/i }));
    await screen.findByText('María González');
    await userEvent.click(screen.getByRole('button', { name: /cerrar resultados/i }));
    expect(screen.queryByText('María González')).toBeNull();
  });
});
