import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('jwt-decode', () => ({ jwtDecode: vi.fn() }));

// vi.hoisted garantiza inicialización antes del hoisting de vi.mock
const mockNavigate = vi.hoisted(() => vi.fn());
const mockShowSuccess = vi.hoisted(() => vi.fn());
const mockShowError = vi.hoisted(() => vi.fn());
const mockCreate = vi.hoisted(() => vi.fn().mockResolvedValue({ id: 'sale-new' }));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: vi.fn(() => ({ saleId: undefined })),
  };
});

// Mock useRole
vi.mock('@/hooks/useRole', () => ({ useRole: vi.fn(() => 'administrador') }));

// Mock useToast
vi.mock('@/design-system', async () => {
  const actual = await vi.importActual('@/design-system');
  return {
    ...actual,
    useToast: vi.fn(() => ({ showSuccess: mockShowSuccess, showError: mockShowError })),
  };
});

// Mock useSaleStatus
vi.mock('@/features/saleStatus', () => ({
  useSaleStatus: vi.fn(() => ({
    statuses: [
      { id: 's1', name: 'Pendiente', isFinal: false, isCancelled: false },
      { id: 's2', name: 'Firmada', isFinal: true, isCancelled: false },
    ],
    fetchStatuses: vi.fn(),
  })),
}));

// Mock sale services
vi.mock('@/features/sales/services/signatureService', () => ({
  sendContract: vi.fn().mockResolvedValue({ providerDocumentId: 'doc-123' }),
}));
vi.mock('@/features/sales/services/saleService', () => ({
  changeSaleStatus: vi.fn().mockResolvedValue(undefined),
  getSalesStats: vi.fn().mockResolvedValue({ daily: 0, weekly: 0, monthly: 0 }),
}));

// Mock sales feature — sub-componentes pesados
vi.mock('@/features/sales', () => ({
  useSales: vi.fn(() => ({
    sales: [],
    loadSales: vi.fn(),
    create: mockCreate,
    loading: false,
    error: null,
  })),
  SalesList: ({ onViewSale }: any) => (
    <div data-testid="sales-list">
      <button onClick={() => onViewSale({ id: 'sale-1' })}>Ver venta 1</button>
    </div>
  ),
  SaleDetail: ({ saleId, onClose }: any) => (
    <div data-testid="sale-detail">
      <span>Detalle venta: {saleId}</span>
      <button onClick={onClose}>Cerrar detalle</button>
    </div>
  ),
  SaleForm: ({ onCancel, onSaveWithoutSignature }: any) => (
    <div data-testid="sale-form">
      <button onClick={onCancel}>Cancelar venta</button>
      <button
        onClick={() => onSaveWithoutSignature({
          clientId: 'c1',
          statusId: 's1',
          items: [],
          signerEmail: null,
          sendContract: false,
        })}
      >
        Guardar sin firma
      </button>
    </div>
  ),
}));

import { renderWithStore } from '@/test-utils/renderWithStore';
import SalesPage from './SalesPage';
import * as salesFeature from '@/features/sales';
import * as useRoleModule from '@/hooks/useRole';
import * as reactRouter from 'react-router-dom';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SalesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue({ id: 'sale-new' });
    vi.mocked(useRoleModule.useRole).mockReturnValue('administrador');
    vi.mocked(reactRouter.useParams).mockReturnValue({ saleId: undefined });
    vi.mocked(salesFeature.useSales).mockReturnValue({
      sales: [],
      loadSales: vi.fn(),
      create: mockCreate,
      loading: false,
      error: null,
    } as any);
  });

  // ─── Vista lista (administrador) ──────────────────────────────────────────

  it('renders "Gestión de Ventas" heading in list mode (admin)', () => {
    renderWithStore(<SalesPage />);
    expect(screen.getByRole('heading', { name: /gestión de ventas/i })).toBeInTheDocument();
  });

  it('renders SalesList in list mode', () => {
    renderWithStore(<SalesPage />);
    expect(screen.getByTestId('sales-list')).toBeInTheDocument();
  });

  it('renders "+ Nueva Venta" button in list mode (admin)', () => {
    renderWithStore(<SalesPage />);
    expect(screen.getByRole('button', { name: /nueva venta/i })).toBeInTheDocument();
  });

  it('does not show back button in list mode', () => {
    renderWithStore(<SalesPage />);
    expect(screen.queryByRole('button', { name: /volver/i })).not.toBeInTheDocument();
  });

  // ─── Crear venta ──────────────────────────────────────────────────────────

  it('switches to create mode when "+ Nueva Venta" is clicked', async () => {
    renderWithStore(<SalesPage />);
    fireEvent.click(screen.getByRole('button', { name: /nueva venta/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /nueva venta/i })).toBeInTheDocument();
      expect(screen.getByTestId('sale-form')).toBeInTheDocument();
    });
  });

  it('shows back button when in create mode', async () => {
    renderWithStore(<SalesPage />);
    fireEvent.click(screen.getByRole('button', { name: /nueva venta/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /volver/i })).toBeInTheDocument();
    });
  });

  it('navigates to /sales/create when "+ Nueva Venta" is clicked', () => {
    renderWithStore(<SalesPage />);
    fireEvent.click(screen.getByRole('button', { name: /nueva venta/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/sales/create');
  });

  // ─── Detalle de venta ─────────────────────────────────────────────────────

  it('switches to detail mode when a sale is clicked from the list', async () => {
    renderWithStore(<SalesPage />);
    fireEvent.click(screen.getByRole('button', { name: /ver venta 1/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /detalle de venta/i })).toBeInTheDocument();
      expect(screen.getByTestId('sale-detail')).toBeInTheDocument();
    });
  });

  it('navigates to /sales/:id when viewing a sale detail', async () => {
    renderWithStore(<SalesPage />);
    fireEvent.click(screen.getByRole('button', { name: /ver venta 1/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/sales/sale-1');
  });

  // ─── Volver ────────────────────────────────────────────────────────────────

  it('returns to list when back button is clicked from detail', async () => {
    renderWithStore(<SalesPage />);
    fireEvent.click(screen.getByRole('button', { name: /ver venta 1/i }));
    await waitFor(() => expect(screen.getByTestId('sale-detail')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /volver/i }));

    await waitFor(() => {
      expect(screen.getByTestId('sales-list')).toBeInTheDocument();
    });
  });

  it('returns to list when Cancel is clicked in create form', async () => {
    renderWithStore(<SalesPage />);
    fireEvent.click(screen.getByRole('button', { name: /nueva venta/i }));
    await waitFor(() => expect(screen.getByTestId('sale-form')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /cancelar venta/i }));

    await waitFor(() => {
      expect(screen.getByTestId('sales-list')).toBeInTheDocument();
    });
  });

  // ─── URL params ──────────────────────────────────────────────────────────

  it('shows detail view directly when saleId param is present', () => {
    vi.mocked(reactRouter.useParams).mockReturnValue({ saleId: 'sale-abc' });
    renderWithStore(<SalesPage />);
    expect(screen.getByTestId('sale-detail')).toBeInTheDocument();
    expect(screen.getByText(/detalle venta: sale-abc/i)).toBeInTheDocument();
  });

  it('shows create form directly when saleId param is "create"', () => {
    vi.mocked(reactRouter.useParams).mockReturnValue({ saleId: 'create' });
    renderWithStore(<SalesPage />);
    expect(screen.getByTestId('sale-form')).toBeInTheDocument();
  });

  // ─── Rol comercial ────────────────────────────────────────────────────────

  it('shows "Crear Venta" heading for comercial role (not "Nueva Venta")', () => {
    vi.mocked(useRoleModule.useRole).mockReturnValue('comercial');
    renderWithStore(<SalesPage />);
    expect(screen.getByRole('heading', { name: /crear venta/i })).toBeInTheDocument();
  });

  it('does not show "+ Nueva Venta" button for comercial (starts in create mode)', () => {
    vi.mocked(useRoleModule.useRole).mockReturnValue('comercial');
    renderWithStore(<SalesPage />);
    expect(screen.queryByRole('button', { name: /nueva venta/i })).not.toBeInTheDocument();
  });

  // ─── Guardar sin firma ────────────────────────────────────────────────────

  it('calls create and shows success toast when save without signature', async () => {
    renderWithStore(<SalesPage />);
    fireEvent.click(screen.getByRole('button', { name: /nueva venta/i }));
    await waitFor(() => expect(screen.getByTestId('sale-form')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /guardar sin firma/i }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
      expect(mockShowSuccess).toHaveBeenCalledWith('Venta guardada correctamente');
    });
  });
});
