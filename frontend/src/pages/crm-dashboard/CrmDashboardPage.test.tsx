import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('jwt-decode', () => ({ jwtDecode: vi.fn() }));

// vi.hoisted garantiza inicialización antes del hoisting de vi.mock
const mockNavigate = vi.hoisted(() => vi.fn());
const mockGetSalesStats = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ daily: 5, weekly: 32, monthly: 120 })
);
const mockLoadSales = vi.hoisted(() => vi.fn());

// Mock react-router-dom navigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock getSalesStats (llamada API externa)
vi.mock('@/features/sales/services/saleService', () => ({
  getSalesStats: mockGetSalesStats,
  changeSaleStatus: vi.fn().mockResolvedValue(undefined),
}));

// Mock useSales
vi.mock('@/features/sales', () => ({
  useSales: vi.fn(() => ({
    sales: [],
    loadSales: mockLoadSales,
    create: vi.fn(),
    loading: false,
    error: null,
  })),
  SalesList: () => <div data-testid="sales-list" />,
  SaleDetail: () => <div data-testid="sale-detail" />,
  SaleForm: () => <div data-testid="sale-form" />,
}));

// Mock useProducts
vi.mock('@/features/products', () => ({
  useProducts: vi.fn(() => ({
    products: [
      { id: 'p1', name: 'Producto A', active: true },
      { id: 'p2', name: 'Producto B', active: false },
    ],
  })),
  ProductList: () => <div data-testid="product-list" />,
}));

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

import { renderWithStore } from '@/test-utils/renderWithStore';
import CrmDashboardPage from './CrmDashboardPage';
import * as salesService from '@/features/sales/services/saleService';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CrmDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSalesStats.mockResolvedValue({ daily: 5, weekly: 32, monthly: 120 });
  });

  // ─── Renderizado inicial ──────────────────────────────────────────────────

  it('renders "Dashboard CRM" heading', () => {
    renderWithStore(<CrmDashboardPage />);
    expect(screen.getByRole('heading', { name: /dashboard crm/i })).toBeInTheDocument();
  });

  it('renders the subtitle', () => {
    renderWithStore(<CrmDashboardPage />);
    expect(screen.getByText(/vista general del sistema de ventas/i)).toBeInTheDocument();
  });

  it('renders all stat card labels', () => {
    renderWithStore(<CrmDashboardPage />);
    expect(screen.getByText('Ventas Hoy')).toBeInTheDocument();
    expect(screen.getByText('Ventas Semana')).toBeInTheDocument();
    expect(screen.getByText('Ventas Mes')).toBeInTheDocument();
    expect(screen.getByText('Productos')).toBeInTheDocument();
    expect(screen.getByText('Estados')).toBeInTheDocument();
  });

  it('renders "Accesos Rápidos" section', () => {
    renderWithStore(<CrmDashboardPage />);
    expect(screen.getByRole('heading', { name: /accesos rápidos/i })).toBeInTheDocument();
  });

  // ─── Stats cargadas desde API ─────────────────────────────────────────────

  it('shows "..." while stats are loading', () => {
    // Delay resolution to keep loading state
    mockGetSalesStats.mockReturnValue(new Promise(() => {}));
    renderWithStore(<CrmDashboardPage />);
    const ellipsis = screen.getAllByText('...');
    expect(ellipsis.length).toBeGreaterThanOrEqual(3); // daily, weekly, monthly
  });

  it('shows stats values after loading', async () => {
    renderWithStore(<CrmDashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();   // daily
      expect(screen.getByText('32')).toBeInTheDocument();  // weekly
      expect(screen.getByText('120')).toBeInTheDocument(); // monthly
    });
  });

  it('calls getSalesStats on mount', async () => {
    renderWithStore(<CrmDashboardPage />);
    await waitFor(() => expect(salesService.getSalesStats).toHaveBeenCalledTimes(1));
  });

  it('calls loadSales on mount', () => {
    renderWithStore(<CrmDashboardPage />);
    expect(mockLoadSales).toHaveBeenCalled();
  });

  // ─── Contadores de productos y estados ───────────────────────────────────

  it('shows product count from useProducts', () => {
    renderWithStore(<CrmDashboardPage />);
    // Productos(2) y Estados(2) muestran ambos "2" — verificar que están presentes
    const vals = screen.getAllByText('2');
    expect(vals.length).toBeGreaterThanOrEqual(2);
  });

  it('shows active products subtitle', () => {
    renderWithStore(<CrmDashboardPage />);
    expect(screen.getByText(/1 activos/i)).toBeInTheDocument(); // 1 active product
  });

  it('shows status count from useSaleStatus', () => {
    renderWithStore(<CrmDashboardPage />);
    // 2 statuses — but "2" might also match product count; check for "Estados de venta" subtitle
    expect(screen.getByText('Estados de venta')).toBeInTheDocument();
  });

  // ─── Accesos rápidos — navegación ────────────────────────────────────────

  it('navigates to /sales/create when "+ Nueva Venta" is clicked', () => {
    renderWithStore(<CrmDashboardPage />);
    fireEvent.click(screen.getByRole('button', { name: /nueva venta/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/sales/create');
  });

  it('navigates to /clients when "Ver Clientes" is clicked', () => {
    renderWithStore(<CrmDashboardPage />);
    fireEvent.click(screen.getByRole('button', { name: /ver clientes/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/clients');
  });

  it('navigates to /products when "Ver Productos" is clicked', () => {
    renderWithStore(<CrmDashboardPage />);
    fireEvent.click(screen.getByRole('button', { name: /ver productos/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/products');
  });

  it('navigates to /sales when "Ver Ventas" is clicked', () => {
    renderWithStore(<CrmDashboardPage />);
    fireEvent.click(screen.getByRole('button', { name: /ver ventas/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/sales');
  });

  it('navigates to /sale-status when "Gestionar Estados" is clicked', () => {
    renderWithStore(<CrmDashboardPage />);
    fireEvent.click(screen.getByRole('button', { name: /gestionar estados/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/sale-status');
  });

  // ─── Ventas recientes ─────────────────────────────────────────────────────

  it('does not render recent sales section when sales list is empty', () => {
    renderWithStore(<CrmDashboardPage />);
    expect(screen.queryByRole('heading', { name: /ventas recientes/i })).not.toBeInTheDocument();
  });
});
