import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SaleStatusReorder from './SaleStatusReorder';
import type { SaleStatus } from '@/types/sales';

const mockStatus1: SaleStatus = {
  id: 'status-1', name: 'Inicial', order: 0, color: '#FFF', isFinal: false, isCancelled: false, isSystem: false,
};
const mockStatus2: SaleStatus = {
  id: 'status-2', name: 'En proceso', order: 1, color: '#00F', isFinal: false, isCancelled: false, isSystem: false,
};
const mockStatus3: SaleStatus = {
  id: 'status-3', name: 'Completado', order: 2, color: '#0F0', isFinal: true, isCancelled: false, isSystem: false,
};

const defaultProps = {
  statuses: [mockStatus1, mockStatus2, mockStatus3],
  onSave: vi.fn(),
  onCancel: vi.fn(),
};

describe('SaleStatusReorder', () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── render ────────────────────────────────────────────────────────────────

  it('renders title', () => {
    render(<SaleStatusReorder {...defaultProps} />);
    expect(screen.getByText(/reordenar estados/i)).toBeInTheDocument();
  });

  it('renders all status names', () => {
    render(<SaleStatusReorder {...defaultProps} />);
    expect(screen.getByText('Inicial')).toBeInTheDocument();
    expect(screen.getByText('En proceso')).toBeInTheDocument();
    expect(screen.getByText('Completado')).toBeInTheDocument();
  });

  it('renders Cancel and Guardar Orden buttons', () => {
    render(<SaleStatusReorder {...defaultProps} />);
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /guardar orden/i })).toBeInTheDocument();
  });

  // ─── button state ──────────────────────────────────────────────────────────

  it('Guardar Orden is disabled when no changes', () => {
    render(<SaleStatusReorder {...defaultProps} />);
    expect(screen.getByRole('button', { name: /guardar orden/i })).toBeDisabled();
  });

  it('shows "no hay cambios" message when no changes', () => {
    render(<SaleStatusReorder {...defaultProps} />);
    expect(screen.getByText(/no hay cambios en el orden/i)).toBeInTheDocument();
  });

  // ─── cancel ────────────────────────────────────────────────────────────────

  it('calls onCancel when cancel clicked', async () => {
    render(<SaleStatusReorder {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  // ─── loading ───────────────────────────────────────────────────────────────

  it('shows "Guardando..." when loading=true', () => {
    render(<SaleStatusReorder {...defaultProps} loading={true} />);
    expect(screen.getByText(/guardando/i)).toBeInTheDocument();
  });

  it('disables cancel button when loading=true', () => {
    render(<SaleStatusReorder {...defaultProps} loading={true} />);
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeDisabled();
  });

  // ─── drag items are draggable ──────────────────────────────────────────────

  it('list items are draggable', () => {
    const { container } = render(<SaleStatusReorder {...defaultProps} />);
    const items = container.querySelectorAll('li[draggable]');
    expect(items.length).toBe(3);
  });
});
