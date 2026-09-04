import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SaleStatusList from './SaleStatusList';
import type { SaleStatus } from '@/types/sales';

const mockStatus1: SaleStatus = {
  id: 'status-1', name: 'Inicial', order: 1, color: '#FFF', isFinal: false, isCancelled: false, isSystem: false,
};
const mockStatus2: SaleStatus = {
  id: 'status-2', name: 'Completado', order: 2, color: '#0F0', isFinal: true, isCancelled: false, isSystem: false,
};
const mockSystemStatus: SaleStatus = {
  id: 'status-sys', name: 'Cancelado', order: 3, color: '#F00', isFinal: false, isCancelled: true, isSystem: true,
};

const defaultProps = {
  statuses: [mockStatus1, mockStatus2],
  onEdit: vi.fn(),
  onDelete: vi.fn(),
};

describe('SaleStatusList', () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── loading ───────────────────────────────────────────────────────────────

  it('shows loading text when loading=true', () => {
    render(<SaleStatusList {...defaultProps} loading={true} />);
    expect(screen.getByText(/cargando estados/i)).toBeInTheDocument();
  });

  // ─── empty ─────────────────────────────────────────────────────────────────

  it('shows empty message when no statuses', () => {
    render(<SaleStatusList statuses={[]} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText(/no hay estados de venta/i)).toBeInTheDocument();
  });

  // ─── list render ───────────────────────────────────────────────────────────

  it('renders status names', () => {
    render(<SaleStatusList {...defaultProps} />);
    // Each status renders twice: once in the badge, once in the name span
    expect(screen.getAllByText('Inicial').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Completado').length).toBeGreaterThan(0);
  });

  it('shows count in header', () => {
    render(<SaleStatusList {...defaultProps} />);
    expect(screen.getByText(/estados de venta \(2\)/i)).toBeInTheDocument();
  });

  it('shows "Estado final" tag for final statuses', () => {
    render(<SaleStatusList {...defaultProps} />);
    expect(screen.getByText('Estado final')).toBeInTheDocument();
  });

  it('shows "Sistema" tag for system statuses', () => {
    render(<SaleStatusList statuses={[mockSystemStatus]} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Sistema')).toBeInTheDocument();
  });

  // ─── reorder button ────────────────────────────────────────────────────────

  it('shows Reordenar button when onReorder provided and more than 1 status', () => {
    render(<SaleStatusList {...defaultProps} onReorder={vi.fn()} />);
    expect(screen.getByRole('button', { name: /reordenar/i })).toBeInTheDocument();
  });

  it('does not show Reordenar button when only 1 status', () => {
    render(<SaleStatusList statuses={[mockStatus1]} onEdit={vi.fn()} onDelete={vi.fn()} onReorder={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /reordenar/i })).toBeNull();
  });

  it('calls onReorder when Reordenar clicked', async () => {
    const onReorder = vi.fn();
    render(<SaleStatusList {...defaultProps} onReorder={onReorder} />);
    await userEvent.click(screen.getByRole('button', { name: /reordenar/i }));
    expect(onReorder).toHaveBeenCalled();
  });

  // ─── edit / delete ─────────────────────────────────────────────────────────

  it('renders edit and delete buttons for non-system statuses', () => {
    render(<SaleStatusList {...defaultProps} />);
    expect(screen.getAllByRole('button', { name: /editar/i })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: /eliminar/i })).toHaveLength(2);
  });

  it('hides edit and delete buttons for system statuses', () => {
    render(<SaleStatusList statuses={[mockStatus1, mockSystemStatus]} onEdit={vi.fn()} onDelete={vi.fn()} />);
    // Only 1 non-system status has buttons
    expect(screen.getAllByRole('button', { name: /editar/i })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /eliminar/i })).toHaveLength(1);
  });

  it('calls onEdit with the correct status', async () => {
    render(<SaleStatusList {...defaultProps} />);
    const editButtons = screen.getAllByRole('button', { name: /editar/i });
    await userEvent.click(editButtons[0]);
    expect(defaultProps.onEdit).toHaveBeenCalledWith(mockStatus1);
  });

  it('calls onDelete with the correct status', async () => {
    render(<SaleStatusList {...defaultProps} />);
    const deleteButtons = screen.getAllByRole('button', { name: /eliminar/i });
    await userEvent.click(deleteButtons[1]);
    expect(defaultProps.onDelete).toHaveBeenCalledWith(mockStatus2);
  });
});
