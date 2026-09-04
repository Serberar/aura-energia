import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserForm from './UserForm';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockSubmit = vi.fn().mockResolvedValue(undefined);
const mockCancel = vi.fn();

function renderForm(overrides: Partial<React.ComponentProps<typeof UserForm>> = {}) {
  return render(
    <UserForm onSubmit={mockSubmit} onCancel={mockCancel} isLoading={false} {...overrides} />
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('UserForm', () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── Renderizado ────────────────────────────────────────────────────────────

  it('renders the form heading', () => {
    renderForm();
    expect(screen.getByRole('heading', { name: /crear usuario/i })).toBeInTheDocument();
  });

  it('renders all form fields', () => {
    renderForm();
    expect(screen.getByPlaceholderText(/Ej: Juan/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ej: García/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ej: jgarcia/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Mínimo 6 caracteres/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Repite la contraseña/i)).toBeInTheDocument();
  });

  it('renders role select with all options', () => {
    renderForm();
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Administrador' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Coordinador' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Verificador' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Comercial' })).toBeInTheDocument();
  });

  it('defaults role to "comercial"', () => {
    renderForm();
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('comercial');
  });

  it('renders submit and cancel buttons', () => {
    renderForm();
    expect(screen.getByRole('button', { name: /crear usuario/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
  });

  // ─── Botón cancelar ─────────────────────────────────────────────────────────

  it('calls onCancel when cancel button clicked', () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(mockCancel).toHaveBeenCalledTimes(1);
  });

  // ─── Validaciones ───────────────────────────────────────────────────────────

  describe('validation', () => {
    it('shows required errors when submitting empty form', async () => {
      renderForm();
      fireEvent.click(screen.getByRole('button', { name: /crear usuario/i }));

      await waitFor(() => {
        expect(screen.getByText('El nombre es requerido')).toBeInTheDocument();
        expect(screen.getByText('El apellido es requerido')).toBeInTheDocument();
        expect(screen.getByText('El usuario es requerido')).toBeInTheDocument();
        expect(screen.getByText('La contraseña es requerida')).toBeInTheDocument();
      });
    });

    it('shows error when password is too short (< 6 chars)', async () => {
      const user = userEvent.setup();
      renderForm();

      await user.type(screen.getByPlaceholderText(/Mínimo 6 caracteres/i), '123');
      fireEvent.blur(screen.getByPlaceholderText(/Mínimo 6 caracteres/i));

      await waitFor(() => {
        expect(screen.getByText('La contraseña debe tener al menos 6 caracteres')).toBeInTheDocument();
      });
    });

    it('shows error when passwords do not match', async () => {
      const user = userEvent.setup();
      renderForm();

      await user.type(screen.getByPlaceholderText(/Mínimo 6 caracteres/i), 'password123');
      await user.type(screen.getByPlaceholderText(/Repite la contraseña/i), 'different123');
      fireEvent.blur(screen.getByPlaceholderText(/Repite la contraseña/i));

      await waitFor(() => {
        expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument();
      });
    });

    it('shows error when username is too short', async () => {
      const user = userEvent.setup();
      renderForm();

      await user.type(screen.getByPlaceholderText(/Ej: jgarcia/i), 'ab');
      fireEvent.blur(screen.getByPlaceholderText(/Ej: jgarcia/i));

      await waitFor(() => {
        expect(screen.getByText('El usuario debe tener al menos 3 caracteres')).toBeInTheDocument();
      });
    });

    it('does not call onSubmit when validation fails', async () => {
      renderForm();
      fireEvent.click(screen.getByRole('button', { name: /crear usuario/i }));
      await waitFor(() => expect(screen.getByText('El nombre es requerido')).toBeInTheDocument());
      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it('calls onSubmit with correct payload when form is valid', async () => {
      const user = userEvent.setup();
      renderForm();

      await user.type(screen.getByPlaceholderText(/Ej: Juan/i), 'María');
      await user.type(screen.getByPlaceholderText(/Ej: García/i), 'López');
      await user.type(screen.getByPlaceholderText(/Ej: jgarcia/i), 'mlopez');
      await user.type(screen.getByPlaceholderText(/Mínimo 6 caracteres/i), 'secret123');
      await user.type(screen.getByPlaceholderText(/Repite la contraseña/i), 'secret123');

      // Change role to coordinador
      await user.selectOptions(screen.getByRole('combobox'), 'coordinador');

      fireEvent.click(screen.getByRole('button', { name: /crear usuario/i }));

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith({
          firstName: 'María',
          lastName: 'López',
          username: 'mlopez',
          password: 'secret123',
          role: 'coordinador',
        });
      });
    });
  });

  // ─── Toggle contraseña ──────────────────────────────────────────────────────

  describe('password visibility toggle', () => {
    it('password field is type=password by default', () => {
      renderForm();
      const passwordInput = screen.getByPlaceholderText(/Mínimo 6 caracteres/i);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('toggles password visibility when eye button is clicked', async () => {
      renderForm();
      const passwordInput = screen.getByPlaceholderText(/Mínimo 6 caracteres/i);
      const toggleButtons = screen.getAllByRole('button', { name: /mostrar contraseña/i });

      fireEvent.click(toggleButtons[0]);
      expect(passwordInput).toHaveAttribute('type', 'text');

      fireEvent.click(screen.getAllByRole('button', { name: /ocultar contraseña/i })[0]);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  // ─── Estado loading ─────────────────────────────────────────────────────────

  describe('loading state', () => {
    it('disables submit and cancel buttons when loading', () => {
      renderForm({ isLoading: true });
      expect(screen.getByRole('button', { name: /cancelar/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /creando.../i })).toBeDisabled();
    });
  });
});
