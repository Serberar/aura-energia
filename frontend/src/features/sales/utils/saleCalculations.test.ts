import { describe, it, expect } from 'vitest';
import {
  calculateItemSubtotal,
  calculateSaleTotal,
  formatPriceSimple,
  isValidPrice,
  isValidQuantity,
  getTotalItemsCount,
  isSaleEmpty,
  getAverageItemPrice,
  getMostExpensiveItem,
  groupItemsByProduct,
  validateSaleItem,
  roundPrice,
  calculateDiscount,
  applyDiscount,
} from './saleCalculations';
import type { SaleItem, Sale } from '@/types/sales';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeItem(overrides: Partial<SaleItem> = {}): SaleItem {
  return {
    id: 'item-1',
    productId: 'prod-1',
    nameSnapshot: 'Product A',
    skuSnapshot: 'SKU-1',
    unitPrice: 10,
    quantity: 2,
    finalPrice: 20,
    ...overrides,
  };
}

function makeSale(items: SaleItem[] = []): Sale {
  return { items } as unknown as Sale;
}

// ─── calculateItemSubtotal ───────────────────────────────────────────────────

describe('calculateItemSubtotal', () => {
  it('returns quantity * unitPrice', () => {
    const item = makeItem({ quantity: 3, unitPrice: 15 });
    expect(calculateItemSubtotal(item)).toBe(45);
  });

  it('returns 0 when quantity is 0', () => {
    const item = makeItem({ quantity: 0, unitPrice: 10 });
    expect(calculateItemSubtotal(item)).toBe(0);
  });

  it('handles decimal prices', () => {
    const item = makeItem({ quantity: 2, unitPrice: 9.99 });
    expect(calculateItemSubtotal(item)).toBeCloseTo(19.98);
  });
});

// ─── calculateSaleTotal ──────────────────────────────────────────────────────

describe('calculateSaleTotal', () => {
  it('sums subtotals of all items', () => {
    const items = [
      makeItem({ quantity: 2, unitPrice: 10 }),
      makeItem({ id: 'item-2', quantity: 3, unitPrice: 5 }),
    ];
    expect(calculateSaleTotal(items)).toBe(35);
  });

  it('returns 0 for empty array', () => {
    expect(calculateSaleTotal([])).toBe(0);
  });

  it('works with a single item', () => {
    const items = [makeItem({ quantity: 1, unitPrice: 99.99 })];
    expect(calculateSaleTotal(items)).toBeCloseTo(99.99);
  });
});

// ─── formatPriceSimple ───────────────────────────────────────────────────────

describe('formatPriceSimple', () => {
  it('formats with 2 decimal places by default', () => {
    expect(formatPriceSimple(10)).toBe('10.00');
  });

  it('formats with custom decimal places', () => {
    expect(formatPriceSimple(10.5, 0)).toBe('11');
    expect(formatPriceSimple(10.5, 3)).toBe('10.500');
  });

  it('handles zero', () => {
    expect(formatPriceSimple(0)).toBe('0.00');
  });

  it('handles negative values', () => {
    expect(formatPriceSimple(-5.5)).toBe('-5.50');
  });
});

// ─── isValidPrice ────────────────────────────────────────────────────────────

describe('isValidPrice', () => {
  it('returns true for zero', () => {
    expect(isValidPrice(0)).toBe(true);
  });

  it('returns true for positive numbers', () => {
    expect(isValidPrice(100)).toBe(true);
    expect(isValidPrice(0.01)).toBe(true);
  });

  it('returns false for negative prices', () => {
    expect(isValidPrice(-1)).toBe(false);
  });

  it('returns false for NaN', () => {
    expect(isValidPrice(NaN)).toBe(false);
  });

  it('returns false for Infinity', () => {
    expect(isValidPrice(Infinity)).toBe(false);
    expect(isValidPrice(-Infinity)).toBe(false);
  });
});

// ─── isValidQuantity ─────────────────────────────────────────────────────────

describe('isValidQuantity', () => {
  it('returns true for positive integers', () => {
    expect(isValidQuantity(1)).toBe(true);
    expect(isValidQuantity(100)).toBe(true);
  });

  it('returns false for zero', () => {
    expect(isValidQuantity(0)).toBe(false);
  });

  it('returns false for negative numbers', () => {
    expect(isValidQuantity(-1)).toBe(false);
  });

  it('returns false for decimals', () => {
    expect(isValidQuantity(1.5)).toBe(false);
  });

  it('returns false for NaN', () => {
    expect(isValidQuantity(NaN)).toBe(false);
  });
});

// ─── getTotalItemsCount ───────────────────────────────────────────────────────

describe('getTotalItemsCount', () => {
  it('sums all quantities', () => {
    const items = [
      makeItem({ quantity: 3 }),
      makeItem({ id: 'item-2', quantity: 7 }),
    ];
    expect(getTotalItemsCount(items)).toBe(10);
  });

  it('returns 0 for empty array', () => {
    expect(getTotalItemsCount([])).toBe(0);
  });
});

// ─── isSaleEmpty ─────────────────────────────────────────────────────────────

describe('isSaleEmpty', () => {
  it('returns true when items array is empty', () => {
    expect(isSaleEmpty(makeSale([]))).toBe(true);
  });

  it('returns true when items is undefined', () => {
    const sale = {} as Sale;
    expect(isSaleEmpty(sale)).toBe(true);
  });

  it('returns false when sale has items', () => {
    expect(isSaleEmpty(makeSale([makeItem()]))).toBe(false);
  });
});

// ─── getAverageItemPrice ──────────────────────────────────────────────────────

describe('getAverageItemPrice', () => {
  it('returns 0 for empty array', () => {
    expect(getAverageItemPrice([])).toBe(0);
  });

  it('calculates average price per unit across items', () => {
    // total = 20+30 = 50, totalUnits = 2+3 = 5, avg = 10
    const items = [
      makeItem({ quantity: 2, unitPrice: 10 }), // subtotal 20
      makeItem({ id: 'item-2', quantity: 3, unitPrice: 10 }), // subtotal 30
    ];
    expect(getAverageItemPrice(items)).toBe(10);
  });

  it('handles single item', () => {
    const items = [makeItem({ quantity: 4, unitPrice: 5 })]; // total=20, count=4
    expect(getAverageItemPrice(items)).toBe(5);
  });
});

// ─── getMostExpensiveItem ─────────────────────────────────────────────────────

describe('getMostExpensiveItem', () => {
  it('returns null for empty array', () => {
    expect(getMostExpensiveItem([])).toBeNull();
  });

  it('returns the item with highest subtotal', () => {
    const cheap = makeItem({ id: 'item-1', quantity: 1, unitPrice: 10 });
    const expensive = makeItem({ id: 'item-2', quantity: 5, unitPrice: 50 });
    const result = getMostExpensiveItem([cheap, expensive]);
    expect(result?.id).toBe('item-2');
  });

  it('returns the single item when array has one element', () => {
    const item = makeItem();
    expect(getMostExpensiveItem([item])).toBe(item);
  });

  it('returns first item when all have same subtotal', () => {
    const a = makeItem({ id: 'a', quantity: 2, unitPrice: 10 });
    const b = makeItem({ id: 'b', quantity: 4, unitPrice: 5 });
    const result = getMostExpensiveItem([a, b]);
    expect(result?.id).toBe('a');
  });
});

// ─── groupItemsByProduct ──────────────────────────────────────────────────────

describe('groupItemsByProduct', () => {
  it('groups items by productId', () => {
    const items = [
      makeItem({ id: 'i1', productId: 'p1' }),
      makeItem({ id: 'i2', productId: 'p2' }),
      makeItem({ id: 'i3', productId: 'p1' }),
    ];
    const groups = groupItemsByProduct(items);
    expect(groups['p1']).toHaveLength(2);
    expect(groups['p2']).toHaveLength(1);
  });

  it('groups items without productId under "custom"', () => {
    const items = [makeItem({ id: 'i1', productId: undefined })];
    const groups = groupItemsByProduct(items);
    expect(groups['custom']).toHaveLength(1);
  });

  it('returns empty object for empty array', () => {
    expect(groupItemsByProduct([])).toEqual({});
  });
});

// ─── validateSaleItem ─────────────────────────────────────────────────────────

describe('validateSaleItem', () => {
  it('returns empty array for valid item', () => {
    const item = { nameSnapshot: 'Product', quantity: 2, unitPrice: 10 };
    expect(validateSaleItem(item)).toHaveLength(0);
  });

  it('returns error when nameSnapshot is missing', () => {
    const errors = validateSaleItem({ quantity: 1, unitPrice: 5 });
    expect(errors).toContain('El nombre del item es requerido');
  });

  it('returns error when nameSnapshot is empty string', () => {
    const errors = validateSaleItem({ nameSnapshot: '  ', quantity: 1, unitPrice: 5 });
    expect(errors).toContain('El nombre del item es requerido');
  });

  it('returns error when quantity is invalid', () => {
    const errors = validateSaleItem({ nameSnapshot: 'P', quantity: 0, unitPrice: 5 });
    expect(errors).toContain('La cantidad debe ser un número entero positivo');
  });

  it('returns error when quantity is decimal', () => {
    const errors = validateSaleItem({ nameSnapshot: 'P', quantity: 1.5, unitPrice: 5 });
    expect(errors).toContain('La cantidad debe ser un número entero positivo');
  });

  it('returns error when unitPrice is invalid', () => {
    const errors = validateSaleItem({ nameSnapshot: 'P', quantity: 1, unitPrice: -1 });
    expect(errors).toContain('El precio debe ser un número válido mayor o igual a 0');
  });

  it('accepts unitPrice of 0', () => {
    const errors = validateSaleItem({ nameSnapshot: 'P', quantity: 1, unitPrice: 0 });
    expect(errors).toHaveLength(0);
  });

  it('returns multiple errors when multiple fields are invalid', () => {
    const errors = validateSaleItem({});
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });
});

// ─── roundPrice ──────────────────────────────────────────────────────────────

describe('roundPrice', () => {
  it('rounds to 2 decimal places', () => {
    expect(roundPrice(10.005)).toBeCloseTo(10.01, 2);
  });

  it('leaves integer amounts unchanged', () => {
    expect(roundPrice(100)).toBe(100);
  });

  it('handles numbers with exactly 2 decimals', () => {
    expect(roundPrice(9.99)).toBeCloseTo(9.99, 2);
  });
});

// ─── calculateDiscount ───────────────────────────────────────────────────────

describe('calculateDiscount', () => {
  it('calculates 10% discount correctly', () => {
    expect(calculateDiscount(100, 10)).toBeCloseTo(10);
  });

  it('calculates 0% discount as 0', () => {
    expect(calculateDiscount(100, 0)).toBe(0);
  });

  it('calculates 100% discount as full price', () => {
    expect(calculateDiscount(100, 100)).toBeCloseTo(100);
  });

  it('returns rounded result', () => {
    // 9.99 * 10% = 0.999 → rounded 1.00
    expect(calculateDiscount(9.99, 10)).toBeCloseTo(1.0, 1);
  });
});

// ─── applyDiscount ───────────────────────────────────────────────────────────

describe('applyDiscount', () => {
  it('applies discount and returns final price', () => {
    expect(applyDiscount(100, 20)).toBeCloseTo(80);
  });

  it('returns original price when discount is 0', () => {
    expect(applyDiscount(50, 0)).toBeCloseTo(50);
  });

  it('returns 0 when discount is 100%', () => {
    expect(applyDiscount(100, 100)).toBeCloseTo(0);
  });

  it('returns rounded result', () => {
    expect(applyDiscount(9.99, 10)).toBeCloseTo(8.99, 1);
  });
});
