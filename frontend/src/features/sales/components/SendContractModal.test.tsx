import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SendContractModal from './SendContractModal';

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onConfirm: vi.fn(),
};

describe('SendContractModal', () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── visibility ────────────────────────────────────────────────────────────

  it('does not render content when isOpen=false', () => {
    render(<SendContractModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByPlaceholderText(/email@/i)).toBeNull();
  });

  it('renders email input when open', () => {
    render(<SendContractModal {...defaultProps} />);
    expect(screen.getByPlaceholderText(/email@/i)).toBeInTheDocument();
  });

  it('pre-fills email with defaultEmail', () => {
    render(<SendContractModal {...defaultProps} defaultEmail="test@example.com" />);
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
  });

  // ─── validation ────────────────────────────────────────────────────────────

  it('shows error when email is empty on confirm', async () => {
    render(<SendContractModal {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /enviar contrato/i }));
    await waitFor(() => expect(screen.getByText(/obligatorio/i)).toBeInTheDocument());
    expect(defaultProps.onConfirm).not.toHaveBeenCalled();
  });

  it('shows error when email format is invalid', async () => {
    render(<SendContractModal {...defaultProps} />);
    await userEvent.type(screen.getByPlaceholderText(/email@/i), 'notanemail');
    await userEvent.click(screen.getByRole('button', { name: /enviar contrato/i }));
    await waitFor(() => expect(screen.getByText(/email válido/i)).toBeInTheDocument());
    expect(defaultProps.onConfirm).not.toHaveBeenCalled();
  });

  it('calls onConfirm with trimmed email when valid', async () => {
    render(<SendContractModal {...defaultProps} />);
    await userEvent.type(screen.getByPlaceholderText(/email@/i), 'user@example.com');
    await userEvent.click(screen.getByRole('button', { name: /enviar contrato/i }));
    expect(defaultProps.onConfirm).toHaveBeenCalledWith('user@example.com', undefined);
  });

  // ─── loading state ─────────────────────────────────────────────────────────

  it('shows "Enviando..." when loading=true', () => {
    render(<SendContractModal {...defaultProps} loading={true} />);
    expect(screen.getByText(/enviando/i)).toBeInTheDocument();
  });

  it('disables confirm button when loading', () => {
    render(<SendContractModal {...defaultProps} loading={true} />);
    const btn = screen.getByRole('button', { name: /enviando/i });
    expect(btn).toBeDisabled();
  });

  // ─── cancel ────────────────────────────────────────────────────────────────

  it('calls onClose when cancel button clicked', async () => {
    render(<SendContractModal {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
