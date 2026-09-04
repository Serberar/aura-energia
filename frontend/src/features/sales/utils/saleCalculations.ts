/**
 * Utilidades para cálculos relacionados con ventas
 */

import type { Sale, SaleItem } from '@/types/sales';

/**
 * Calcular el subtotal de un item
 */
export const calculateItemSubtotal = (item: SaleItem): number => {
  return item.quantity * item.unitPrice;
};

/**
 * Calcular el total de una venta sumando todos los items
 */
export const calculateSaleTotal = (items: SaleItem[]): number => {
  return items.reduce((total, item) => {
    return total + calculateItemSubtotal(item);
  }, 0);
};

/**
 * Formatear precio a moneda (EUR por defecto)
 */
export const formatPrice = (amount: number, currency: string = 'EUR', locale: string = 'es-ES'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * Formatear precio simple sin símbolo de moneda
 */
export const formatPriceSimple = (amount: number, decimals: number = 2): string => {
  return amount.toFixed(decimals);
};

/**
 * Validar que un precio sea válido
 */
export const isValidPrice = (price: number): boolean => {
  return !isNaN(price) && isFinite(price) && price >= 0;
};

/**
 * Validar que una cantidad sea válida
 */
export const isValidQuantity = (quantity: number): boolean => {
  return !isNaN(quantity) && isFinite(quantity) && quantity > 0 && Number.isInteger(quantity);
};

/**
 * Obtener el número total de items en una venta
 */
export const getTotalItemsCount = (items: SaleItem[]): number => {
  return items.reduce((count, item) => count + item.quantity, 0);
};

/**
 * Verificar si una venta está vacía (sin items)
 */
export const isSaleEmpty = (sale: Sale): boolean => {
  return !sale.items || sale.items.length === 0;
};

/**
 * Calcular el precio promedio por item en una venta
 */
export const getAverageItemPrice = (items: SaleItem[]): number => {
  if (items.length === 0) return 0;
  const total = calculateSaleTotal(items);
  const count = getTotalItemsCount(items);
  return count > 0 ? total / count : 0;
};

/**
 * Encontrar el item más caro en una venta
 */
export const getMostExpensiveItem = (items: SaleItem[]): SaleItem | null => {
  if (items.length === 0) return null;
  return items.reduce((max, item) => {
    const maxSubtotal = calculateItemSubtotal(max);
    const itemSubtotal = calculateItemSubtotal(item);
    return itemSubtotal > maxSubtotal ? item : max;
  }, items[0]);
};

/**
 * Agrupar items por producto (productId)
 */
export const groupItemsByProduct = (items: SaleItem[]): Record<string, SaleItem[]> => {
  return items.reduce((groups, item) => {
    const key = item.productId || 'custom';
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<string, SaleItem[]>);
};

/**
 * Validar item completo
 */
export const validateSaleItem = (item: Partial<SaleItem>): string[] => {
  const errors: string[] = [];

  if (!item.nameSnapshot || item.nameSnapshot.trim().length === 0) {
    errors.push('El nombre del item es requerido');
  }

  if (item.quantity === undefined || !isValidQuantity(item.quantity)) {
    errors.push('La cantidad debe ser un número entero positivo');
  }

  if (item.unitPrice === undefined || !isValidPrice(item.unitPrice)) {
    errors.push('El precio debe ser un número válido mayor o igual a 0');
  }

  return errors;
};

/**
 * Redondear precio a 2 decimales
 */
export const roundPrice = (price: number): number => {
  return Math.round(price * 100) / 100;
};

/**
 * Calcular descuento porcentual
 */
export const calculateDiscount = (originalPrice: number, discountPercent: number): number => {
  return roundPrice(originalPrice * (discountPercent / 100));
};

/**
 * Aplicar descuento a un precio
 */
export const applyDiscount = (price: number, discountPercent: number): number => {
  const discount = calculateDiscount(price, discountPercent);
  return roundPrice(price - discount);
};
