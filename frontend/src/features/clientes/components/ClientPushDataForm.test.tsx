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

import ClientPushDataForm from './ClientPushDataForm';
import { clientService } from '../services/clientService';

const mockPushClientData = clientService.pushClientData as ReturnType<typeof vi.fn>;

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
  birthday: undefined,
  businessName: undefined,
  authorized: undefined,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('ClientPushDataForm', () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── render ────────────────────────────────────────────────────────────────

  it('renders the title', () => {
    render(<ClientPushDataForm client={mockClient} />);
    expect(screen.getByText(/añadir datos al cliente/i)).toBeInTheDocument();
  });

  it('renders client name in subtitle', () => {
    render(<ClientPushDataForm client={mockClient} />);
    expect(screen.getByText('María González')).toBeInTheDocument();
  });

  it('renders field type radio buttons', () => {
    render(<ClientPushDataForm client={mockClient} />);
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(4); // phones, addresses, comments, bankAccounts
  });

  it('selects "phones" radio by default', () => {
    render(<ClientPushDataForm client={mockClient} />);
    const radios = screen.getAllByRole('radio');
    expect(radios[0]).toBeChecked(); // phones is first
  });

  it('renders phone placeholder when phones selected', () => {
    render(<ClientPushDataForm client={mockClient} />);
    expect(screen.getByPlaceholderText(/612345678/i)).toBeInTheDocument();
  });

  it('shows current phones list', () => {
    render(<ClientPushDataForm client={mockClient} />);
    expect(screen.getByText('612345678')).toBeInTheDocument();
  });

  it('shows empty message when no current values for selected field', () => {
    render(<ClientPushDataForm client={mockClient} />);
    // addresses is empty, switch to addresses
    const radios = screen.getAllByRole('radio');
    // addresses radio should be second
    userEvent.click(radios[1]);
  });

  // ─── field switching ───────────────────────────────────────────────────────

  it('switches placeholder when different radio selected', async () => {
    render(<ClientPushDataForm client={mockClient} />);
    const radios = screen.getAllByRole('radio');
    await userEvent.click(radios[1]); // addresses
    expect(screen.getByPlaceholderText(/calle mayor/i)).toBeInTheDocument();
  });

  it('clears input value when switching field type', async () => {
    render(<ClientPushDataForm client={mockClient} />);
    await userEvent.type(screen.getByPlaceholderText(/612345678/i), '654321987');
    const radios = screen.getAllByRole('radio');
    await userEvent.click(radios[1]); // switch to addresses
    // Input should now have the address placeholder and be empty
    expect(screen.getByPlaceholderText(/calle mayor/i)).toHaveValue('');
  });

  // ─── validation ────────────────────────────────────────────────────────────

  it('shows error when phone is empty on submit', async () => {
    render(<ClientPushDataForm client={mockClient} />);
    // Submit button is disabled when value is empty, so we rely on the form disabled state
    const submitBtn = screen.getByRole('button', { name: /añadir teléfono/i });
    expect(submitBtn).toBeDisabled();
  });

  it('shows error for invalid phone format', async () => {
    render(<ClientPushDataForm client={mockClient} />);
    await userEvent.type(screen.getByPlaceholderText(/612345678/i), 'abc');
    await userEvent.click(screen.getByRole('button', { name: /añadir teléfono/i }));
    expect(screen.getByText(/9 y 15 dígitos/i)).toBeInTheDocument();
  });

  it('shows error for invalid IBAN format', async () => {
    render(<ClientPushDataForm client={mockClient} />);
    const radios = screen.getAllByRole('radio');
    await userEvent.click(radios[3]); // bankAccounts
    await userEvent.type(screen.getByPlaceholderText(/es12/i), 'INVALID');
    await userEvent.click(screen.getByRole('button', { name: /añadir cuenta bancaria/i }));
    expect(screen.getByText(/iban debe tener formato/i)).toBeInTheDocument();
  });

  // ─── successful submission ─────────────────────────────────────────────────

  it('calls clientService.pushClientData with correct data', async () => {
    mockPushClientData.mockResolvedValue({ ...mockClient, phones: ['612345678', '654321987'] });
    render(<ClientPushDataForm client={mockClient} />);
    await userEvent.type(screen.getByPlaceholderText(/612345678/i), '654321987');
    await userEvent.click(screen.getByRole('button', { name: /añadir teléfono/i }));
    expect(mockPushClientData).toHaveBeenCalledWith('client-1', {
      field: 'phones',
      value: '654321987',
    });
  });

  it('calls onSuccess with updated client after submission', async () => {
    const updatedClient = { ...mockClient, phones: ['612345678', '654321987'] };
    mockPushClientData.mockResolvedValue(updatedClient);
    const onSuccess = vi.fn();
    render(<ClientPushDataForm client={mockClient} onSuccess={onSuccess} />);
    await userEvent.type(screen.getByPlaceholderText(/612345678/i), '654321987');
    await userEvent.click(screen.getByRole('button', { name: /añadir teléfono/i }));
    expect(await screen.findByText(/teléfono añadido correctamente/i)).toBeInTheDocument();
    expect(onSuccess).toHaveBeenCalledWith(updatedClient);
  });

  it('clears input after successful submission', async () => {
    mockPushClientData.mockResolvedValue({ ...mockClient });
    render(<ClientPushDataForm client={mockClient} />);
    const input = screen.getByPlaceholderText(/612345678/i);
    await userEvent.type(input, '654321987');
    await userEvent.click(screen.getByRole('button', { name: /añadir teléfono/i }));
    await screen.findByText(/añadido correctamente/i);
    expect(input).toHaveValue('');
  });

  // ─── error handling ────────────────────────────────────────────────────────

  it('calls onError and shows error when service fails', async () => {
    mockPushClientData.mockRejectedValue({ response: { data: { message: 'Teléfono duplicado' } } });
    const onError = vi.fn();
    render(<ClientPushDataForm client={mockClient} onError={onError} />);
    await userEvent.type(screen.getByPlaceholderText(/612345678/i), '654321987');
    await userEvent.click(screen.getByRole('button', { name: /añadir teléfono/i }));
    expect(await screen.findByText('Teléfono duplicado')).toBeInTheDocument();
    expect(onError).toHaveBeenCalledWith('Teléfono duplicado');
  });

  // ─── loading ───────────────────────────────────────────────────────────────

  it('shows "Añadiendo..." text during submission', async () => {
    let resolvePromise!: (value: any) => void;
    mockPushClientData.mockReturnValue(new Promise(res => { resolvePromise = res; }));
    render(<ClientPushDataForm client={mockClient} />);
    await userEvent.type(screen.getByPlaceholderText(/612345678/i), '654321987');
    userEvent.click(screen.getByRole('button', { name: /añadir teléfono/i }));
    expect(await screen.findByText(/añadiendo/i)).toBeInTheDocument();
    resolvePromise(mockClient);
  });
});
