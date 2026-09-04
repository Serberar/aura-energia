import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithStore } from '@/test-utils/renderWithStore';

const mockNavigate = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import SignatureSettingsPage from './SignatureSettingsPage';

describe('SignatureSettingsPage', () => {
  it('renders page heading', () => {
    renderWithStore(<SignatureSettingsPage />);
    expect(screen.getByRole('heading', { name: /firma electrónica/i })).toBeInTheDocument();
  });

  it('shows Volver button', () => {
    renderWithStore(<SignatureSettingsPage />);
    expect(screen.getByRole('button', { name: /volver/i })).toBeInTheDocument();
  });

  it('navigates to /settings when Volver is clicked', () => {
    renderWithStore(<SignatureSettingsPage />);
    fireEvent.click(screen.getByRole('button', { name: /volver/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/settings');
  });

  it('shows Gestionar button for contract templates', () => {
    renderWithStore(<SignatureSettingsPage />);
    expect(screen.getByRole('button', { name: /gestionar/i })).toBeInTheDocument();
  });

  it('navigates to /settings/contract when Gestionar is clicked', () => {
    renderWithStore(<SignatureSettingsPage />);
    fireEvent.click(screen.getByRole('button', { name: /gestionar/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/settings/contract');
  });
});
