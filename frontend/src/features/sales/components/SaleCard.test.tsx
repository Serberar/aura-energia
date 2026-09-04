import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/features/saleStatus', () => ({
  SaleStatusBadge: ({ name }: { name: string }) => <span data-testid="status-badge">{name}</span>,
}));

import SaleCard from './SaleCard';

const mockStatus = { name: 'Inicial', color: '#FFF', isFinal: false };

const mockSale: any = {
  id: 'abcdef12-sale-xxxx',
  statusId: 'status-1',
  status: mockStatus,
  client: { firstName: 'María', lastName: 'González' },
  createdAt: '2024-01-15T10:00:00Z',
  closedAt: null,
  user: null,
  signatureRequest: null,
  items: [],
  totalAmount: 100,
  histories: [],
  assignments: [],
};

describe('SaleCard', () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── render ────────────────────────────────────────────────────────────────

  it('renders sale ID (first 8 chars)', () => {
    render(<SaleCard sale={mockSale} />);
    expect(screen.getByText('abcdef12')).toBeInTheDocument();
  });

  it('renders client name', () => {
    render(<SaleCard sale={mockSale} />);
    expect(screen.getByText('María González')).toBeInTheDocument();
  });

  it('renders status badge', () => {
    render(<SaleCard sale={mockSale} />);
    expect(screen.getByTestId('status-badge')).toHaveTextContent('Inicial');
  });

  it('shows "Sin firma" when no signatureRequest', () => {
    render(<SaleCard sale={mockSale} />);
    expect(screen.getByText(/sin firma/i)).toBeInTheDocument();
  });

  it('shows signed badge when signatureRequest.status=signed', () => {
    const sale = { ...mockSale, signatureRequest: { status: 'signed' } };
    render(<SaleCard sale={sale} />);
    expect(screen.getByText(/firmada/i)).toBeInTheDocument();
  });

  it('shows pending badge when signatureRequest.status=pending', () => {
    const sale = { ...mockSale, signatureRequest: { status: 'pending' } };
    render(<SaleCard sale={sale} />);
    expect(screen.getByText(/pendiente/i)).toBeInTheDocument();
  });

  it('shows rejected badge when signatureRequest.status=rejected', () => {
    const sale = { ...mockSale, signatureRequest: { status: 'rejected' } };
    render(<SaleCard sale={sale} />);
    expect(screen.getByText(/rechazada/i)).toBeInTheDocument();
  });

  it('shows "Sin cliente" when no client', () => {
    const sale = { ...mockSale, client: null };
    render(<SaleCard sale={sale} />);
    expect(screen.getByText('Sin cliente')).toBeInTheDocument();
  });

  it('falls back to statusId when no status object', () => {
    const sale = { ...mockSale, status: undefined };
    render(<SaleCard sale={sale} />);
    expect(screen.getByTestId('status-badge')).toHaveTextContent('status-1');
  });

  it('shows commercial user name when user provided', () => {
    const sale = { ...mockSale, user: { firstName: 'Carlos', lastName: 'Ruiz' } };
    render(<SaleCard sale={sale} />);
    expect(screen.getByText('Carlos Ruiz')).toBeInTheDocument();
  });

  // ─── actions ───────────────────────────────────────────────────────────────

  it('calls onView with sale when Ver clicked', async () => {
    const onView = vi.fn();
    render(<SaleCard sale={mockSale} onView={onView} />);
    await userEvent.click(screen.getByRole('button', { name: /ver/i }));
    expect(onView).toHaveBeenCalledWith(mockSale);
  });

  it('calls onEdit with sale when Editar clicked', async () => {
    const onEdit = vi.fn();
    render(<SaleCard sale={mockSale} onEdit={onEdit} />);
    await userEvent.click(screen.getByRole('button', { name: /editar/i }));
    expect(onEdit).toHaveBeenCalledWith(mockSale);
  });

  it('hides action buttons when showActions=false', () => {
    render(<SaleCard sale={mockSale} onView={vi.fn()} onEdit={vi.fn()} showActions={false} />);
    expect(screen.queryByRole('button', { name: /ver/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /editar/i })).toBeNull();
  });
});
