import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Input from './Input';

describe('Input', () => {
  // ─── Renderizado básico ───────────────────────────────────────────────────

  it('renders an input element', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders label when provided', () => {
    render(<Input label="Nombre" />);
    expect(screen.getByText('Nombre')).toBeInTheDocument();
  });

  it('associates label with input via htmlFor', () => {
    render(<Input label="Nombre" id="nombre-input" />);
    const label = screen.getByText('Nombre');
    expect(label).toHaveAttribute('for', 'nombre-input');
  });

  // ─── Estado requerido ──────────────────────────────────────────────────────

  it('shows asterisk when required', () => {
    render(<Input label="Nombre" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('does not show asterisk when not required', () => {
    render(<Input label="Nombre" />);
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  // ─── Estado de error ───────────────────────────────────────────────────────

  it('renders error message when error prop is provided', () => {
    render(<Input error="El campo es requerido" />);
    expect(screen.getByText('El campo es requerido')).toBeInTheDocument();
  });

  it('does not show error when error prop is undefined', () => {
    render(<Input />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows error over helpText when both are provided', () => {
    render(<Input error="Error" helpText="Texto de ayuda" />);
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.queryByText('Texto de ayuda')).not.toBeInTheDocument();
  });

  // ─── helpText ─────────────────────────────────────────────────────────────

  it('renders helpText when no error', () => {
    render(<Input helpText="Ingresa tu nombre completo" />);
    expect(screen.getByText('Ingresa tu nombre completo')).toBeInTheDocument();
  });

  // ─── Estado disabled ───────────────────────────────────────────────────────

  it('disables the input when disabled prop is true', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  // ─── Eventos ───────────────────────────────────────────────────────────────

  it('fires onChange when user types', () => {
    const onChange = vi.fn();
    render(<Input onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Juan' } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('fires onFocus when input is focused', () => {
    const onFocus = vi.fn();
    render(<Input onFocus={onFocus} />);
    fireEvent.focus(screen.getByRole('textbox'));
    expect(onFocus).toHaveBeenCalledTimes(1);
  });

  it('fires onBlur when input loses focus', () => {
    const onBlur = vi.fn();
    render(<Input onBlur={onBlur} />);
    fireEvent.blur(screen.getByRole('textbox'));
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  // ─── Adornments ───────────────────────────────────────────────────────────

  it('renders startAdornment when provided', () => {
    render(<Input startAdornment={<span data-testid="start">€</span>} />);
    expect(screen.getByTestId('start')).toBeInTheDocument();
  });

  it('renders endAdornment when provided', () => {
    render(<Input endAdornment={<span data-testid="end">👁️</span>} />);
    expect(screen.getByTestId('end')).toBeInTheDocument();
  });

  // ─── Tipos de input ────────────────────────────────────────────────────────

  it('renders password input when type=password', () => {
    render(<Input type="password" />);
    expect(screen.getByDisplayValue('')).toHaveAttribute('type', 'password');
  });

  it('renders with placeholder text', () => {
    render(<Input placeholder="Escribe aquí..." />);
    expect(screen.getByPlaceholderText('Escribe aquí...')).toBeInTheDocument();
  });

  // ─── forwardRef ────────────────────────────────────────────────────────────

  it('forwards ref to the input element', () => {
    const ref = vi.fn();
    render(<Input ref={ref} />);
    expect(ref).toHaveBeenCalled();
    expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLInputElement);
  });
});
