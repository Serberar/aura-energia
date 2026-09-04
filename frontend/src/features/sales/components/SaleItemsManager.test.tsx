import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SaleItemsManager from './SaleItemsManager';
import type { SaleItem } from '@/types/sales';

const mockItem1: SaleItem = {
  id: 'item-1', nameSnapshot: 'Seguro Hogar', quantity: 2, unitPrice: 50, finalPrice: 100,
};
const mockItem2: SaleItem = {
  id: 'item-2', nameSnapshot: 'Seguro Vida', quantity: 1, unitPrice: 80, finalPrice: 80,
};

const defaultProps = {
  items: [mockItem1, mockItem2],
  onAddItem: vi.fn(),
  onUpdateItem: vi.fn(),
  onRemoveItem: vi.fn(),
};

describe('SaleItemsManager', () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── render ────────────────────────────────────────────────────────────────

  it('renders item names', () => {
    render(<SaleItemsManager {...defaultProps} />);
    expect(screen.getByText('Seguro Hogar')).toBeInTheDocument();
    expect(screen.getByText('Seguro Vida')).toBeInTheDocument();
  });

  it('shows item count in header', () => {
    render(<SaleItemsManager {...defaultProps} />);
    expect(screen.getByText(/productos \(2\)/i)).toBeInTheDocument();
  });

  it('shows "Añadir Producto" button when not readonly', () => {
    render(<SaleItemsManager {...defaultProps} readonly={false} />);
    expect(screen.getByRole('button', { name: /añadir producto/i })).toBeInTheDocument();
  });

  it('hides "Añadir Producto" button when readonly=true', () => {
    render(<SaleItemsManager {...defaultProps} readonly={true} />);
    expect(screen.queryByRole('button', { name: /añadir producto/i })).toBeNull();
  });

  it('hides edit/delete buttons when readonly=true', () => {
    render(<SaleItemsManager {...defaultProps} readonly={true} />);
    expect(screen.queryByRole('button', { name: /editar/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /eliminar/i })).toBeNull();
  });

  // ─── add item flow ─────────────────────────────────────────────────────────

  it('clicking "Añadir Producto" shows form', async () => {
    render(<SaleItemsManager {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /añadir producto/i }));
    expect(screen.getByRole('button', { name: /^añadir$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
  });

  it('clicking cancel in add form hides it', async () => {
    render(<SaleItemsManager {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /añadir producto/i }));
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(screen.queryByRole('button', { name: /^añadir$/i })).toBeNull();
  });

  it('clicking Añadir calls onAddItem with form data', async () => {
    render(<SaleItemsManager {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /añadir producto/i }));

    const inputs = screen.getAllByRole('spinbutton'); // number inputs
    const nameInput = screen.getByLabelText(/nombre/i);

    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Nuevo Producto');
    await userEvent.clear(inputs[0]);
    await userEvent.type(inputs[0], '3');

    await userEvent.click(screen.getByRole('button', { name: /^añadir$/i }));

    expect(defaultProps.onAddItem).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Nuevo Producto', quantity: 3 })
    );
  });

  // ─── edit / remove ─────────────────────────────────────────────────────────

  it('clicking edit shows edit form for that item', async () => {
    render(<SaleItemsManager {...defaultProps} />);
    const editButtons = screen.getAllByRole('button', { name: /editar/i });
    await userEvent.click(editButtons[0]);
    expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
  });

  it('clicking Eliminar calls onRemoveItem with item id', async () => {
    render(<SaleItemsManager {...defaultProps} />);
    const deleteButtons = screen.getAllByRole('button', { name: /eliminar/i });
    await userEvent.click(deleteButtons[0]);
    expect(defaultProps.onRemoveItem).toHaveBeenCalledWith('item-1');
  });

  it('clicking Guardar in edit form calls onUpdateItem', async () => {
    render(<SaleItemsManager {...defaultProps} />);
    const editButtons = screen.getAllByRole('button', { name: /editar/i });
    await userEvent.click(editButtons[0]);
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));
    expect(defaultProps.onUpdateItem).toHaveBeenCalledWith('item-1', expect.any(Object));
  });
});
