import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClientCard from './ClientCard';
import type { Client } from '@/types/sales';

const mockClient: Client = {
  id: 'client-1',
  firstName: 'María',
  lastName: 'González',
  dni: '12345678A',
  email: 'maria@example.com',
  phones: ['612345678', '910000001'],
  addresses: [{ address: 'Calle Mayor 1, Madrid' }],
  bankAccounts: [],
  comments: [],
  birthday: '1985-06-15T00:00:00Z',
  businessName: 'Empresa SA',
  authorized: 'Juan Pérez',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('ClientCard', () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── render ────────────────────────────────────────────────────────────────

  it('renders client full name', () => {
    render(<ClientCard client={mockClient} />);
    expect(screen.getByText('María González')).toBeInTheDocument();
  });

  it('renders DNI', () => {
    render(<ClientCard client={mockClient} />);
    expect(screen.getByText(/12345678A/)).toBeInTheDocument();
  });

  it('renders email', () => {
    render(<ClientCard client={mockClient} />);
    expect(screen.getByText('maria@example.com')).toBeInTheDocument();
  });

  it('renders first phone', () => {
    render(<ClientCard client={mockClient} />);
    expect(screen.getByText('612345678')).toBeInTheDocument();
  });

  it('shows "+N más" when multiple phones', () => {
    render(<ClientCard client={mockClient} />);
    expect(screen.getByText('+1 más')).toBeInTheDocument();
  });

  it('renders business name', () => {
    render(<ClientCard client={mockClient} />);
    expect(screen.getByText('Empresa SA')).toBeInTheDocument();
  });

  it('renders address', () => {
    render(<ClientCard client={mockClient} />);
    expect(screen.getByText('Calle Mayor 1, Madrid')).toBeInTheDocument();
  });

  it('renders creation date', () => {
    render(<ClientCard client={mockClient} />);
    expect(screen.getByText(/creado:/i)).toBeInTheDocument();
  });

  // ─── compact mode ──────────────────────────────────────────────────────────

  it('hides details section in compact mode', () => {
    render(<ClientCard client={mockClient} compact={true} />);
    // In compact mode, email details div is hidden — email text should not appear
    expect(screen.queryByText('maria@example.com')).toBeNull();
  });

  it('still shows name in compact mode', () => {
    render(<ClientCard client={mockClient} compact={true} />);
    expect(screen.getByText('María González')).toBeInTheDocument();
  });

  // ─── onClick ───────────────────────────────────────────────────────────────

  it('calls onClick with client when card clicked', async () => {
    const onClick = vi.fn();
    const { container } = render(<ClientCard client={mockClient} onClick={onClick} />);
    // Click on the card wrapper
    const card = container.firstChild as HTMLElement;
    await userEvent.click(card);
    expect(onClick).toHaveBeenCalledWith(mockClient);
  });

  // ─── optional fields ───────────────────────────────────────────────────────

  it('does not show email section when no email', () => {
    const client = { ...mockClient, email: undefined };
    render(<ClientCard client={client} />);
    expect(screen.queryByText(/email:/i)).toBeNull();
  });

  it('does not show phone section when no phones', () => {
    const client = { ...mockClient, phones: [] };
    render(<ClientCard client={client} />);
    expect(screen.queryByText(/teléfono:/i)).toBeNull();
  });

  // ─── onEdit ────────────────────────────────────────────────────────────────

  it('does not show Editar button when onEdit is not provided', () => {
    render(<ClientCard client={mockClient} />);
    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument();
  });

  it('shows "Editar →" button when onEdit is provided', () => {
    render(<ClientCard client={mockClient} onEdit={vi.fn()} />);
    expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument();
  });

  it('calls onEdit with client when Editar button is clicked', async () => {
    const onEdit = vi.fn();
    render(<ClientCard client={mockClient} onEdit={onEdit} />);
    await userEvent.click(screen.getByRole('button', { name: /editar/i }));
    expect(onEdit).toHaveBeenCalledWith(mockClient);
  });

  it('does not trigger card onClick when Editar button is clicked', async () => {
    const onClick = vi.fn();
    const onEdit = vi.fn();
    render(<ClientCard client={mockClient} onClick={onClick} onEdit={onEdit} />);
    await userEvent.click(screen.getByText('Editar →').closest('button') as HTMLElement);
    expect(onEdit).toHaveBeenCalledWith(mockClient);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('does not show Editar button when showActions=false even if onEdit provided', () => {
    render(<ClientCard client={mockClient} onEdit={vi.fn()} showActions={false} />);
    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument();
  });
});
