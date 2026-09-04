import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductCard from './ProductCard';
import type { Product } from '@/types/sales';

const mockProduct: Product = {
  id: 'prod-1',
  name: 'Seguro Hogar',
  description: 'Protección del hogar',
  price: 49.99,
  sku: 'SEG-001',
  active: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockInactiveProduct: Product = {
  ...mockProduct,
  id: 'prod-2',
  name: 'Seguro Vida',
  description: 'Cobertura de vida',
  active: false,
};

describe('ProductCard', () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── render ────────────────────────────────────────────────────────────────

  it('renders product name', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Seguro Hogar')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Protección del hogar')).toBeInTheDocument();
  });

  it('renders SKU', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText(/SEG-001/)).toBeInTheDocument();
  });

  it('shows "Activo" badge when product is active', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Activo')).toBeInTheDocument();
  });

  it('shows "Inactivo" badge when product is inactive', () => {
    render(<ProductCard product={mockInactiveProduct} />);
    expect(screen.getByText('Inactivo')).toBeInTheDocument();
  });

  it('renders formatted price', () => {
    render(<ProductCard product={mockProduct} />);
    // Price formatted as EUR currency
    expect(screen.getByText(/49,99/)).toBeInTheDocument();
  });

  // ─── actions ───────────────────────────────────────────────────────────────

  it('shows Editar button when showActions=true', () => {
    render(<ProductCard product={mockProduct} onEdit={vi.fn()} />);
    expect(screen.getByRole('button', { name: /editar producto/i })).toBeInTheDocument();
  });

  it('hides action buttons when showActions=false', () => {
    render(<ProductCard product={mockProduct} showActions={false} onEdit={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /editar producto/i })).toBeNull();
  });

  it('calls onEdit with product when Editar clicked', async () => {
    const onEdit = vi.fn();
    render(<ProductCard product={mockProduct} onEdit={onEdit} />);
    await userEvent.click(screen.getByRole('button', { name: /editar producto/i }));
    expect(onEdit).toHaveBeenCalledWith(mockProduct);
  });

  it('shows "Desactivar" when product is active', () => {
    render(<ProductCard product={mockProduct} onToggleActive={vi.fn()} />);
    expect(screen.getByRole('button', { name: /desactivar producto/i })).toBeInTheDocument();
  });

  it('shows "Activar" when product is inactive', () => {
    render(<ProductCard product={mockInactiveProduct} onToggleActive={vi.fn()} />);
    expect(screen.getByRole('button', { name: /activar producto/i })).toBeInTheDocument();
  });

  it('calls onToggleActive with product when toggle clicked', async () => {
    const onToggleActive = vi.fn();
    render(<ProductCard product={mockProduct} onToggleActive={onToggleActive} />);
    await userEvent.click(screen.getByRole('button', { name: /desactivar producto/i }));
    expect(onToggleActive).toHaveBeenCalledWith(mockProduct);
  });

  // ─── compact mode ──────────────────────────────────────────────────────────

  it('hides description in compact mode', () => {
    render(<ProductCard product={mockProduct} compact={true} />);
    expect(screen.queryByText('Protección del hogar')).toBeNull();
  });

  it('calls onClick with product when card clicked', async () => {
    const onClick = vi.fn();
    const { container } = render(<ProductCard product={mockProduct} onClick={onClick} />);
    await userEvent.click(container.firstChild as HTMLElement);
    expect(onClick).toHaveBeenCalledWith(mockProduct);
  });
});
