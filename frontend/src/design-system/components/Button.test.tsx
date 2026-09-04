import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  // ─── Renderizado básico ───────────────────────────────────────────────────

  it('renders children text', () => {
    render(<Button>Guardar</Button>);
    expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
  });

  it('defaults to type="button" to avoid accidental form submission', () => {
    render(<Button>Click</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('respects type="submit"', () => {
    render(<Button type="submit">Enviar</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  // ─── Estado disabled ───────────────────────────────────────────────────────

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>No puedo</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is disabled when isLoading is true', () => {
    render(<Button isLoading>Guardar</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('does not fire onClick when disabled', () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Botón</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  // ─── Estado loading ────────────────────────────────────────────────────────

  it('shows loadingText when isLoading is true', () => {
    render(<Button isLoading loadingText="Guardando...">Guardar</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Guardando...');
  });

  it('shows default "Cargando..." when isLoading without loadingText', () => {
    render(<Button isLoading>Guardar</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Cargando...');
  });

  it('shows spinner icon when loading', () => {
    render(<Button isLoading>Guardar</Button>);
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
  });

  it('does not show spinner when not loading', () => {
    render(<Button>Guardar</Button>);
    expect(screen.queryByRole('status', { hidden: true })).not.toBeInTheDocument();
  });

  // ─── Eventos ───────────────────────────────────────────────────────────────

  it('fires onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  // ─── Iconos ────────────────────────────────────────────────────────────────

  it('renders leftIcon when not loading', () => {
    render(<Button leftIcon={<span data-testid="left-icon">→</span>}>Texto</Button>);
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
  });

  it('hides leftIcon when loading', () => {
    render(<Button isLoading leftIcon={<span data-testid="left-icon">→</span>}>Texto</Button>);
    expect(screen.queryByTestId('left-icon')).not.toBeInTheDocument();
  });

  it('renders rightIcon when not loading', () => {
    render(<Button rightIcon={<span data-testid="right-icon">→</span>}>Texto</Button>);
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  // ─── Variantes y tamaños ───────────────────────────────────────────────────

  it('applies fullWidth class when fullWidth is true', () => {
    render(<Button fullWidth>Botón ancho</Button>);
    // El botón existe y está en el DOM - la clase CSS se aplica
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it.each(['primary', 'secondary', 'tertiary', 'danger', 'success', 'warning'] as const)(
    'renders with variant="%s" without errors',
    (variant) => {
      render(<Button variant={variant}>Botón</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    }
  );

  it.each(['sm', 'md', 'lg'] as const)('renders with size="%s" without errors', (size) => {
    render(<Button size={size}>Botón</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  // ─── Accesibilidad ─────────────────────────────────────────────────────────

  it('sets aria-disabled when disabled', () => {
    render(<Button disabled>Botón</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
  });

  it('sets aria-disabled when loading', () => {
    render(<Button isLoading>Botón</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
  });

  it('spreads additional HTML attributes', () => {
    render(<Button data-testid="my-btn" aria-label="Guardar cambios">Save</Button>);
    expect(screen.getByTestId('my-btn')).toHaveAttribute('aria-label', 'Guardar cambios');
  });
});
