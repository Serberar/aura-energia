import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const mockShowSuccess = vi.hoisted(() => vi.fn());
const mockShowError = vi.hoisted(() => vi.fn());

vi.mock('@/design-system', async () => {
  const actual = await vi.importActual('@/design-system');
  return { ...actual, useToast: vi.fn(() => ({ showSuccess: mockShowSuccess, showError: mockShowError })) };
});

vi.mock('./SaleCard', () => ({
  default: ({ sale }: any) => <div data-testid={`sale-card-${sale.id}`}>{sale.id}</div>,
}));

vi.mock('./SaleFilters', () => ({
  default: () => <div data-testid="sale-filters">Filters</div>,
}));

vi.mock('../hooks', () => ({
  useSales: vi.fn(() => ({
    sales: [],
    filters: {},
    loading: false,
    error: null,
    applyFilters: vi.fn(),
    removeFilters: vi.fn(),
  })),
}));

vi.mock('@/utils/exportToExcel', () => ({
  exportSalesToExcel: vi.fn(),
}));

import SalesList from './SalesList';
import * as salesHooks from '../hooks';

const mockSale1 = {
  id: 'sale-1', statusId: 'status-1', status: { name: 'Inicial', color: '#FFF', isFinal: false },
  client: null, createdAt: '2024-01-01T00:00:00Z', items: [], histories: [], assignments: [],
  totalAmount: 0,
};
const mockSale2 = { ...mockSale1, id: 'sale-2' };

describe('SalesList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(salesHooks.useSales).mockReturnValue({
      sales: [],
      filters: {},
      loading: false,
      error: null,
      applyFilters: vi.fn(),
      removeFilters: vi.fn(),
    } as any);
  });

  // ─── loading state ─────────────────────────────────────────────────────────

  it('shows loading spinner when loading and no sales', () => {
    vi.mocked(salesHooks.useSales).mockReturnValue({
      sales: [], filters: {}, loading: true, error: null,
      applyFilters: vi.fn(), removeFilters: vi.fn(),
    } as any);
    render(<SalesList />);
    expect(screen.getByText(/cargando ventas/i)).toBeInTheDocument();
  });

  // ─── error state ───────────────────────────────────────────────────────────

  it('shows error message when error exists', () => {
    vi.mocked(salesHooks.useSales).mockReturnValue({
      sales: [], filters: {}, loading: false, error: 'Connection failed',
      applyFilters: vi.fn(), removeFilters: vi.fn(),
    } as any);
    render(<SalesList />);
    expect(screen.getByText(/connection failed/i)).toBeInTheDocument();
  });

  // ─── empty state ───────────────────────────────────────────────────────────

  it('shows empty state message when no sales', () => {
    render(<SalesList />);
    expect(screen.getByText(/no hay ventas/i)).toBeInTheDocument();
  });

  it('shows filter hint when filters applied', () => {
    vi.mocked(salesHooks.useSales).mockReturnValue({
      sales: [], filters: { statusId: 'status-1' }, loading: false, error: null,
      applyFilters: vi.fn(), removeFilters: vi.fn(),
    } as any);
    render(<SalesList />);
    expect(screen.getByText(/ajustar los filtros/i)).toBeInTheDocument();
  });

  // ─── sales list ────────────────────────────────────────────────────────────

  it('renders sale cards when sales exist', () => {
    vi.mocked(salesHooks.useSales).mockReturnValue({
      sales: [mockSale1, mockSale2], filters: {}, loading: false, error: null,
      applyFilters: vi.fn(), removeFilters: vi.fn(),
    } as any);
    render(<SalesList />);
    expect(screen.getByTestId('sale-card-sale-1')).toBeInTheDocument();
    expect(screen.getByTestId('sale-card-sale-2')).toBeInTheDocument();
  });

  it('shows sale count in title', () => {
    vi.mocked(salesHooks.useSales).mockReturnValue({
      sales: [mockSale1], filters: {}, loading: false, error: null,
      applyFilters: vi.fn(), removeFilters: vi.fn(),
    } as any);
    render(<SalesList />);
    expect(screen.getByText(/ventas \(1\)/i)).toBeInTheDocument();
  });

  // ─── filters section ───────────────────────────────────────────────────────

  it('shows filters section by default', () => {
    render(<SalesList />);
    expect(screen.getByTestId('sale-filters')).toBeInTheDocument();
  });

  it('hides filters when showFilters=false', () => {
    render(<SalesList showFilters={false} />);
    expect(screen.queryByTestId('sale-filters')).toBeNull();
  });
});
