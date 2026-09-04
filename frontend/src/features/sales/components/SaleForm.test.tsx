import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/hooks/reduxHooks', () => ({
  useAppSelector: vi.fn((fn: any) =>
    fn({ auth: { user: { firstName: 'Carlos', lastName: 'Ruiz' } } })
  ),
  useAppDispatch: vi.fn(() => vi.fn()),
}));

vi.mock('@/validation', () => ({
  saleFormSchema: {
    safeParse: vi.fn((data: any) => ({ success: true, data })),
  },
}));

vi.mock('../services/signatureService', () => ({
  getSignatureStatus: vi.fn(),
  simulateSign: vi.fn(),
  resendContract: vi.fn(),
  sendContract: vi.fn(),
  cancelSignature: vi.fn(),
}));

vi.mock('./ClientSearchForm', () => ({
  default: ({ onClientSelected }: any) => (
    <button
      data-testid="client-search"
      onClick={() =>
        onClientSelected({
          firstName: 'María', lastName: 'González', email: 'maria@example.com',
          dni: '12345678A', phones: ['600000001'], bankAccounts: [],
          address: { address: 'Calle Mayor 1' },
        })
      }
    >
      Seleccionar Cliente
    </button>
  ),
}));

vi.mock('./ProductSearchForm', () => ({
  default: ({ onProductsSelected }: any) => (
    <button
      data-testid="product-search"
      onClick={() => onProductsSelected([{ productId: 'p1', name: 'Seguro', quantity: 1, price: 100 }])}
    >
      Seleccionar Productos
    </button>
  ),
}));

vi.mock('./ContractPreview', () => ({
  default: () => <div data-testid="contract-preview">Contract Preview</div>,
}));

vi.mock('@/features/settings/services/settingsService', () => ({
  getSetting: vi.fn().mockResolvedValue({ key: 'firma_requerida', value: false }),
}));

vi.mock('@/features/settings/services/contractTemplateService', () => ({
  listTemplates: vi.fn().mockResolvedValue([]),
  getTemplate: vi.fn().mockResolvedValue(null),
}));

import SaleForm from './SaleForm';

const defaultProps = {
  onSendForSignature: vi.fn(() => Promise.resolve(null)),
  onConfirmSale: vi.fn(() => Promise.resolve()),
  onSaveWithoutSignature: vi.fn(() => Promise.resolve()),
};

describe('SaleForm', () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── render ────────────────────────────────────────────────────────────────

  it('renders "Nueva Venta" heading', () => {
    render(<SaleForm {...defaultProps} />);
    expect(screen.getByRole('heading', { name: /nueva venta/i })).toBeInTheDocument();
  });

  it('renders signer email input', () => {
    render(<SaleForm {...defaultProps} />);
    expect(screen.getByPlaceholderText(/email@/i)).toBeInTheDocument();
  });

  it('shows Cancelar button when onCancel provided', () => {
    const onCancel = vi.fn();
    render(<SaleForm {...defaultProps} onCancel={onCancel} />);
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
  });

  it('does not show Cancelar button when onCancel not provided', () => {
    render(<SaleForm {...defaultProps} />);
    expect(screen.queryByRole('button', { name: /cancelar/i })).toBeNull();
  });

  it('calls onCancel when Cancelar clicked', async () => {
    const onCancel = vi.fn();
    render(<SaleForm {...defaultProps} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('shows error box when error prop provided', () => {
    render(<SaleForm {...defaultProps} error="Error al crear venta" />);
    expect(screen.getByText('Error al crear venta')).toBeInTheDocument();
  });

  it('shows comercial name from auth state', () => {
    render(<SaleForm {...defaultProps} />);
    expect(screen.getByDisplayValue('Carlos Ruiz')).toBeInTheDocument();
  });

  // ─── button states ─────────────────────────────────────────────────────────

  it('"Guardar sin firma" disabled before client and items selected', async () => {
    render(<SaleForm {...defaultProps} />);
    expect(await screen.findByRole('button', { name: /guardar sin firma/i })).toBeDisabled();
  });

  it('"Previsualizar contrato" disabled before client and items selected', () => {
    render(<SaleForm {...defaultProps} />);
    expect(screen.getByRole('button', { name: /previsualizar/i })).toBeDisabled();
  });

  it('"Enviar para firma" disabled before client and items selected', () => {
    render(<SaleForm {...defaultProps} />);
    expect(screen.getByRole('button', { name: /enviar para firma/i })).toBeDisabled();
  });

  it('action buttons enabled after selecting client and items', async () => {
    render(<SaleForm {...defaultProps} />);
    await userEvent.click(screen.getByTestId('client-search'));
    await userEvent.click(screen.getByTestId('product-search'));
    expect(screen.getByRole('button', { name: /guardar sin firma/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /previsualizar/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /enviar para firma/i })).toBeEnabled();
  });

  // ─── send flow ─────────────────────────────────────────────────────────────

  it('calls onSendForSignature when Enviar para firma clicked with email', async () => {
    render(<SaleForm {...defaultProps} />);
    await userEvent.click(screen.getByTestId('client-search'));
    await userEvent.click(screen.getByTestId('product-search'));
    const emailInput = screen.getByPlaceholderText(/email@/i);
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'firma@example.com');
    await userEvent.click(screen.getByRole('button', { name: /enviar para firma/i }));
    expect(defaultProps.onSendForSignature).toHaveBeenCalledWith(
      expect.objectContaining({ sendContract: true, signerEmail: 'firma@example.com' })
    );
  });
});
