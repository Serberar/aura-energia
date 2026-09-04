import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AllowedIpList from './AllowedIpList';
import type { AllowedIp } from '../services/allowedIpService';

const mockIp1: AllowedIp = {
  id: 'ip-1',
  ip: '192.168.1.1',
  description: 'Oficina principal',
  createdAt: '2024-01-15T10:00:00Z',
};
const mockIp2: AllowedIp = {
  id: 'ip-2',
  ip: '10.0.0.1',
  description: null,
  createdAt: '2024-02-01T09:00:00Z',
};

describe('AllowedIpList', () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── loading ───────────────────────────────────────────────────────────────

  it('shows loading text when loading=true and no ips', () => {
    render(<AllowedIpList ips={[]} onDelete={vi.fn()} loading={true} />);
    expect(screen.getByText(/cargando ips/i)).toBeInTheDocument();
  });

  it('does not show loading spinner when ips are present', () => {
    render(<AllowedIpList ips={[mockIp1]} onDelete={vi.fn()} loading={true} />);
    expect(screen.queryByText(/cargando ips/i)).toBeNull();
  });

  // ─── empty ─────────────────────────────────────────────────────────────────

  it('shows empty message when no ips', () => {
    render(<AllowedIpList ips={[]} onDelete={vi.fn()} />);
    expect(screen.getByText(/no hay ips permitidas/i)).toBeInTheDocument();
  });

  // ─── list render ───────────────────────────────────────────────────────────

  it('renders ip addresses', () => {
    render(<AllowedIpList ips={[mockIp1, mockIp2]} onDelete={vi.fn()} />);
    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
    expect(screen.getByText('10.0.0.1')).toBeInTheDocument();
  });

  it('shows header with ip count', () => {
    render(<AllowedIpList ips={[mockIp1, mockIp2]} onDelete={vi.fn()} />);
    expect(screen.getByText(/ips permitidas \(2\)/i)).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<AllowedIpList ips={[mockIp1]} onDelete={vi.fn()} />);
    expect(screen.getByText('Oficina principal')).toBeInTheDocument();
  });

  it('does not render description when null', () => {
    render(<AllowedIpList ips={[mockIp2]} onDelete={vi.fn()} />);
    expect(screen.queryByText('Oficina principal')).toBeNull();
  });

  // ─── delete ────────────────────────────────────────────────────────────────

  it('renders delete buttons for each ip', () => {
    render(<AllowedIpList ips={[mockIp1, mockIp2]} onDelete={vi.fn()} />);
    expect(screen.getAllByRole('button', { name: /eliminar/i })).toHaveLength(2);
  });

  it('calls onDelete with the correct ip when delete clicked', async () => {
    const onDelete = vi.fn();
    render(<AllowedIpList ips={[mockIp1, mockIp2]} onDelete={onDelete} />);
    const buttons = screen.getAllByRole('button', { name: /eliminar/i });
    await userEvent.click(buttons[0]);
    expect(onDelete).toHaveBeenCalledWith(mockIp1);
  });
});
