import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductForm from './ProductForm';

const mockSubmit = vi.fn().mockResolvedValue(undefined);
const mockCancel = vi.fn();

const SAMPLE_PRODUCT = {
  id: 'p1',
  name: 'Laptop Dell',
  description: 'Potente laptop',
  sku: 'DELL-001',
  price: 1299.99,
  isActive: true,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

function renderCreate() {
  return render(
    <ProductForm mode="create" onSubmit={mockSubmit} onCancel={mockCancel} />
  );
}

function renderEdit() {
  return render(
    <ProductForm mode="edit" product={SAMPLE_PRODUCT} onSubmit={mockSubmit} onCancel={mockCancel} />
  );
}

describe('ProductForm', () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── Modo create ──────────────────────────────────────────────────────────

  it('renders "Crear Producto" heading in create mode', () => {
    renderCreate();
    expect(screen.getByRole('heading', { name: /crear producto/i })).toBeInTheDocument();
  });

  it('renders name and price inputs', () => {
    renderCreate();
    expect(screen.getByPlaceholderText(/Tarifa Luz Premium/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/1299\.99/i)).toBeInTheDocument();
  });

  it('renders SKU input', () => {
    renderCreate();
    expect(screen.getByPlaceholderText(/LUZ-PREM-001/i)).toBeInTheDocument();
  });

  it('renders description textarea', () => {
    renderCreate();
    expect(screen.getByPlaceholderText(/descripción detallada/i)).toBeInTheDocument();
  });

  it('renders "Crear Producto" submit button', () => {
    renderCreate();
    expect(screen.getByRole('button', { name: /crear producto/i })).toBeInTheDocument();
  });

  it('renders Cancel button', () => {
    renderCreate();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
  });

  it('calls onCancel when Cancel button is clicked', () => {
    renderCreate();
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(mockCancel).toHaveBeenCalledTimes(1);
  });

  // ─── Modo edit ────────────────────────────────────────────────────────────

  it('renders "Editar Producto" heading in edit mode', () => {
    renderEdit();
    expect(screen.getByRole('heading', { name: /editar producto/i })).toBeInTheDocument();
  });

  it('pre-fills name field in edit mode', () => {
    renderEdit();
    expect(screen.getByPlaceholderText(/Tarifa Luz Premium/i)).toHaveValue('Laptop Dell');
  });

  it('pre-fills price field in edit mode', () => {
    renderEdit();
    expect(screen.getByPlaceholderText(/1299\.99/i)).toHaveValue(1299.99);
  });

  it('renders "Guardar Cambios" button in edit mode', () => {
    renderEdit();
    expect(screen.getByRole('button', { name: /guardar cambios/i })).toBeInTheDocument();
  });

  // ─── Validación ───────────────────────────────────────────────────────────

  it('shows name required error when submitting empty form', async () => {
    renderCreate();
    fireEvent.click(screen.getByRole('button', { name: /crear producto/i }));

    await waitFor(() => {
      expect(screen.getByText(/nombre es requerido/i)).toBeInTheDocument();
    });
  });

  it('shows price required error when submitting without price', async () => {
    renderCreate();
    fireEvent.click(screen.getByRole('button', { name: /crear producto/i }));

    await waitFor(() => {
      // Mensaje de error del schema Zod, distinto de la label "Precio (€)"
      expect(screen.getByText(/precio es requerido|precio debe ser/i)).toBeInTheDocument();
    });
  });

  it('does NOT call onSubmit when form is invalid', async () => {
    renderCreate();
    fireEvent.click(screen.getByRole('button', { name: /crear producto/i }));

    await waitFor(() => expect(screen.getByText(/nombre es requerido/i)).toBeInTheDocument());
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with correct data when form is valid', async () => {
    const user = userEvent.setup();
    renderCreate();

    await user.type(screen.getByPlaceholderText(/Tarifa Luz Premium/i), 'Monitor LG');
    await user.type(screen.getByPlaceholderText(/1299\.99/i), '299.99');

    fireEvent.click(screen.getByRole('button', { name: /crear producto/i }));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Monitor LG',
          price: 299.99,
        })
      );
    });
  });

  // ─── Loading state ────────────────────────────────────────────────────────

  it('disables all buttons when isLoading=true', () => {
    render(
      <ProductForm mode="create" onSubmit={mockSubmit} onCancel={mockCancel} isLoading />
    );
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => expect(btn).toBeDisabled());
  });

  it('shows loading text on submit button when isLoading=true', () => {
    render(
      <ProductForm mode="create" onSubmit={mockSubmit} onCancel={mockCancel} isLoading />
    );
    expect(screen.getByText(/creando/i)).toBeInTheDocument();
  });

  it('shows "Guardando..." when isLoading in edit mode', () => {
    render(
      <ProductForm mode="edit" product={SAMPLE_PRODUCT} onSubmit={mockSubmit} isLoading />
    );
    expect(screen.getByText(/guardando/i)).toBeInTheDocument();
  });
});
