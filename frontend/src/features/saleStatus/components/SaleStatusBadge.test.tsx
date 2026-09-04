import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SaleStatusBadge from './SaleStatusBadge';

describe('SaleStatusBadge', () => {
  // ─── render ────────────────────────────────────────────────────────────────

  it('renders the name', () => {
    render(<SaleStatusBadge name="Inicial" />);
    expect(screen.getByText('Inicial')).toBeInTheDocument();
  });

  it('does not show checkmark when isFinal=false', () => {
    render(<SaleStatusBadge name="En proceso" isFinal={false} />);
    expect(screen.queryByTitle('Estado final')).toBeNull();
  });

  it('shows checkmark indicator when isFinal=true', () => {
    render(<SaleStatusBadge name="Completado" isFinal={true} />);
    expect(screen.getByTitle('Estado final')).toBeInTheDocument();
  });

  it('applies background color via style', () => {
    const { container } = render(<SaleStatusBadge name="Test" color="#ff0000" />);
    const badge = container.querySelector('span');
    expect(badge).toHaveStyle({ backgroundColor: '#ff0000' });
  });

  it('uses default color when none provided', () => {
    const { container } = render(<SaleStatusBadge name="Default" />);
    const badge = container.querySelector('span');
    expect(badge).toHaveStyle({ backgroundColor: '#6c757d' });
  });

  it('renders different size classes without crashing', () => {
    const { rerender } = render(<SaleStatusBadge name="X" size="sm" />);
    expect(screen.getByText('X')).toBeInTheDocument();
    rerender(<SaleStatusBadge name="X" size="lg" />);
    expect(screen.getByText('X')).toBeInTheDocument();
  });
});
