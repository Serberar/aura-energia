import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClientForm from './ClientForm';
import type { Client } from '@/types/sales';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockSubmit = vi.fn().mockResolvedValue(undefined);
const mockCancel = vi.fn();

function renderCreateForm(overrides: Partial<React.ComponentProps<typeof ClientForm>> = {}) {
  return render(
    <ClientForm
      mode="create"
      onSubmit={mockSubmit}
      onCancel={mockCancel}
      isLoading={false}
      {...(overrides as any)}
    />
  );
}

const mockClient: Client = {
  id: 'client-1',
  firstName: 'John',
  lastName: 'Doe',
  dni: '12345678A',
  email: 'john@example.com',
  birthday: '1990-01-15',
  phones: ['612345678'],
  addresses: [],
  bankAccounts: [],
  comments: [],
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ClientForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Modo create ────────────────────────────────────────────────────────────

  describe('mode: create', () => {
    it('renders "Crear Cliente" heading', () => {
      renderCreateForm();
      expect(screen.getByRole('heading', { name: /crear cliente/i })).toBeInTheDocument();
    });

    it('renders all required fields', () => {
      renderCreateForm();
      expect(screen.getByPlaceholderText(/Ej: Juan/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Ej: García López/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Ej: 12345678A/i)).toBeInTheDocument();
    });

    it('renders submit button with "Crear Cliente"', () => {
      renderCreateForm();
      expect(screen.getByRole('button', { name: /crear cliente/i })).toBeInTheDocument();
    });

    it('renders cancel button', () => {
      renderCreateForm();
      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
    });

    it('calls onCancel when cancel button is clicked', () => {
      renderCreateForm();
      fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
      expect(mockCancel).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Modo edit ──────────────────────────────────────────────────────────────

  describe('mode: edit', () => {
    it('renders "Editar Cliente" heading', () => {
      render(
        <ClientForm
          mode="edit"
          client={mockClient}
          onSubmit={mockSubmit}
          onCancel={mockCancel}
        />
      );
      expect(screen.getByRole('heading', { name: /editar cliente/i })).toBeInTheDocument();
    });

    it('pre-fills form fields with existing client data', () => {
      render(
        <ClientForm
          mode="edit"
          client={mockClient}
          onSubmit={mockSubmit}
          onCancel={mockCancel}
        />
      );
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('12345678A')).toBeInTheDocument();
    });

    it('renders "Guardar Cambios" submit button', () => {
      render(
        <ClientForm
          mode="edit"
          client={mockClient}
          onSubmit={mockSubmit}
          onCancel={mockCancel}
        />
      );
      expect(screen.getByRole('button', { name: /guardar cambios/i })).toBeInTheDocument();
    });
  });

  // ─── Validaciones ───────────────────────────────────────────────────────────

  describe('validation', () => {
    it('shows required field errors when submitting empty form', async () => {
      renderCreateForm();
      fireEvent.click(screen.getByRole('button', { name: /crear cliente/i }));

      await waitFor(() => {
        expect(screen.getByText('El nombre es requerido')).toBeInTheDocument();
      });
      expect(screen.getByText('Los apellidos son requeridos')).toBeInTheDocument();
      expect(screen.getByText('El DNI es requerido')).toBeInTheDocument();
    });

    it('shows phone error when no phone is provided on create', async () => {
      renderCreateForm();
      // Fill required fields but leave phone empty
      fireEvent.change(screen.getByPlaceholderText(/Ej: Juan/i), { target: { value: 'Juan' } });
      fireEvent.change(screen.getByPlaceholderText(/Ej: García López/i), { target: { value: 'García' } });
      fireEvent.change(screen.getByPlaceholderText(/Ej: 12345678A/i), { target: { value: '12345678A' } });

      fireEvent.click(screen.getByRole('button', { name: /crear cliente/i }));

      await waitFor(() => {
        expect(screen.getByText('Debe proporcionar al menos un teléfono')).toBeInTheDocument();
      });
    });

    it('shows email validation error for invalid email', async () => {
      const user = userEvent.setup();
      renderCreateForm();

      await user.type(screen.getByPlaceholderText(/Ej: cliente@example.com/i), 'not-an-email');
      fireEvent.blur(screen.getByPlaceholderText(/Ej: cliente@example.com/i));

      await waitFor(() => {
        expect(screen.getByText('Email inválido')).toBeInTheDocument();
      });
    });

    it('does not call onSubmit when form is invalid', async () => {
      renderCreateForm();
      fireEvent.click(screen.getByRole('button', { name: /crear cliente/i }));
      await waitFor(() => {
        expect(screen.getByText('El nombre es requerido')).toBeInTheDocument();
      });
      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it('calls onSubmit with correct data when form is valid', async () => {
      const user = userEvent.setup();
      renderCreateForm();

      await user.type(screen.getByPlaceholderText(/Ej: Juan/i), 'Ana');
      await user.type(screen.getByPlaceholderText(/Ej: García López/i), 'Martínez');
      await user.type(screen.getByPlaceholderText(/Ej: 12345678A/i), '12345678A');
      await user.type(screen.getByPlaceholderText(/Ej: 612345678/i), '612000111');

      fireEvent.click(screen.getByRole('button', { name: /crear cliente/i }));

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            firstName: 'Ana',
            lastName: 'Martínez',
            dni: '12345678A',
            phones: ['612000111'],
          })
        );
      });
    });
  });

  // ─── Estado loading ─────────────────────────────────────────────────────────

  describe('loading state', () => {
    it('disables all buttons when isLoading=true', () => {
      renderCreateForm({ isLoading: true } as any);
      const buttons = screen.getAllByRole('button');
      buttons.forEach((btn) => {
        expect(btn).toBeDisabled();
      });
    });

    it('shows loading text on submit button when loading', () => {
      renderCreateForm({ isLoading: true } as any);
      expect(screen.getByRole('button', { name: /creando/i })).toBeInTheDocument();
    });
  });

  // ─── Campos dinámicos (teléfonos) ──────────────────────────────────────────

  describe('dynamic phone fields', () => {
    it('starts with one phone field', () => {
      renderCreateForm();
      const phoneInputs = screen.getAllByPlaceholderText(/Ej: 612345678/i);
      expect(phoneInputs).toHaveLength(1);
    });

    it('adds a phone field when "Añadir teléfono" is clicked', async () => {
      renderCreateForm();
      fireEvent.click(screen.getByRole('button', { name: /añadir teléfono/i }));
      await waitFor(() => {
        const phoneInputs = screen.getAllByPlaceholderText(/Ej: 612345678/i);
        expect(phoneInputs).toHaveLength(2);
      });
    });

    it('removes a phone field when × is clicked (with multiple phones)', async () => {
      renderCreateForm();
      // Add a second phone
      fireEvent.click(screen.getByRole('button', { name: /añadir teléfono/i }));
      await waitFor(() => expect(screen.getAllByPlaceholderText(/612345678/i)).toHaveLength(2));

      // Remove the second phone (first × button)
      const removeButtons = screen.getAllByRole('button', { name: '✕' });
      fireEvent.click(removeButtons[0]);

      await waitFor(() => {
        expect(screen.getAllByPlaceholderText(/Ej: 612345678/i)).toHaveLength(1);
      });
    });
  });
});
