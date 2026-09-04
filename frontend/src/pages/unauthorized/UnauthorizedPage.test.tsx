import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import UnauthorizedPage from './UnauthorizedPage';

function renderPage() {
  return render(
    <MemoryRouter>
      <UnauthorizedPage />
    </MemoryRouter>
  );
}

describe('UnauthorizedPage', () => {
  it('shows "Acceso denegado" heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /acceso denegado/i })).toBeInTheDocument();
  });

  it('shows permission message', () => {
    renderPage();
    expect(screen.getByText(/no tienes permisos/i)).toBeInTheDocument();
  });

  it('renders "Volver al inicio" button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /volver al inicio/i })).toBeInTheDocument();
  });

  it('navigates to "/" when button clicked', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /volver al inicio/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
