import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockShowSuccess = vi.hoisted(() => vi.fn());
const mockShowError = vi.hoisted(() => vi.fn());
const mockLoadSaleById = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/reduxHooks', () => ({
  useAppDispatch: () => vi.fn(),
  useAppSelector: (selector: any) => selector({
    appSettings: { callsModuleEnabled: false },
    calls: {},
  }),
}));

vi.mock('@/features/calls/callsSlice', () => ({
  initiateCall: vi.fn(() => ({ type: 'calls/initiateCall' })),
}));

vi.mock('@/design-system', async () => {
  const actual = await vi.importActual('@/design-system');
  return {
    ...actual,
    useToast: vi.fn(() => ({ showSuccess: mockShowSuccess, showError: mockShowError })),
  };
});

vi.mock('@/features/saleStatus', () => ({
  useSaleStatus: vi.fn(() => ({ statuses: [], loading: false, error: null })),
  SaleStatusBadge: ({ name }: { name: string }) => <span data-testid="status-badge">{name}</span>,
}));

vi.mock('../hooks', () => ({
  useSales: vi.fn(() => ({
    loadSaleById: mockLoadSaleById,
    selectedSale: null,
    loading: false,
    error: null,
    applyFilters: vi.fn(),
    removeFilters: vi.fn(),
    sales: [],
    filters: {},
  })),
  useSaleItems: vi.fn(() => ({ addItem: vi.fn(), updateItem: vi.fn(), removeItem: vi.fn() })),
  useSaleStatusChange: vi.fn(() => ({ changeStatus: vi.fn() })),
}));

vi.mock('../services/saleService', () => ({
  updateSaleClient: vi.fn(() => Promise.resolve()),
  getAllSales: vi.fn(),
  getSaleById: vi.fn(),
  createSale: vi.fn(),
  getComerciales: vi.fn(() => Promise.resolve([])),
}));

vi.mock('../services/signatureService', () => ({
  sendContract: vi.fn(() => Promise.resolve({})),
  resendContract: vi.fn(() => Promise.resolve({})),
  simulateSign: vi.fn(() => Promise.resolve()),
  getSignatureStatus: vi.fn(() => Promise.resolve(null)),
  cancelSignature: vi.fn(() => Promise.resolve()),
}));

vi.mock('./SaleItemsManager', () => ({
  default: () => <div data-testid="sale-items-manager">Items Manager</div>,
}));

let capturedAvailableStatuses: any[] = [];
vi.mock('./SaleStatusChanger', () => ({
  default: ({ availableStatuses }: { availableStatuses: any[] }) => {
    capturedAvailableStatuses = availableStatuses ?? [];
    return <div data-testid="sale-status-changer">Status Changer</div>;
  },
}));

vi.mock('./SaleRecordings', () => ({
  default: () => <div data-testid="sale-recordings">Recordings</div>,
}));

vi.mock('./ContractPreview', () => ({
  default: () => <div data-testid="contract-preview">Contract Preview</div>,
}));

import SaleDetail from './SaleDetail';
import * as salesHooks from '../hooks';
import * as saleStatusModule from '@/features/saleStatus';

const mockSale: any = {
  id: 'sale-abc123',
  statusId: 'status-1',
  status: { id: 'status-1', name: 'En proceso', color: '#00F', isFinal: false, isCancelled: false, order: 1 },
  clientId: 'client-1',
  client: { firstName: 'Ana', lastName: 'García', dni: '11111111A', email: 'ana@example.com' },
  totalAmount: 250,
  items: [
    { id: 'item-1', nameSnapshot: 'Seguro Hogar', quantity: 1, unitPrice: 250, finalPrice: 250 },
  ],
  histories: [],
  assignments: [],
  user: { firstName: 'Carlos', lastName: 'Ruiz' },
  signatureRequest: null,
  comercial: 'Carlos Ruiz',
  createdAt: '2024-01-10T10:00:00Z',
  updatedAt: '2024-01-10T10:00:00Z',
  closedAt: null,
};

function setUseSalesReturn(overrides: any = {}) {
  vi.mocked(salesHooks.useSales).mockReturnValue({
    loadSaleById: mockLoadSaleById,
    selectedSale: null,
    loading: false,
    error: null,
    applyFilters: vi.fn(),
    removeFilters: vi.fn(),
    sales: [],
    filters: {},
    ...overrides,
  } as any);
}

describe('SaleDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedAvailableStatuses = [];
    setUseSalesReturn();
  });

  // ─── loading ────────────────────────────────────────────────────────────────

  it('shows loading spinner when loading=true', () => {
    setUseSalesReturn({ loading: true });
    render(<SaleDetail saleId="sale-abc123" />);
    expect(screen.getByText(/cargando venta/i)).toBeInTheDocument();
  });

  // ─── error ─────────────────────────────────────────────────────────────────

  it('shows error message when error exists', () => {
    setUseSalesReturn({ error: 'Venta no disponible' });
    render(<SaleDetail saleId="sale-abc123" />);
    expect(screen.getByText(/venta no disponible/i)).toBeInTheDocument();
  });

  it('shows close button in error state when onClose provided', () => {
    setUseSalesReturn({ error: 'Error' });
    render(<SaleDetail saleId="sale-abc123" onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: /cerrar/i })).toBeInTheDocument();
  });

  // ─── not found ─────────────────────────────────────────────────────────────

  it('shows "Venta no encontrada" when selectedSale is null', () => {
    render(<SaleDetail saleId="sale-abc123" />);
    expect(screen.getByText(/venta no encontrada/i)).toBeInTheDocument();
  });

  // ─── sale loaded ────────────────────────────────────────────────────────────

  it('renders sale ID when sale is loaded', () => {
    setUseSalesReturn({ selectedSale: mockSale });
    render(<SaleDetail saleId="sale-abc123" />);
    expect(screen.getByText(/sale-abc1/)).toBeInTheDocument();
  });

  it('renders status badge', () => {
    setUseSalesReturn({ selectedSale: mockSale });
    render(<SaleDetail saleId="sale-abc123" />);
    expect(screen.getByTestId('status-badge')).toHaveTextContent('En proceso');
  });

  it('renders client name', () => {
    setUseSalesReturn({ selectedSale: mockSale });
    render(<SaleDetail saleId="sale-abc123" />);
    expect(screen.getByText('Ana García')).toBeInTheDocument();
  });

  it('renders items manager', () => {
    setUseSalesReturn({ selectedSale: mockSale });
    render(<SaleDetail saleId="sale-abc123" />);
    expect(screen.getByTestId('sale-items-manager')).toBeInTheDocument();
  });

  it('calls loadSaleById on mount', () => {
    render(<SaleDetail saleId="sale-abc123" />);
    expect(mockLoadSaleById).toHaveBeenCalledWith('sale-abc123');
  });

  it('calls onClose when Cerrar clicked in not-found state', async () => {
    const onClose = vi.fn();
    render(<SaleDetail saleId="sale-abc123" onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: /cerrar/i }));
    expect(onClose).toHaveBeenCalled();
  });

  // ─── filtro isSystem en SaleStatusChanger ──────────────────────────────────

  it('does not pass isSystem statuses to SaleStatusChanger', () => {
    vi.mocked(saleStatusModule.useSaleStatus).mockReturnValue({
      statuses: [
        { id: 'st-1', name: 'En proceso', order: 1, color: '#00F', isFinal: false, isCancelled: false, isSystem: false },
        { id: 'st-2', name: 'Pendiente firma', order: 2, color: '#F90', isFinal: false, isCancelled: false, isSystem: true },
        { id: 'st-3', name: 'Firmada', order: 3, color: '#0F0', isFinal: true, isCancelled: false, isSystem: false },
      ],
      loading: false,
      error: null,
    } as any);
    setUseSalesReturn({ selectedSale: mockSale });
    render(<SaleDetail saleId="sale-abc123" />);
    expect(capturedAvailableStatuses.find((s) => s.isSystem)).toBeUndefined();
  });

  it('passes non-system statuses to SaleStatusChanger', () => {
    vi.mocked(saleStatusModule.useSaleStatus).mockReturnValue({
      statuses: [
        { id: 'st-1', name: 'En proceso', order: 1, color: '#00F', isFinal: false, isCancelled: false, isSystem: false },
        { id: 'st-2', name: 'Pendiente firma', order: 2, color: '#F90', isFinal: false, isCancelled: false, isSystem: true },
        { id: 'st-3', name: 'Firmada', order: 3, color: '#0F0', isFinal: true, isCancelled: false, isSystem: false },
      ],
      loading: false,
      error: null,
    } as any);
    setUseSalesReturn({ selectedSale: mockSale });
    render(<SaleDetail saleId="sale-abc123" />);
    expect(capturedAvailableStatuses).toHaveLength(2);
    expect(capturedAvailableStatuses.map((s) => s.name)).toEqual(['En proceso', 'Firmada']);
  });
});
