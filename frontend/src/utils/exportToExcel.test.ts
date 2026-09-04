import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Sale } from '@/types/sales';

// Mock xlsx before import
vi.mock('xlsx', () => ({
  utils: {
    json_to_sheet: vi.fn(() => ({})),
    book_new: vi.fn(() => ({})),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}));

import { exportSalesToExcel } from './exportToExcel';
import * as XLSX from 'xlsx';

const mockSale: Sale = {
  id: 'sale-uuid-1234',
  clientId: 'client-1',
  statusId: 'status-1',
  totalAmount: 299.99,
  notes: null,
  metadata: null,
  clientSnapshot: null,
  addressSnapshot: null,
  comercial: 'Carlos Ruiz',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
  closedAt: null,
  client: {
    id: 'client-1',
    firstName: 'María',
    lastName: 'González',
    dni: '12345678A',
    email: 'maria@example.com',
    phones: ['612345678'],
    addresses: [],
    bankAccounts: ['ES1234567890123456789012'],
    comments: [],
    birthday: null,
    businessName: undefined,
    authorized: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  status: { id: 'status-1', name: 'Inicial', order: 1, color: '#FFF', isFinal: false, isCancelled: false, isSystem: false },
  items: [
    {
      id: 'item-1',
      saleId: 'sale-uuid-1234',
      productId: 'prod-1',
      nameSnapshot: 'Seguro Hogar',
      quantity: 2,
      unitPrice: 100,
      discountPct: 0,
      finalPrice: 200,
    },
  ],
  history: [],
  signatureRequests: [],
};

describe('exportSalesToExcel', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws when sales array is empty', () => {
    expect(() => exportSalesToExcel([])).toThrow('No hay ventas para exportar');
  });

  it('calls XLSX.writeFile when sales provided', () => {
    exportSalesToExcel([mockSale]);
    expect(XLSX.writeFile).toHaveBeenCalledTimes(1);
  });

  it('uses provided filename', () => {
    exportSalesToExcel([mockSale], 'mi_export.xlsx');
    expect(XLSX.writeFile).toHaveBeenCalledWith(expect.anything(), 'mi_export.xlsx');
  });

  it('generates filename with today date when no filename provided', () => {
    exportSalesToExcel([mockSale]);
    const args = vi.mocked(XLSX.writeFile).mock.calls[0];
    expect(args[1]).toMatch(/ventas_\d{4}-\d{2}-\d{2}\.xlsx/);
  });

  it('calls json_to_sheet with data rows', () => {
    exportSalesToExcel([mockSale]);
    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          'ID Venta': 'sale-uuid-1234',
          'Comercial': 'Carlos Ruiz',
          'Estado': 'Inicial',
        }),
      ])
    );
  });

  it('creates a workbook and appends sheet', () => {
    exportSalesToExcel([mockSale]);
    expect(XLSX.utils.book_new).toHaveBeenCalled();
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalled();
  });

  it('exports multiple sales without error', () => {
    const sale2 = { ...mockSale, id: 'sale-2', clientId: 'client-2' };
    expect(() => exportSalesToExcel([mockSale, sale2])).not.toThrow();
    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ 'ID Venta': 'sale-uuid-1234' }),
      expect.objectContaining({ 'ID Venta': 'sale-2' }),
    ]));
  });
});
