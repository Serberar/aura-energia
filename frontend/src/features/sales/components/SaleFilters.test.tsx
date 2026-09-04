import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/features/saleStatus', () => ({
  useSaleStatus: vi.fn(() => ({
    statuses: [
      { id: 'status-1', name: 'Inicial', order: 1, color: '#FFF', isFinal: false, isCancelled: false },
      { id: 'status-2', name: 'Completado', order: 2, color: '#0F0', isFinal: true, isCancelled: false },
    ],
    loading: false,
    error: null,
  })),
  SaleStatusBadge: ({ name }: { name: string }) => <span>{name}</span>,
}));

vi.mock('../services/saleService', () => ({
  getComerciales: vi.fn(() => Promise.resolve(['Ana López', 'Pedro Ruiz'])),
  getAllSales: vi.fn(),
  getSaleById: vi.fn(),
  createSale: vi.fn(),
  updateSale: vi.fn(),
  deleteSale: vi.fn(),
  addSaleItem: vi.fn(),
  updateSaleItem: vi.fn(),
  removeSaleItem: vi.fn(),
  changeSaleStatus: vi.fn(),
}));

import SaleFilters from './SaleFilters';

const defaultProps = {
  filters: {},
  onApplyFilters: vi.fn(),
  onClearFilters: vi.fn(),
};

describe('SaleFilters', () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── render ────────────────────────────────────────────────────────────────

  it('renders DNI/phone input', () => {
    render(<SaleFilters {...defaultProps} />);
    expect(screen.getByPlaceholderText(/dni o teléfono/i)).toBeInTheDocument();
  });

  it('renders status select with options', () => {
    render(<SaleFilters {...defaultProps} />);
    expect(screen.getByText('Inicial')).toBeInTheDocument();
    expect(screen.getByText('Completado')).toBeInTheDocument();
  });

  it('renders date range inputs', () => {
    render(<SaleFilters {...defaultProps} />);
    const dateInputs = screen.getAllByDisplayValue('');
    expect(dateInputs.length).toBeGreaterThan(0);
  });

  it('pre-fills inputs from filters prop', () => {
    render(<SaleFilters {...defaultProps} filters={{ clientDniOrPhone: '12345678A' }} />);
    expect(screen.getByDisplayValue('12345678A')).toBeInTheDocument();
  });

  // ─── apply ─────────────────────────────────────────────────────────────────

  it('apply button calls onApplyFilters', async () => {
    render(<SaleFilters {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /buscar/i }));
    expect(defaultProps.onApplyFilters).toHaveBeenCalledWith(expect.any(Object));
  });

  it('apply includes typed DNI in filters', async () => {
    render(<SaleFilters {...defaultProps} />);
    await userEvent.type(screen.getByPlaceholderText(/dni o teléfono/i), '12345678A');
    await userEvent.click(screen.getByRole('button', { name: /buscar/i }));
    expect(defaultProps.onApplyFilters).toHaveBeenCalledWith(
      expect.objectContaining({ clientDniOrPhone: '12345678A' })
    );
  });

  // ─── clear ─────────────────────────────────────────────────────────────────

  it('clear button calls onClearFilters', async () => {
    render(<SaleFilters {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /limpiar/i }));
    expect(defaultProps.onClearFilters).toHaveBeenCalled();
  });

  it('clear button resets inputs', async () => {
    render(<SaleFilters {...defaultProps} filters={{ clientDniOrPhone: '12345678A' }} />);
    await userEvent.click(screen.getByRole('button', { name: /limpiar/i }));
    expect(screen.getByPlaceholderText(/dni o teléfono/i)).toHaveValue('');
  });
});
