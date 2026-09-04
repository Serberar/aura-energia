import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithStore } from '@/test-utils/renderWithStore';

vi.mock('jwt-decode', () => ({ jwtDecode: vi.fn() }));

vi.mock('@/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), error: vi.fn(), apiError: vi.fn(), warn: vi.fn(), userAction: vi.fn() },
}));

const mockNavigate = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/features/allowedIps/services/allowedIpService', () => ({
  getIpFilterMode: vi.fn(),
  setIpFilterMode: vi.fn(),
  getMyIp: vi.fn(),
}));

vi.mock('@/features/allowedIps', () => ({
  AllowedIpList: ({ ips }: { ips: any[] }) => (
    <div data-testid="ip-list">IPs: {ips.length}</div>
  ),
  AllowedIpForm: ({ onCancel }: { onCancel: () => void }) => (
    <div data-testid="ip-form">
      <button onClick={onCancel}>Cancelar form</button>
    </div>
  ),
  useAllowedIps: vi.fn(),
}));

import IpSettingsPage from './IpSettingsPage';
import { getIpFilterMode, setIpFilterMode, getMyIp } from '@/features/allowedIps/services/allowedIpService';
import * as allowedIpsModule from '@/features/allowedIps';

const mockGetFilterMode = getIpFilterMode as ReturnType<typeof vi.fn>;
const mockSetFilterMode = setIpFilterMode as ReturnType<typeof vi.fn>;
const mockGetMyIp = getMyIp as ReturnType<typeof vi.fn>;

const defaultMyIp = { ip: '192.168.1.100', isWhitelisted: false, isPrivate: true, alwaysAllowed: true };

describe('IpSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetFilterMode.mockResolvedValue({ filteringEnabled: false, allowAll: true });
    mockGetMyIp.mockResolvedValue(defaultMyIp);
    mockSetFilterMode.mockResolvedValue(undefined);
    vi.mocked(allowedIpsModule.useAllowedIps).mockReturnValue({
      ips: [],
      loading: false,
      error: null,
      addIp: vi.fn(),
      removeIp: vi.fn(),
    } as any);
  });

  // ─── Render ────────────────────────────────────────────────────────────────

  it('renders page heading', () => {
    renderWithStore(<IpSettingsPage />);
    expect(screen.getByRole('heading', { level: 1, name: /ips permitidas/i })).toBeInTheDocument();
  });

  it('renders "← Volver" button', () => {
    renderWithStore(<IpSettingsPage />);
    expect(screen.getByRole('button', { name: /← volver/i })).toBeInTheDocument();
  });

  it('shows ip list after loading', async () => {
    renderWithStore(<IpSettingsPage />);
    expect(await screen.findByTestId('ip-list')).toBeInTheDocument();
  });

  it('shows "+ Añadir IP" button in list mode', async () => {
    renderWithStore(<IpSettingsPage />);
    await screen.findByTestId('ip-list');
    expect(screen.getByRole('button', { name: /añadir ip/i })).toBeInTheDocument();
  });

  // ─── Estado del toggle de filtrado ────────────────────────────────────────

  it('shows "Desactivado" when filteringEnabled=false', async () => {
    renderWithStore(<IpSettingsPage />);
    expect(await screen.findByText(/^desactivado$/i)).toBeInTheDocument();
  });

  it('shows "Activado" when filteringEnabled=true', async () => {
    mockGetFilterMode.mockResolvedValue({ filteringEnabled: true, allowAll: false });
    renderWithStore(<IpSettingsPage />);
    expect(await screen.findByText(/^activado$/i)).toBeInTheDocument();
  });

  it('shows "solo pueden acceder las IPs de la lista" when enabled', async () => {
    mockGetFilterMode.mockResolvedValue({ filteringEnabled: true, allowAll: false });
    renderWithStore(<IpSettingsPage />);
    expect(await screen.findByText(/solo pueden acceder las ips/i)).toBeInTheDocument();
  });

  it('shows "cualquier IP puede acceder" when disabled', async () => {
    renderWithStore(<IpSettingsPage />);
    expect(await screen.findByText(/cualquier ip puede acceder/i)).toBeInTheDocument();
  });

  // ─── Toggle de filtrado ────────────────────────────────────────────────────

  it('calls setIpFilterMode when toggle checkbox is changed', async () => {
    const { container } = renderWithStore(<IpSettingsPage />);
    await waitFor(() => expect(mockGetFilterMode).toHaveBeenCalled());
    await screen.findByText(/^desactivado$/i);
    const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    fireEvent.click(checkbox);
    await waitFor(() =>
      expect(mockSetFilterMode).toHaveBeenCalledWith({ filteringEnabled: true })
    );
  });

  it('shows error when setIpFilterMode fails', async () => {
    mockSetFilterMode.mockRejectedValue(new Error('fail'));
    const { container } = renderWithStore(<IpSettingsPage />);
    await screen.findByText(/^desactivado$/i);
    const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    fireEvent.click(checkbox);
    expect(await screen.findByText(/error al cambiar la configuración/i)).toBeInTheDocument();
  });

  it('shows error when initial load fails', async () => {
    mockGetFilterMode.mockRejectedValue(new Error('Network error'));
    renderWithStore(<IpSettingsPage />);
    expect(await screen.findByText(/no se pudo cargar la configuración/i)).toBeInTheDocument();
  });

  // ─── Mi IP ─────────────────────────────────────────────────────────────────

  it('shows current IP address', async () => {
    renderWithStore(<IpSettingsPage />);
    expect(await screen.findByText(/192\.168\.1\.100/)).toBeInTheDocument();
  });

  it('shows "red local" badge when IP is private', async () => {
    renderWithStore(<IpSettingsPage />);
    expect(await screen.findByText(/red local/i)).toBeInTheDocument();
  });

  it('shows "en lista" badge when IP is whitelisted and not private', async () => {
    mockGetMyIp.mockResolvedValue({
      ip: '8.8.8.8',
      isWhitelisted: true,
      isPrivate: false,
      alwaysAllowed: true,
    });
    renderWithStore(<IpSettingsPage />);
    expect(await screen.findByText(/en lista/i)).toBeInTheDocument();
  });

  // ─── Vista crear IP ────────────────────────────────────────────────────────

  it('shows AllowedIpForm when "+ Añadir IP" is clicked', async () => {
    renderWithStore(<IpSettingsPage />);
    await screen.findByTestId('ip-list');
    fireEvent.click(screen.getByRole('button', { name: /añadir ip/i }));
    expect(screen.getByTestId('ip-form')).toBeInTheDocument();
  });

  it('hides ip list when in create mode', async () => {
    renderWithStore(<IpSettingsPage />);
    await screen.findByTestId('ip-list');
    fireEvent.click(screen.getByRole('button', { name: /añadir ip/i }));
    expect(screen.queryByTestId('ip-list')).not.toBeInTheDocument();
  });

  it('returns to list when form cancel is clicked', async () => {
    renderWithStore(<IpSettingsPage />);
    await screen.findByTestId('ip-list');
    fireEvent.click(screen.getByRole('button', { name: /añadir ip/i }));
    fireEvent.click(screen.getByRole('button', { name: /cancelar form/i }));
    expect(screen.queryByTestId('ip-form')).not.toBeInTheDocument();
    expect(screen.getByTestId('ip-list')).toBeInTheDocument();
  });

  // ─── Navegación ────────────────────────────────────────────────────────────

  it('navigates to /settings when Volver is clicked', async () => {
    renderWithStore(<IpSettingsPage />);
    await screen.findByTestId('ip-list');
    fireEvent.click(screen.getByRole('button', { name: /← volver/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/settings');
  });
});
