import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockShowSuccess = vi.hoisted(() => vi.fn());
const mockShowError = vi.hoisted(() => vi.fn());
const mockSend = vi.hoisted(() => vi.fn());
const mockResend = vi.hoisted(() => vi.fn());
const mockDownloadEvidence = vi.hoisted(() => vi.fn());
const mockGetSetting = vi.hoisted(() => vi.fn());

vi.mock('@/design-system', async () => {
  const actual = await vi.importActual('@/design-system');
  return {
    ...actual,
    useToast: vi.fn(() => ({ showSuccess: mockShowSuccess, showError: mockShowError })),
  };
});

vi.mock('../hooks/useSignature', () => ({
  useSignature: vi.fn(() => ({ send: mockSend, resend: mockResend, loading: false })),
}));

vi.mock('../services/signatureService', async () => {
  const actual = await vi.importActual('../services/signatureService');
  return { ...actual, downloadEvidence: mockDownloadEvidence };
});

vi.mock('@/features/settings/services/settingsService', () => ({
  getSetting: mockGetSetting,
}));

vi.mock('@/features/settings/services/contractTemplateService', () => ({
  listTemplates: vi.fn().mockResolvedValue([]),
}));

import SignaturePanel from './SignaturePanel';
import type { SignatureRequest } from '@/types/sales';

const pendingSig: SignatureRequest = {
  id: 'sig-1', saleId: 'sale-1', status: 'pending', signerEmail: 'cliente@example.com',
  sentAt: '2024-01-10T10:00:00Z', createdAt: '2024-01-10T10:00:00Z', updatedAt: '2024-01-10T10:00:00Z',
};
const signedSig: SignatureRequest = {
  ...pendingSig, status: 'signed', signedAt: '2024-01-11T12:00:00Z',
  signedDocumentUrl: 'https://example.com/doc.pdf',
};
const rejectedSig: SignatureRequest = {
  ...pendingSig, status: 'rejected', rejectedAt: '2024-01-12T09:00:00Z',
  rejectionReason: 'Datos incorrectos',
};

describe('SignaturePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockResolvedValue(null);
    mockResend.mockResolvedValue(null);
    mockDownloadEvidence.mockResolvedValue(undefined);
    // Por defecto firma requerida = true
    mockGetSetting.mockResolvedValue({ key: 'firma_requerida', value: true });
  });

  // ─── no signature ──────────────────────────────────────────────────────────

  it('shows "Sin contrato" when no signatureRequest', () => {
    render(<SignaturePanel saleId="sale-1" signatureRequest={null} />);
    expect(screen.getByText(/sin contrato/i)).toBeInTheDocument();
  });

  it('shows send button when no signature and not readonly', () => {
    render(<SignaturePanel saleId="sale-1" signatureRequest={null} />);
    expect(screen.getByRole('button', { name: /generar y enviar/i })).toBeInTheDocument();
  });

  it('hides send button when readonly=true', () => {
    render(<SignaturePanel saleId="sale-1" signatureRequest={null} readonly={true} />);
    expect(screen.queryByRole('button', { name: /generar y enviar/i })).toBeNull();
  });

  it('opens send modal on button click', async () => {
    render(<SignaturePanel saleId="sale-1" signatureRequest={null} />);
    await userEvent.click(screen.getByRole('button', { name: /generar y enviar/i }));
    expect(screen.getByPlaceholderText(/email@/i)).toBeInTheDocument();
  });

  it('calls send and shows success when modal confirmed', async () => {
    mockSend.mockResolvedValue(pendingSig);
    render(<SignaturePanel saleId="sale-1" signatureRequest={null} />);
    await userEvent.click(screen.getByRole('button', { name: /generar y enviar/i }));
    await userEvent.type(screen.getByPlaceholderText(/email@/i), 'test@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar contrato' }));
    expect(mockSend).toHaveBeenCalledWith('sale-1', 'test@example.com', undefined);
    expect(mockShowSuccess).toHaveBeenCalled();
  });

  it('calls showError when send returns null', async () => {
    mockSend.mockResolvedValue(null);
    render(<SignaturePanel saleId="sale-1" signatureRequest={null} />);
    await userEvent.click(screen.getByRole('button', { name: /generar y enviar/i }));
    await userEvent.type(screen.getByPlaceholderText(/email@/i), 'test@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar contrato' }));
    expect(mockShowError).toHaveBeenCalled();
  });

  // ─── pending signature ─────────────────────────────────────────────────────

  it('shows pending status', () => {
    render(<SignaturePanel saleId="sale-1" signatureRequest={pendingSig} />);
    expect(screen.getByText(/pendiente de firma/i)).toBeInTheDocument();
  });

  it('shows signer email in pending state', () => {
    render(<SignaturePanel saleId="sale-1" signatureRequest={pendingSig} />);
    expect(screen.getByText('cliente@example.com')).toBeInTheDocument();
  });

  it('shows resend button in pending state', () => {
    render(<SignaturePanel saleId="sale-1" signatureRequest={pendingSig} />);
    expect(screen.getByRole('button', { name: /reenviar/i })).toBeInTheDocument();
  });

  // ─── signed signature ──────────────────────────────────────────────────────

  it('shows "Contrato firmado" when status=signed', () => {
    render(<SignaturePanel saleId="sale-1" signatureRequest={signedSig} />);
    expect(screen.getByText(/contrato firmado/i)).toBeInTheDocument();
  });

  it('shows download evidence button when status is signed', () => {
    render(<SignaturePanel saleId="sale-1" signatureRequest={signedSig} />);
    expect(screen.getByRole('button', { name: /descargar evidencia/i })).toBeInTheDocument();
  });

  // ─── rejected signature ────────────────────────────────────────────────────

  it('shows "Firma rechazada" when status=rejected', () => {
    render(<SignaturePanel saleId="sale-1" signatureRequest={rejectedSig} />);
    expect(screen.getByText(/rechazada/i)).toBeInTheDocument();
  });

  it('shows rejection reason', () => {
    render(<SignaturePanel saleId="sale-1" signatureRequest={rejectedSig} />);
    expect(screen.getByText('Datos incorrectos')).toBeInTheDocument();
  });

  it('shows resend button in rejected state when not readonly', () => {
    render(<SignaturePanel saleId="sale-1" signatureRequest={rejectedSig} />);
    expect(screen.getByRole('button', { name: /corregir y reenviar/i })).toBeInTheDocument();
  });
});
