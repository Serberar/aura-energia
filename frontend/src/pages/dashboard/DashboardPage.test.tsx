import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// Mocks before imports
vi.mock('jwt-decode', () => ({ jwtDecode: vi.fn() }));

// Mock UnifiedSearchResults to avoid complex rendering
vi.mock('@/features/clientes/components/UnifiedSearchResults', () => ({
  UnifiedSearchResults: ({ results, onRemoveResult }: any) => (
    <div data-testid="search-results">
      {results?.map((r: any, i: number) => (
        <div key={i} data-testid="result-item">
          <span>{r.query}</span>
          <button onClick={() => onRemoveResult(i)}>Quitar resultado</button>
        </div>
      ))}
    </div>
  ),
}));

// Mock the unified search hook
const mockPerformSearch = vi.fn().mockResolvedValue(undefined);
const mockClearResults = vi.fn();
const mockRemoveResult = vi.fn();

vi.mock('@/features/clientes/hooks/useUnifiedSearch', () => ({
  useUnifiedSearch: vi.fn(() => ({
    searchResults: [],
    performUnifiedSearch: mockPerformSearch,
    clearResults: mockClearResults,
    removeResult: mockRemoveResult,
    isAnyLoading: false,
  })),
}));

// Mock useToast from design-system
const mockShowWarning = vi.fn();
const mockShowError = vi.fn();

vi.mock('@/design-system', async () => {
  const actual = await vi.importActual('@/design-system');
  return {
    ...actual,
    useToast: vi.fn(() => ({
      showWarning: mockShowWarning,
      showError: mockShowError,
    })),
  };
});

import DashboardPage from './DashboardPage';

function renderPage() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Renderizado inicial ──────────────────────────────────────────────────

  it('renders "Búsqueda de Clientes" heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /búsqueda de clientes/i })).toBeInTheDocument();
  });

  it('renders search input', () => {
    renderPage();
    expect(screen.getByPlaceholderText(/buscar por teléfono/i)).toBeInTheDocument();
  });

  it('renders "Buscar" button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /buscar/i })).toBeInTheDocument();
  });

  it('renders "Limpiar" button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /limpiar/i })).toBeInTheDocument();
  });

  it('renders search results container', () => {
    renderPage();
    expect(screen.getByTestId('search-results')).toBeInTheDocument();
  });

  // ─── Búsqueda ─────────────────────────────────────────────────────────────

  it('shows warning when searching with empty input', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));

    expect(mockShowWarning).toHaveBeenCalledWith(
      expect.stringMatching(/teléfono|dni/i)
    );
  });

  it('does not call performUnifiedSearch when input is empty', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));
    expect(mockPerformSearch).not.toHaveBeenCalled();
  });

  it('calls performUnifiedSearch when Buscar is clicked with input', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText(/buscar por teléfono/i), '666123456');
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));

    await waitFor(() => {
      expect(mockPerformSearch).toHaveBeenCalledWith('666123456');
    });
  });

  it('submits search when Enter is pressed in input', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText(/buscar por teléfono/i), '12345678Z');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(mockPerformSearch).toHaveBeenCalledWith('12345678Z');
    });
  });

  // ─── Limpiar ──────────────────────────────────────────────────────────────

  it('calls clearResults when "Limpiar" is clicked', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /limpiar/i }));
    expect(mockClearResults).toHaveBeenCalledTimes(1);
  });
});
