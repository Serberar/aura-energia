import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Card from './Card';

describe('Card', () => {
  // ─── Renderizado básico ────────────────────────────────────────────────────

  it('renders children', () => {
    render(<Card>Contenido del card</Card>);
    expect(screen.getByText('Contenido del card')).toBeInTheDocument();
  });

  it('renders as div by default (not clickable)', () => {
    const { container } = render(<Card>Texto</Card>);
    expect(container.firstChild?.nodeName).toBe('DIV');
  });

  // ─── Prop clickable ───────────────────────────────────────────────────────

  it('renders as button when clickable=true', () => {
    render(<Card clickable>Clickeable</Card>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls onClick when card is clicked (clickable)', () => {
    const handleClick = vi.fn();
    render(<Card clickable onClick={handleClick}>Click</Card>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not render as button when not clickable', () => {
    render(<Card onClick={vi.fn()}>No clickeable</Card>);
    expect(screen.queryByRole('button')).toBeNull();
  });

  // ─── type=button en elemento clickable ────────────────────────────────────

  it('sets type=button on clickable card to avoid form submit', () => {
    render(<Card clickable>Tipo</Card>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  // ─── Prop className ───────────────────────────────────────────────────────

  it('applies custom className', () => {
    const { container } = render(<Card className="mi-card">Texto</Card>);
    expect(container.firstChild).toHaveClass('mi-card');
  });

  // ─── Prop style ───────────────────────────────────────────────────────────

  it('applies inline styles', () => {
    const { container } = render(<Card style={{ color: 'red' }}>Estilo</Card>);
    expect((container.firstChild as HTMLElement).style.color).toBe('red');
  });

  // ─── Contenido complejo ───────────────────────────────────────────────────

  it('renders nested elements', () => {
    render(
      <Card>
        <h2>Título</h2>
        <p>Párrafo</p>
      </Card>
    );
    expect(screen.getByRole('heading', { name: 'Título' })).toBeInTheDocument();
    expect(screen.getByText('Párrafo')).toBeInTheDocument();
  });
});
