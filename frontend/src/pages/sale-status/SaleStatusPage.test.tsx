import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';

// Mocks before imports
vi.mock('jwt-decode', () => ({ jwtDecode: vi.fn() }));

// Mock saleStatus service to prevent API calls
vi.mock('@/features/saleStatus/services/saleStatusService', () => ({
  getAllSaleStatuses: vi.fn().mockResolvedValue([]),
  getSaleStatusById: vi.fn(),
  createSaleStatus: vi.fn(),
  updateSaleStatus: vi.fn(),
  deleteSaleStatus: vi.fn(),
  reorderSaleStatuses: vi.fn(),
}));

vi.mock('@/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), error: vi.fn(), userAction: vi.fn() },
}));

// Mock complex sub-components to isolate page logic
vi.mock('@/features/saleStatus', async () => {
  const actual = await vi.importActual('@/features/saleStatus');
  return {
    ...actual,
    SaleStatusList: ({ onEdit, onDelete, onReorder }: any) => (
      <div data-testid="status-list">
        <button onClick={() => onEdit({ id: 's1', name: 'Inicial', order: 1, color: '#FFF', isFinal: false, isCancelled: false })}>
          Editar Inicial
        </button>
        <button onClick={() => onDelete({ id: 's1', name: 'Inicial', order: 1, color: '#FFF', isFinal: false, isCancelled: false })}>
          Eliminar Inicial
        </button>
        <button onClick={onReorder}>Reordenar</button>
      </div>
    ),
    SaleStatusReorder: ({ onCancel }: any) => (
      <div data-testid="status-reorder">
        <button onClick={onCancel}>Cancelar reorden</button>
      </div>
    ),
  };
});

import { renderWithStore } from '@/test-utils/renderWithStore';
import SaleStatusPage from './SaleStatusPage';
import * as saleStatusService from '@/features/saleStatus/services/saleStatusService';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SaleStatusPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    vi.mocked(saleStatusService.getAllSaleStatuses).mockResolvedValue([]);
  });

  // ─── Vista inicial (list) ────────────────────────────────────────────────────

  it('renders "Gestión de Estados de Venta" heading in list mode', () => {
    renderWithStore(<SaleStatusPage />);
    expect(screen.getByRole('heading', { name: /gestión de estados de venta/i })).toBeInTheDocument();
  });

  it('renders the status list', () => {
    renderWithStore(<SaleStatusPage />);
    expect(screen.getByTestId('status-list')).toBeInTheDocument();
  });

  it('renders "+ Nuevo Estado" button in list mode', () => {
    renderWithStore(<SaleStatusPage />);
    expect(screen.getByRole('button', { name: /nuevo estado/i })).toBeInTheDocument();
  });

  it('does not show back button in list mode', () => {
    renderWithStore(<SaleStatusPage />);
    expect(screen.queryByRole('button', { name: /volver/i })).not.toBeInTheDocument();
  });

  // ─── Navegación a create ────────────────────────────────────────────────────

  it('switches to create mode when "+ Nuevo Estado" is clicked', async () => {
    renderWithStore(<SaleStatusPage />);
    fireEvent.click(screen.getByRole('button', { name: /nuevo estado/i }));

    await waitFor(() => {
      // Both page h1 and form h3 render "Nuevo Estado" in create mode
      const headings = screen.getAllByRole('heading', { name: /nuevo estado/i });
      expect(headings.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows "← Volver" button in create mode', async () => {
    renderWithStore(<SaleStatusPage />);
    fireEvent.click(screen.getByRole('button', { name: /nuevo estado/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /volver/i })).toBeInTheDocument();
    });
  });

  it('hides "+ Nuevo Estado" button in create mode', async () => {
    renderWithStore(<SaleStatusPage />);
    fireEvent.click(screen.getByRole('button', { name: /nuevo estado/i }));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /nuevo estado/i })).not.toBeInTheDocument();
    });
  });

  it('returns to list mode when "← Volver" is clicked', async () => {
    renderWithStore(<SaleStatusPage />);
    fireEvent.click(screen.getByRole('button', { name: /nuevo estado/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /volver/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /volver/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /gestión de estados de venta/i })).toBeInTheDocument();
    });
  });

  // ─── Navegación a edit ──────────────────────────────────────────────────────

  it('switches to edit mode when Edit button is clicked from list', async () => {
    renderWithStore(<SaleStatusPage />);
    fireEvent.click(screen.getByRole('button', { name: /editar inicial/i }));

    await waitFor(() => {
      // Both page h1 and form h3 render "Editar Estado" — use getAllByRole
      const headings = screen.getAllByRole('heading', { name: /editar estado/i });
      expect(headings.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows "Editar Estado" title in edit mode', async () => {
    renderWithStore(<SaleStatusPage />);
    fireEvent.click(screen.getByRole('button', { name: /editar inicial/i }));

    await waitFor(() => {
      const headings = screen.getAllByText(/editar estado/i);
      expect(headings.length).toBeGreaterThan(0);
    });
  });

  // ─── Navegación a reorder ────────────────────────────────────────────────────

  it('switches to reorder mode when Reordenar is clicked', async () => {
    renderWithStore(<SaleStatusPage />);
    fireEvent.click(screen.getByRole('button', { name: /reordenar/i }));

    await waitFor(() => {
      expect(screen.getByTestId('status-reorder')).toBeInTheDocument();
    });
  });

  it('returns to list from reorder mode when cancel is clicked', async () => {
    renderWithStore(<SaleStatusPage />);
    fireEvent.click(screen.getByRole('button', { name: /reordenar/i }));
    await waitFor(() => expect(screen.getByTestId('status-reorder')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /cancelar reorden/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /gestión de estados de venta/i })).toBeInTheDocument();
    });
  });

  // ─── Confirm delete ─────────────────────────────────────────────────────────

  it('shows browser confirm dialog before deleting', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderWithStore(<SaleStatusPage />);
    fireEvent.click(screen.getByRole('button', { name: /eliminar inicial/i }));

    expect(confirmSpy).toHaveBeenCalledWith('¿Eliminar el estado "Inicial"?');
    confirmSpy.mockRestore();
  });

  it('does not call deleteStatus when user cancels confirm', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderWithStore(<SaleStatusPage />);
    fireEvent.click(screen.getByRole('button', { name: /eliminar inicial/i }));

    expect(saleStatusService.deleteSaleStatus).not.toHaveBeenCalled();
  });
});
