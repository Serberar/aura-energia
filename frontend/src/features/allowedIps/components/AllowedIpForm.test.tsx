import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AllowedIpForm from './AllowedIpForm';

const defaultProps = {
  onSubmit: vi.fn(),
  onCancel: vi.fn(),
};

describe('AllowedIpForm', () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── render ────────────────────────────────────────────────────────────────

  it('renders IP input', () => {
    render(<AllowedIpForm {...defaultProps} />);
    expect(screen.getByPlaceholderText(/ej: 83/i)).toBeInTheDocument();
  });

  it('renders description input', () => {
    render(<AllowedIpForm {...defaultProps} />);
    expect(screen.getByPlaceholderText(/oficina principal/i)).toBeInTheDocument();
  });

  it('renders Añadir IP button', () => {
    render(<AllowedIpForm {...defaultProps} />);
    expect(screen.getByRole('button', { name: /añadir ip/i })).toBeInTheDocument();
  });

  it('renders cancel button when onCancel provided', () => {
    render(<AllowedIpForm {...defaultProps} />);
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
  });

  it('does not render cancel button when onCancel not provided', () => {
    render(<AllowedIpForm onSubmit={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /cancelar/i })).toBeNull();
  });

  // ─── validation ────────────────────────────────────────────────────────────

  it('shows error when IP is empty', async () => {
    render(<AllowedIpForm {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /añadir ip/i }));
    expect(screen.getByText(/obligatoria/i)).toBeInTheDocument();
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('shows error when IP format is invalid', async () => {
    render(<AllowedIpForm {...defaultProps} />);
    await userEvent.type(screen.getByPlaceholderText(/ej: 83/i), 'not-an-ip');
    await userEvent.click(screen.getByRole('button', { name: /añadir ip/i }));
    expect(screen.getByText(/formato de ip/i)).toBeInTheDocument();
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with valid IPv4', async () => {
    render(<AllowedIpForm {...defaultProps} />);
    await userEvent.type(screen.getByPlaceholderText(/ej: 83/i), '192.168.1.1');
    await userEvent.click(screen.getByRole('button', { name: /añadir ip/i }));
    expect(defaultProps.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ ip: '192.168.1.1' })
    );
  });

  it('includes description in submitted data', async () => {
    render(<AllowedIpForm {...defaultProps} />);
    await userEvent.type(screen.getByPlaceholderText(/ej: 83/i), '10.0.0.1');
    await userEvent.type(screen.getByPlaceholderText(/oficina principal/i), 'VPN empresa');
    await userEvent.click(screen.getByRole('button', { name: /añadir ip/i }));
    expect(defaultProps.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ ip: '10.0.0.1', description: 'VPN empresa' })
    );
  });

  it('calls onCancel when cancel clicked', async () => {
    render(<AllowedIpForm {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  // ─── loading ───────────────────────────────────────────────────────────────

  it('shows Guardando... text when loading=true', () => {
    render(<AllowedIpForm {...defaultProps} loading={true} />);
    expect(screen.getByText(/guardando/i)).toBeInTheDocument();
  });

  it('disables submit button when loading=true', () => {
    render(<AllowedIpForm {...defaultProps} loading={true} />);
    expect(screen.getByRole('button', { name: /guardando/i })).toBeDisabled();
  });

  // ─── external error ────────────────────────────────────────────────────────

  it('shows external error when error prop provided', () => {
    render(<AllowedIpForm {...defaultProps} error="IP ya existe" />);
    expect(screen.getByText('IP ya existe')).toBeInTheDocument();
  });
});
