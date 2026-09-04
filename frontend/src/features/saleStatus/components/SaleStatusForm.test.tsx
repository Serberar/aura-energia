import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SaleStatusForm from './SaleStatusForm';
import type { SaleStatus } from '@/types/sales';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockSubmit = vi.fn();
const mockCancel = vi.fn();

function renderForm(overrides: Partial<React.ComponentProps<typeof SaleStatusForm>> = {}) {
  return render(
    <SaleStatusForm onSubmit={mockSubmit} onCancel={mockCancel} loading={false} {...overrides} />
  );
}

const mockStatus: SaleStatus = {
  id: 'status-1',
  name: 'En Proceso',
  order: 2,
  color: '#00FF00',
  isFinal: false,
  isCancelled: false,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SaleStatusForm', () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── Modo crear ─────────────────────────────────────────────────────────────

  describe('create mode (no status prop)', () => {
    it('renders "Nuevo Estado" heading', () => {
      renderForm();
      expect(screen.getByRole('heading', { name: /nuevo estado/i })).toBeInTheDocument();
    });

    it('renders name, order, and color fields', () => {
      renderForm();
      expect(screen.getByPlaceholderText(/Ej: Pendiente/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('0')).toBeInTheDocument(); // order
    });

    it('renders the "Crear" submit button', () => {
      renderForm();
      expect(screen.getByRole('button', { name: /^crear$/i })).toBeInTheDocument();
    });

    it('renders the isFinal and isCancelled checkboxes', () => {
      renderForm();
      expect(screen.getByLabelText(/es un estado final/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/es un estado de cancelación/i)).toBeInTheDocument();
    });

    it('calls onCancel when cancel button is clicked', () => {
      renderForm();
      fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
      expect(mockCancel).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Modo editar ────────────────────────────────────────────────────────────

  describe('edit mode (with status prop)', () => {
    it('renders "Editar Estado" heading', () => {
      renderForm({ status: mockStatus });
      expect(screen.getByRole('heading', { name: /editar estado/i })).toBeInTheDocument();
    });

    it('pre-fills form with existing status data', () => {
      renderForm({ status: mockStatus });
      expect(screen.getByDisplayValue('En Proceso')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2')).toBeInTheDocument(); // order
    });

    it('renders the "Actualizar" submit button', () => {
      renderForm({ status: mockStatus });
      expect(screen.getByRole('button', { name: /actualizar/i })).toBeInTheDocument();
    });
  });

  // ─── Validación ─────────────────────────────────────────────────────────────

  describe('validation', () => {
    it('shows error when submitting without name', async () => {
      renderForm();
      fireEvent.click(screen.getByRole('button', { name: /^crear$/i }));

      await waitFor(() => {
        // Zod validates name is required - some error related to name appears
        const errorMessages = screen.queryAllByText((text) =>
          text.toLowerCase().includes('nombre') || text.toLowerCase().includes('requerido') || text.toLowerCase().includes('required')
        );
        expect(errorMessages.length).toBeGreaterThan(0);
      });
    });

    it('does not call onSubmit when name is empty', async () => {
      renderForm();
      fireEvent.click(screen.getByRole('button', { name: /^crear$/i }));
      await waitFor(() => expect(mockSubmit).not.toHaveBeenCalled());
    });

    it('calls onSubmit with correct data when form is valid', async () => {
      const user = userEvent.setup();
      renderForm();

      await user.type(screen.getByPlaceholderText(/Ej: Pendiente/i), 'Pendiente');
      // Clear order and set 3
      const orderInput = screen.getByDisplayValue('0');
      await user.clear(orderInput);
      await user.type(orderInput, '3');

      fireEvent.click(screen.getByRole('button', { name: /^crear$/i }));

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Pendiente',
            order: 3,
          })
        );
      });
    });

    it('toggles isFinal checkbox', async () => {
      renderForm();
      const checkbox = screen.getByLabelText(/es un estado final/i);
      expect(checkbox).not.toBeChecked();
      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();
    });

    it('toggles isCancelled checkbox', async () => {
      renderForm();
      const checkbox = screen.getByLabelText(/es un estado de cancelación/i);
      expect(checkbox).not.toBeChecked();
      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();
    });
  });

  // ─── Estado loading ─────────────────────────────────────────────────────────

  describe('loading state', () => {
    it('shows "Guardando..." text on submit button when loading', () => {
      renderForm({ loading: true });
      expect(screen.getByRole('button', { name: /guardando/i })).toBeInTheDocument();
    });

    it('disables buttons when loading=true', () => {
      renderForm({ loading: true });
      const cancelBtn = screen.getByRole('button', { name: /cancelar/i });
      expect(cancelBtn).toBeDisabled();
    });
  });

  // ─── Error message ──────────────────────────────────────────────────────────

  it('shows error message when error prop is provided', () => {
    renderForm({ error: 'Error del servidor' });
    expect(screen.getByText('Error del servidor')).toBeInTheDocument();
  });

  // ─── Badge preview ──────────────────────────────────────────────────────────

  it('shows badge preview with initial "Preview" text', () => {
    renderForm();
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('updates badge preview when name is typed', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByPlaceholderText(/Ej: Pendiente/i), 'Activo');

    await waitFor(() => {
      expect(screen.getByText('Activo')).toBeInTheDocument();
    });
  });
});
