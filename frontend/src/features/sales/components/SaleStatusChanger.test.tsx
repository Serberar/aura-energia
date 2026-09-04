import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/features/saleStatus', () => ({
  SaleStatusBadge: ({ name }: { name: string }) => <span data-testid="status-badge">{name}</span>,
}));

import SaleStatusChanger from './SaleStatusChanger';
import type { Sale, SaleStatus } from '@/types/sales';

const mockStatus1: SaleStatus = {
  id: 'status-1', name: 'Inicial', order: 1, color: '#FFF', isFinal: false, isCancelled: false,
};
const mockStatus2: SaleStatus = {
  id: 'status-2', name: 'En proceso', order: 2, color: '#00F', isFinal: false, isCancelled: false,
};
const mockStatus3: SaleStatus = {
  id: 'status-3', name: 'Completado', order: 3, color: '#0F0', isFinal: true, isCancelled: false,
};

const mockSale: Partial<Sale> = {
  id: 'sale-1',
  statusId: 'status-1',
  status: mockStatus1,
};

describe('SaleStatusChanger', () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── render ────────────────────────────────────────────────────────────────

  it('renders available statuses as radio buttons', () => {
    render(
      <SaleStatusChanger
        sale={mockSale as Sale}
        availableStatuses={[mockStatus1, mockStatus2, mockStatus3]}
        onChangeStatus={vi.fn()}
      />
    );
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);
  });

  it('renders current status badge', () => {
    render(
      <SaleStatusChanger
        sale={mockSale as Sale}
        availableStatuses={[mockStatus1]}
        onChangeStatus={vi.fn()}
      />
    );
    expect(screen.getAllByTestId('status-badge')[0]).toHaveTextContent('Inicial');
  });

  // ─── button state ──────────────────────────────────────────────────────────

  it('button is disabled when no status change (current selected)', () => {
    render(
      <SaleStatusChanger
        sale={mockSale as Sale}
        availableStatuses={[mockStatus1, mockStatus2]}
        onChangeStatus={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /cambiar estado/i })).toBeDisabled();
  });

  it('button enabled when different status selected', async () => {
    render(
      <SaleStatusChanger
        sale={mockSale as Sale}
        availableStatuses={[mockStatus1, mockStatus2]}
        onChangeStatus={vi.fn()}
      />
    );
    const radios = screen.getAllByRole('radio');
    await userEvent.click(radios[1]); // select status-2
    expect(screen.getByRole('button', { name: /cambiar estado/i })).toBeEnabled();
  });

  it('calls onChangeStatus with selected status id', async () => {
    const onChangeStatus = vi.fn();
    render(
      <SaleStatusChanger
        sale={mockSale as Sale}
        availableStatuses={[mockStatus1, mockStatus2]}
        onChangeStatus={onChangeStatus}
      />
    );
    const radios = screen.getAllByRole('radio');
    await userEvent.click(radios[1]);
    await userEvent.click(screen.getByRole('button', { name: /cambiar estado/i }));
    expect(onChangeStatus).toHaveBeenCalledWith('status-2');
  });

  // ─── loading state ─────────────────────────────────────────────────────────

  it('shows "Guardando..." text when loading=true', () => {
    render(
      <SaleStatusChanger
        sale={mockSale as Sale}
        availableStatuses={[mockStatus1]}
        onChangeStatus={vi.fn()}
        loading={true}
      />
    );
    expect(screen.getByText(/guardando/i)).toBeInTheDocument();
  });

  it('disables radios when loading=true', () => {
    render(
      <SaleStatusChanger
        sale={mockSale as Sale}
        availableStatuses={[mockStatus1, mockStatus2]}
        onChangeStatus={vi.fn()}
        loading={true}
      />
    );
    screen.getAllByRole('radio').forEach((radio) => {
      expect(radio).toBeDisabled();
    });
  });
});
