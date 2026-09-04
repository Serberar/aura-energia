import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EmptyState from './EmptyState';

describe('EmptyState', () => {
  // ─── Renderizado básico ────────────────────────────────────────────────────

  it('renders title', () => {
    render(<EmptyState title="No hay datos" />);
    expect(screen.getByRole('heading', { name: 'No hay datos' })).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<EmptyState title="Vacío" description="Añade elementos para continuar" />);
    expect(screen.getByText('Añade elementos para continuar')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    render(<EmptyState title="Vacío" />);
    // No paragraph with description text
    expect(screen.queryByText(/añade/i)).not.toBeInTheDocument();
  });

  // ─── Prop action ──────────────────────────────────────────────────────────

  it('renders action element when provided', () => {
    render(
      <EmptyState title="Sin datos" action={<button>Crear</button>} />
    );
    expect(screen.getByRole('button', { name: 'Crear' })).toBeInTheDocument();
  });

  it('renders secondaryAction when provided', () => {
    render(
      <EmptyState
        title="Sin datos"
        action={<button>Crear</button>}
        secondaryAction={<a href="/">Ir al inicio</a>}
      />
    );
    expect(screen.getByRole('link', { name: 'Ir al inicio' })).toBeInTheDocument();
  });

  it('does not render actions section when neither action nor secondaryAction provided', () => {
    const { container } = render(<EmptyState title="Sin datos" />);
    // The actions wrapper div should not be present
    expect(container.querySelector('[class*="actions"]')).toBeNull();
  });

  // ─── Prop icon personalizado ──────────────────────────────────────────────

  it('renders custom icon when provided', () => {
    render(<EmptyState title="Sin datos" icon={<svg data-testid="custom-icon" />} />);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  // ─── Prop image ───────────────────────────────────────────────────────────

  it('renders image when provided', () => {
    render(<EmptyState title="Sin datos" image="/empty.svg" />);
    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/empty.svg');
    expect(img).toHaveAttribute('alt', 'Sin datos');
  });

  // ─── Prop className ───────────────────────────────────────────────────────

  it('applies custom className', () => {
    const { container } = render(<EmptyState title="Sin datos" className="mi-clase" />);
    expect(container.firstChild).toHaveClass('mi-clase');
  });
});
