import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createRef } from 'react';
import DatePicker from './DatePicker';

describe('DatePicker', () => {
  // ─── label ─────────────────────────────────────────────────────────────────

  it('renders label when provided', () => {
    render(<DatePicker label="Fecha de nacimiento" />);
    expect(screen.getByText('Fecha de nacimiento')).toBeInTheDocument();
  });

  it('does not render label when not provided', () => {
    const { container } = render(<DatePicker />);
    expect(container.querySelector('label')).toBeNull();
  });

  it('shows asterisk when required', () => {
    render(<DatePicker label="Fecha" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('does not show asterisk when not required', () => {
    render(<DatePicker label="Fecha" />);
    expect(screen.queryByText('*')).toBeNull();
  });

  // ─── input type ────────────────────────────────────────────────────────────

  it('renders date input by default', () => {
    const { container } = render(<DatePicker />);
    expect(container.querySelector('input[type="date"]')).toBeInTheDocument();
  });

  it('renders datetime-local input when includeTime=true', () => {
    const { container } = render(<DatePicker includeTime />);
    expect(container.querySelector('input[type="datetime-local"]')).toBeInTheDocument();
  });

  // ─── error ─────────────────────────────────────────────────────────────────

  it('shows error text when error prop provided', () => {
    render(<DatePicker error="Fecha inválida" />);
    expect(screen.getByText('Fecha inválida')).toBeInTheDocument();
  });

  it('does not show helpText when error is also present', () => {
    render(<DatePicker error="Error" helpText="Ayuda" />);
    expect(screen.queryByText('Ayuda')).toBeNull();
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  // ─── helpText ──────────────────────────────────────────────────────────────

  it('shows helpText when no error', () => {
    render(<DatePicker helpText="Selecciona una fecha" />);
    expect(screen.getByText('Selecciona una fecha')).toBeInTheDocument();
  });

  // ─── minDate / maxDate ─────────────────────────────────────────────────────

  it('passes minDate to input min attribute', () => {
    const { container } = render(<DatePicker minDate="2024-01-01" />);
    expect(container.querySelector('input')).toHaveAttribute('min', '2024-01-01');
  });

  it('passes maxDate to input max attribute', () => {
    const { container } = render(<DatePicker maxDate="2024-12-31" />);
    expect(container.querySelector('input')).toHaveAttribute('max', '2024-12-31');
  });

  // ─── disabled ──────────────────────────────────────────────────────────────

  it('disables input when disabled=true', () => {
    const { container } = render(<DatePicker disabled />);
    expect(container.querySelector('input')).toBeDisabled();
  });

  // ─── focus / blur ──────────────────────────────────────────────────────────

  it('calls onFocus prop when input focused', () => {
    const onFocus = vi.fn();
    const { container } = render(<DatePicker onFocus={onFocus} />);
    fireEvent.focus(container.querySelector('input')!);
    expect(onFocus).toHaveBeenCalled();
  });

  it('calls onBlur prop when input blurred', () => {
    const onBlur = vi.fn();
    const { container } = render(<DatePicker onBlur={onBlur} />);
    fireEvent.blur(container.querySelector('input')!);
    expect(onBlur).toHaveBeenCalled();
  });

  // ─── ref forwarding ────────────────────────────────────────────────────────

  it('forwards ref to the input element', () => {
    const ref = createRef<HTMLInputElement>();
    const { container } = render(<DatePicker ref={ref} />);
    expect(ref.current).toBe(container.querySelector('input'));
  });

  // ─── value passthrough ─────────────────────────────────────────────────────

  it('passes value to input', () => {
    const { container } = render(<DatePicker value="2024-06-15" onChange={vi.fn()} />);
    expect(container.querySelector('input')).toHaveValue('2024-06-15');
  });
});
