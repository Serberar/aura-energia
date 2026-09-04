import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithStore } from '@/test-utils/renderWithStore';

vi.mock('jwt-decode', () => ({ jwtDecode: vi.fn() }));

const mockNavigate = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/features/settings/services/settingsService', () => ({
  getSetting: vi.fn(() => Promise.resolve({ value: true })),
  setSetting: vi.fn(() => Promise.resolve()),
}));

import SettingsPage from './SettingsPage';

describe('SettingsPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders page heading', () => {
    renderWithStore(<SettingsPage />);
    expect(screen.getByRole('heading', { name: /configuración/i })).toBeInTheDocument();
  });

  it('renders subtitle', () => {
    renderWithStore(<SettingsPage />);
    expect(screen.getByText(/ajustes globales/i)).toBeInTheDocument();
  });

  it('renders Gestionar módulos button', () => {
    renderWithStore(<SettingsPage />);
    expect(screen.getByRole('button', { name: /gestionar módulos/i })).toBeInTheDocument();
  });

  it('navigates to /settings/modules when Gestionar módulos is clicked', () => {
    renderWithStore(<SettingsPage />);
    fireEvent.click(screen.getByRole('button', { name: /gestionar módulos/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/settings/modules');
  });

  it('renders CRM card', () => {
    renderWithStore(<SettingsPage />);
    expect(screen.getByRole('button', { name: /módulo crm/i })).toBeInTheDocument();
  });

  it('renders Llamadas card', () => {
    renderWithStore(<SettingsPage />);
    expect(screen.getByRole('button', { name: /módulo de llamadas/i })).toBeInTheDocument();
  });

  it('renders Firma card', () => {
    renderWithStore(<SettingsPage />);
    expect(screen.getByRole('button', { name: /firma electrónica/i })).toBeInTheDocument();
  });

  it('renders Usuarios card', () => {
    renderWithStore(<SettingsPage />);
    expect(screen.getByRole('button', { name: /gestión de usuarios/i })).toBeInTheDocument();
  });

  it('renders IPs card', () => {
    renderWithStore(<SettingsPage />);
    expect(screen.getByRole('button', { name: /ips permitidas/i })).toBeInTheDocument();
  });

  it('navigates to /settings/crm when CRM card is clicked', () => {
    renderWithStore(<SettingsPage />);
    fireEvent.click(screen.getByRole('button', { name: /módulo crm/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/settings/crm');
  });

  it('navigates to /settings/signature when Firma card is clicked', () => {
    renderWithStore(<SettingsPage />);
    fireEvent.click(screen.getByRole('button', { name: /firma electrónica/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/settings/signature');
  });

  it('navigates to /users when Usuarios card is clicked', () => {
    renderWithStore(<SettingsPage />);
    fireEvent.click(screen.getByRole('button', { name: /gestión de usuarios/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/users');
  });

  it('navigates to /settings/ips when IPs card is clicked', () => {
    renderWithStore(<SettingsPage />);
    fireEvent.click(screen.getByRole('button', { name: /ips permitidas/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/settings/ips');
  });
});
