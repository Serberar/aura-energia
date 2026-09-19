import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';

// Mocks before imports
vi.mock('jwt-decode', () => ({ jwtDecode: vi.fn() }));

// Mock ProductList to avoid complex data-fetching
vi.mock('@/features/products', () => ({
  ProductList: ({ onEdit }: any) => (
    <div data-testid="product-list">
      <button
        onClick={() =>
          onEdit({ id: 'p1', name: 'Laptop Dell', description: '', sku: 'DELL-001', price: 1299.99, isActive: true })
        }
      >
        Editar Laptop Dell
      </button>
    </div>
  ),
}));

// Mock productsSlice thunks so they don't call the API
vi.mock('@/features/products/productsSlice', async () => {
  const actual = await vi.importActual('@/features/products/productsSlice');
  return {
    ...actual,
    createProduct: vi.fn(() => ({ type: 'products/create/fulfilled', payload: {} })),
    updateProduct: vi.fn(() => ({ type: 'products/update/fulfilled', payload: {} })),
  };
});

import { renderWithStore } from '@/test-utils/renderWithStore';
import ProductsPage from './ProductsPage';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ProductsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(localStorage.getItem).mockReturnValue(null);
  });

  // ─── Vista inicial ────────────────────────────────────────────────────────

  it('renders "Gestión de Productos" heading', () => {
    renderWithStore(<ProductsPage />);
    expect(screen.getByRole('heading', { name: /gestión de productos/i })).toBeInTheDocument();
  });

  it('renders the product list', () => {
    renderWithStore(<ProductsPage />);
    expect(screen.getByTestId('product-list')).toBeInTheDocument();
  });

  it('renders "+ Nuevo Producto" button', () => {
    renderWithStore(<ProductsPage />);
    expect(screen.getByRole('button', { name: /nuevo producto/i })).toBeInTheDocument();
  });

  it('does not show create form initially', () => {
    renderWithStore(<ProductsPage />);
    expect(screen.queryByRole('heading', { name: /crear producto/i })).not.toBeInTheDocument();
  });

  // ─── Crear producto ───────────────────────────────────────────────────────

  it('shows create form when "+ Nuevo Producto" is clicked', async () => {
    renderWithStore(<ProductsPage />);
    fireEvent.click(screen.getByRole('button', { name: /nuevo producto/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /crear producto/i })).toBeInTheDocument();
    });
  });

  it('hides create form when Cancel is clicked', async () => {
    renderWithStore(<ProductsPage />);
    fireEvent.click(screen.getByRole('button', { name: /nuevo producto/i }));

    await waitFor(() => expect(screen.getByRole('heading', { name: /crear producto/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /crear producto/i })).not.toBeInTheDocument();
    });
  });

  // ─── Editar producto ──────────────────────────────────────────────────────

  it('shows edit form when Edit is clicked from list', async () => {
    renderWithStore(<ProductsPage />);
    fireEvent.click(screen.getByRole('button', { name: /editar laptop dell/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /editar producto/i })).toBeInTheDocument();
    });
  });

  it('hides edit form when Cancel is clicked', async () => {
    renderWithStore(<ProductsPage />);
    fireEvent.click(screen.getByRole('button', { name: /editar laptop dell/i }));

    await waitFor(() => expect(screen.getByRole('heading', { name: /editar producto/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /editar producto/i })).not.toBeInTheDocument();
    });
  });

  // ─── Loading state ────────────────────────────────────────────────────────

  it('disables "+ Nuevo Producto" button when loading', () => {
    renderWithStore(<ProductsPage />, {
      preloadedState: { products: { products: [], loading: true, error: null, lastFetch: null } } as any,
    });
    expect(screen.getByRole('button', { name: /nuevo producto/i })).toBeDisabled();
  });
});
