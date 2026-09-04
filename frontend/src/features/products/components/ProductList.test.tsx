import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Product } from '@/types/sales';

// Mock hooks and sub-components before importing ProductList
vi.mock('../hooks', () => ({
  useProducts: vi.fn(() => ({
    products: [],
    loading: false,
    error: null,
    stats: { total: 0, active: 0, inactive: 0 },
    refresh: vi.fn(),
  })),
  useProductActions: vi.fn(() => ({
    toggleActive: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  })),
}));

vi.mock('./ProductFilters', () => ({
  default: ({ onCreateClick, showCreateButton }: any) => (
    <div data-testid="product-filters">
      {showCreateButton && onCreateClick && (
        <button onClick={onCreateClick} aria-label="Crear nuevo producto">
          + Nuevo Producto
        </button>
      )}
    </div>
  ),
}));

vi.mock('./ProductCard', () => ({
  default: ({ product, onEdit, onToggleActive }: any) => (
    <div data-testid={`product-card-${product.id}`}>
      <span>{product.name}</span>
      {onEdit && <button onClick={() => onEdit(product)}>Editar</button>}
      {onToggleActive && (
        <button onClick={() => onToggleActive(product)}>
          {product.active ? 'Desactivar' : 'Activar'}
        </button>
      )}
    </div>
  ),
}));

import ProductList from './ProductList';
import * as productHooks from '../hooks';

const mockProduct1: Product = {
  id: 'prod-1', name: 'Seguro Hogar', description: 'Desc', price: 50, sku: 'S1', active: true,
  createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
};
const mockProduct2: Product = {
  id: 'prod-2', name: 'Seguro Vida', description: 'Desc2', price: 80, sku: 'S2', active: false,
  createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
};

function setUseProductsReturn(overrides: Partial<ReturnType<typeof productHooks.useProducts>>) {
  vi.mocked(productHooks.useProducts).mockReturnValue({
    products: [],
    loading: false,
    error: null,
    stats: { total: 0, active: 0, inactive: 0 },
    refresh: vi.fn(),
    ...overrides,
  } as any);
}

describe('ProductList', () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── loading ───────────────────────────────────────────────────────────────

  it('shows loading text when loading=true', () => {
    setUseProductsReturn({ loading: true });
    render(<ProductList />);
    expect(screen.getByText(/cargando productos/i)).toBeInTheDocument();
  });

  // ─── error ─────────────────────────────────────────────────────────────────

  it('shows error message when error is set', () => {
    setUseProductsReturn({ error: 'Error de red' });
    render(<ProductList />);
    expect(screen.getByText(/error al cargar productos/i)).toBeInTheDocument();
    expect(screen.getByText('Error de red')).toBeInTheDocument();
  });

  it('shows Reintentar button on error', () => {
    setUseProductsReturn({ error: 'Error' });
    render(<ProductList />);
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });

  // ─── empty ─────────────────────────────────────────────────────────────────

  it('shows empty message when no products', () => {
    setUseProductsReturn({ products: [] });
    render(<ProductList />);
    expect(screen.getByRole('heading', { name: /no hay productos/i })).toBeInTheDocument();
  });

  // ─── list render ───────────────────────────────────────────────────────────

  it('renders product cards', () => {
    setUseProductsReturn({ products: [mockProduct1, mockProduct2], stats: { total: 2, active: 1, inactive: 1 } });
    render(<ProductList />);
    expect(screen.getByTestId('product-card-prod-1')).toBeInTheDocument();
    expect(screen.getByTestId('product-card-prod-2')).toBeInTheDocument();
  });

  it('renders stats header', () => {
    setUseProductsReturn({ products: [mockProduct1], stats: { total: 1, active: 1, inactive: 0 } });
    render(<ProductList />);
    expect(screen.getByText('Productos')).toBeInTheDocument();
  });

  // ─── onCreate ──────────────────────────────────────────────────────────────

  it('calls onCreate when Nuevo Producto button clicked', async () => {
    setUseProductsReturn({ products: [] });
    const onCreate = vi.fn();
    render(<ProductList onCreate={onCreate} />);
    await userEvent.click(screen.getByRole('button', { name: /nuevo producto/i }));
    expect(onCreate).toHaveBeenCalled();
  });

  // ─── onEdit ────────────────────────────────────────────────────────────────

  it('calls onEdit when edit button inside card clicked', async () => {
    setUseProductsReturn({ products: [mockProduct1] });
    const onEdit = vi.fn();
    render(<ProductList onEdit={onEdit} />);
    await userEvent.click(screen.getByRole('button', { name: /editar/i }));
    expect(onEdit).toHaveBeenCalledWith(mockProduct1);
  });
});
