import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Badge from './Badge';

describe('Badge', () => {
  // ─── Renderizado básico ────────────────────────────────────────────────────

  it('renders children text', () => {
    render(<Badge>Activo</Badge>);
    expect(screen.getByText('Activo')).toBeInTheDocument();
  });

  it('renders with default variant neutral', () => {
    const { container } = render(<Badge>Texto</Badge>);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders as a span element', () => {
    render(<Badge>Texto</Badge>);
    const el = screen.getByText('Texto').closest('span');
    expect(el?.tagName).toBe('SPAN');
  });

  // ─── Prop dot ─────────────────────────────────────────────────────────────

  it('does not render dot element when dot=false (default)', () => {
    const { container } = render(<Badge>Sin punto</Badge>);
    // aria-hidden dot span should not exist
    const ariaHidden = container.querySelector('[aria-hidden="true"]');
    expect(ariaHidden).toBeNull();
  });

  it('renders dot element when dot=true', () => {
    const { container } = render(<Badge dot>Con punto</Badge>);
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  // ─── Prop onClick ─────────────────────────────────────────────────────────

  it('does not have role=button when no onClick', () => {
    render(<Badge>Sin click</Badge>);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('has role=button when onClick is provided', () => {
    render(<Badge onClick={vi.fn()}>Clickeable</Badge>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Badge onClick={handleClick}>Click me</Badge>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('calls onClick when Enter key is pressed', () => {
    const handleClick = vi.fn();
    render(<Badge onClick={handleClick}>Enter</Badge>);
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('calls onClick when Space key is pressed', () => {
    const handleClick = vi.fn();
    render(<Badge onClick={handleClick}>Space</Badge>);
    fireEvent.keyDown(screen.getByRole('button'), { key: ' ' });
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick for other keys', () => {
    const handleClick = vi.fn();
    render(<Badge onClick={handleClick}>Other</Badge>);
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Tab' });
    expect(handleClick).not.toHaveBeenCalled();
  });

  // ─── Prop tabIndex ────────────────────────────────────────────────────────

  it('has tabIndex=0 when onClick is provided', () => {
    render(<Badge onClick={vi.fn()}>Tab</Badge>);
    expect(screen.getByRole('button')).toHaveAttribute('tabindex', '0');
  });

  // ─── className personalizado ──────────────────────────────────────────────

  it('applies custom className', () => {
    const { container } = render(<Badge className="mi-clase">Texto</Badge>);
    expect(container.firstChild).toHaveClass('mi-clase');
  });
});
