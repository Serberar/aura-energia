import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusIndicator from './StatusIndicator';

describe('StatusIndicator', () => {
  // ─── Renderizado básico ────────────────────────────────────────────────────

  it('renders children text', () => {
    render(<StatusIndicator>Activo</StatusIndicator>);
    expect(screen.getByText('Activo')).toBeInTheDocument();
  });

  it('renders the dot with aria-hidden', () => {
    const { container } = render(<StatusIndicator>Activo</StatusIndicator>);
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  // ─── Prop dotOnly ────────────────────────────────────────────────────────

  it('does not render text when dotOnly=true', () => {
    render(<StatusIndicator dotOnly>Activo</StatusIndicator>);
    expect(screen.queryByText('Activo')).not.toBeInTheDocument();
  });

  it('still renders dot when dotOnly=true', () => {
    const { container } = render(<StatusIndicator dotOnly />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  // ─── Prop customColor ─────────────────────────────────────────────────────

  it('applies customColor as inline style on the dot', () => {
    const { container } = render(
      <StatusIndicator customColor="#ff0000">Estado</StatusIndicator>
    );
    const dot = container.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(dot.style.backgroundColor).toBe('rgb(255, 0, 0)');
  });

  it('does not apply inline style when no customColor', () => {
    const { container } = render(<StatusIndicator variant="success">Estado</StatusIndicator>);
    const dot = container.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(dot.style.backgroundColor).toBe('');
  });

  // ─── Prop className ───────────────────────────────────────────────────────

  it('applies custom className', () => {
    const { container } = render(<StatusIndicator className="mi-clase">Estado</StatusIndicator>);
    expect(container.firstChild).toHaveClass('mi-clase');
  });

  // ─── Sin children ─────────────────────────────────────────────────────────

  it('renders without children (dot only with text prop absent)', () => {
    const { container } = render(<StatusIndicator />);
    // Should render the container span with the dot
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });
});
