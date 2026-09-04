import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Select from './Select';

const OPTIONS = [
  { value: 'admin', label: 'Administrador' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'verificador', label: 'Verificador', disabled: true },
];

describe('Select', () => {
  // ─── Renderizado básico ────────────────────────────────────────────────────

  it('renders a select element', () => {
    render(<Select options={OPTIONS} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders all options', () => {
    render(<Select options={OPTIONS} />);
    expect(screen.getByRole('option', { name: 'Administrador' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Comercial' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Verificador' })).toBeInTheDocument();
  });

  it('renders disabled option when option.disabled=true', () => {
    render(<Select options={OPTIONS} />);
    const disabledOption = screen.getByRole('option', { name: 'Verificador' });
    expect(disabledOption).toBeDisabled();
  });

  // ─── Prop label ───────────────────────────────────────────────────────────

  it('renders label when provided', () => {
    render(<Select options={OPTIONS} label="Rol" id="rol" />);
    expect(screen.getByText('Rol')).toBeInTheDocument();
  });

  it('associates label with select via htmlFor', () => {
    render(<Select options={OPTIONS} label="Rol" id="rol" />);
    const label = screen.getByText('Rol').closest('label');
    expect(label).toHaveAttribute('for', 'rol');
  });

  it('renders asterisk when required', () => {
    render(<Select options={OPTIONS} label="Rol" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('does not render asterisk when not required', () => {
    render(<Select options={OPTIONS} label="Rol" />);
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  // ─── Prop placeholder ─────────────────────────────────────────────────────

  it('renders placeholder option when provided', () => {
    render(<Select options={OPTIONS} placeholder="Selecciona un rol" />);
    expect(screen.getByRole('option', { name: 'Selecciona un rol' })).toBeInTheDocument();
  });

  it('placeholder option is disabled', () => {
    render(<Select options={OPTIONS} placeholder="Selecciona un rol" />);
    expect(screen.getByRole('option', { name: 'Selecciona un rol' })).toBeDisabled();
  });

  // ─── Prop error ───────────────────────────────────────────────────────────

  it('renders error message when provided', () => {
    render(<Select options={OPTIONS} error="Campo requerido" />);
    expect(screen.getByText('Campo requerido')).toBeInTheDocument();
  });

  it('renders helpText when no error', () => {
    render(<Select options={OPTIONS} helpText="Elige un valor" />);
    expect(screen.getByText('Elige un valor')).toBeInTheDocument();
  });

  it('shows error instead of helpText when both provided', () => {
    render(<Select options={OPTIONS} error="Error" helpText="Ayuda" />);
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.queryByText('Ayuda')).not.toBeInTheDocument();
  });

  // ─── Prop disabled ────────────────────────────────────────────────────────

  it('disables the select element when disabled=true', () => {
    render(<Select options={OPTIONS} disabled />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  // ─── Eventos ──────────────────────────────────────────────────────────────

  it('calls onChange when selection changes', () => {
    const handleChange = vi.fn();
    render(<Select options={OPTIONS} onChange={handleChange} value="admin" />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'comercial' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('calls onFocus when select receives focus', () => {
    const handleFocus = vi.fn();
    render(<Select options={OPTIONS} onFocus={handleFocus} />);
    fireEvent.focus(screen.getByRole('combobox'));
    expect(handleFocus).toHaveBeenCalledTimes(1);
  });

  it('calls onBlur when select loses focus', () => {
    const handleBlur = vi.fn();
    render(<Select options={OPTIONS} onBlur={handleBlur} />);
    fireEvent.blur(screen.getByRole('combobox'));
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  // ─── forwardRef ───────────────────────────────────────────────────────────

  it('forwards ref to the select element', () => {
    const ref = { current: null as HTMLSelectElement | null };
    render(<Select options={OPTIONS} ref={ref} />);
    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName).toBe('SELECT');
  });
});
