/**
 * Utilidad para exportar datos a Excel
 */

import * as XLSX from 'xlsx';
import type { Sale } from '@/types/sales';

interface SaleExportRow {
  'ID Venta': string;
  'Fecha Creación': string;
  'Fecha Cierre': string;
  'Estado': string;
  'Total': string;
  'Comercial': string;
  'ID Cliente': string;
  'Nombre Cliente': string;
  'DNI Cliente': string;
  'Email Cliente': string;
  'Teléfonos Cliente': string;
  'Cuenta Bancaria': string;
  'Dirección': string;
  'CUPS Luz': string;
  'CUPS Gas': string;
  'Productos': string;
  'Cantidad Items': number;
}

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

const saleToExportRow = (sale: Sale): SaleExportRow => {
  const client = sale.client;
  const items = sale.items || [];

  // Formatear productos como lista
  const productsList = items
    .map((item) => `${item.nameSnapshot} (x${item.quantity}) - ${formatCurrency(item.finalPrice)}`)
    .join(' | ');

  return {
    'ID Venta': sale.id,
    'Fecha Creación': formatDate(sale.createdAt),
    'Fecha Cierre': formatDate(sale.closedAt),
    'Estado': sale.status?.name || '',
    'Total': formatCurrency(sale.totalAmount),
    'Comercial': sale.comercial || '',
    'ID Cliente': sale.clientId,
    'Nombre Cliente': client ? `${client.firstName} ${client.lastName}` : '',
    'DNI Cliente': client?.dni || '',
    'Email Cliente': client?.email || '',
    'Teléfonos Cliente': client?.phones?.join(', ') || '',
    'Cuenta Bancaria': client?.bankAccounts?.join(', ') || '',
    'Dirección': client?.address?.address || '',
    'CUPS Luz': client?.address?.cupsLuz || '',
    'CUPS Gas': client?.address?.cupsGas || '',
    'Productos': productsList,
    'Cantidad Items': items.length,
  };
};

export const exportSalesToExcel = (sales: Sale[], filename?: string): void => {
  if (sales.length === 0) {
    throw new Error('No hay ventas para exportar');
  }

  // Convertir ventas a filas de Excel
  const rows = sales.map(saleToExportRow);

  // Crear worksheet
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Ajustar anchos de columna
  const columnWidths = [
    { wch: 38 }, // ID Venta
    { wch: 18 }, // Fecha Creación
    { wch: 18 }, // Fecha Cierre
    { wch: 15 }, // Estado
    { wch: 12 }, // Total
    { wch: 20 }, // Comercial
    { wch: 38 }, // ID Cliente
    { wch: 25 }, // Nombre Cliente
    { wch: 12 }, // DNI Cliente
    { wch: 25 }, // Email Cliente
    { wch: 20 }, // Teléfonos Cliente
    { wch: 25 }, // Cuenta Bancaria
    { wch: 40 }, // Dirección
    { wch: 25 }, // CUPS Luz
    { wch: 25 }, // CUPS Gas
    { wch: 60 }, // Productos
    { wch: 15 }, // Cantidad Items
  ];
  worksheet['!cols'] = columnWidths;

  // Crear workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Ventas');

  // Generar nombre de archivo con fecha
  const date = new Date().toISOString().split('T')[0];
  const finalFilename = filename || `ventas_${date}.xlsx`;

  // Descargar archivo
  XLSX.writeFile(workbook, finalFilename);
};
