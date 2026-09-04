import { describe, it, expect } from 'vitest';
import {
  productSchema,
  clientSchema,
  saleStatusSchema,
  saleFormSchema,
  validateWithSchema,
  validateField,
} from './schemas';

// ─── productSchema ────────────────────────────────────────────────────────────

describe('productSchema', () => {
  const valid = { name: 'Seguro Hogar', price: '49.99' };

  it('passes for valid product', () => {
    expect(productSchema.safeParse(valid).success).toBe(true);
  });

  it('fails when name is empty', () => {
    const result = productSchema.safeParse({ ...valid, name: '' });
    expect(result.success).toBe(false);
  });

  it('fails when price is 0 or negative', () => {
    expect(productSchema.safeParse({ ...valid, price: '0' }).success).toBe(false);
    expect(productSchema.safeParse({ ...valid, price: '-5' }).success).toBe(false);
  });

  it('fails when price is not a number', () => {
    expect(productSchema.safeParse({ ...valid, price: 'abc' }).success).toBe(false);
  });

  it('accepts optional sku and description', () => {
    const result = productSchema.safeParse({ ...valid, sku: 'S-001', description: 'Desc' });
    expect(result.success).toBe(true);
  });
});

// ─── clientSchema ─────────────────────────────────────────────────────────────

describe('clientSchema', () => {
  const valid = {
    firstName: 'María',
    lastName: 'González',
    dni: '12345678A',
    phones: ['612345678'],
  };

  it('passes for valid client', () => {
    expect(clientSchema.safeParse(valid).success).toBe(true);
  });

  it('fails when firstName is less than 2 chars', () => {
    expect(clientSchema.safeParse({ ...valid, firstName: 'M' }).success).toBe(false);
  });

  it('fails when lastName is less than 2 chars', () => {
    expect(clientSchema.safeParse({ ...valid, lastName: 'G' }).success).toBe(false);
  });

  it('fails when dni is empty', () => {
    expect(clientSchema.safeParse({ ...valid, dni: '' }).success).toBe(false);
  });

  it('fails when phones array is empty', () => {
    expect(clientSchema.safeParse({ ...valid, phones: [] }).success).toBe(false);
  });

  it('fails when all phones are empty strings', () => {
    expect(clientSchema.safeParse({ ...valid, phones: ['', '  '] }).success).toBe(false);
  });

  it('fails for invalid email', () => {
    expect(clientSchema.safeParse({ ...valid, email: 'not-an-email' }).success).toBe(false);
  });

  it('accepts empty string for email', () => {
    expect(clientSchema.safeParse({ ...valid, email: '' }).success).toBe(true);
  });
});

// ─── saleStatusSchema ─────────────────────────────────────────────────────────

describe('saleStatusSchema', () => {
  const valid = { name: 'Inicial', order: 1, color: '#FF0000', isFinal: false, isCancelled: false };

  it('passes for valid saleStatus', () => {
    expect(saleStatusSchema.safeParse(valid).success).toBe(true);
  });

  it('fails when name is empty', () => {
    expect(saleStatusSchema.safeParse({ ...valid, name: '' }).success).toBe(false);
  });

  it('fails for invalid color format', () => {
    expect(saleStatusSchema.safeParse({ ...valid, color: 'red' }).success).toBe(false);
    expect(saleStatusSchema.safeParse({ ...valid, color: '#GGG' }).success).toBe(false);
  });

  it('accepts valid hex color', () => {
    expect(saleStatusSchema.safeParse({ ...valid, color: '#6c757d' }).success).toBe(true);
  });

  it('fails when order is negative', () => {
    expect(saleStatusSchema.safeParse({ ...valid, order: -1 }).success).toBe(false);
  });
});

// ─── saleFormSchema ───────────────────────────────────────────────────────────

describe('saleFormSchema', () => {
  const validClient = {
    id: 'client-1',
    firstName: 'María',
    lastName: 'González',
    dni: '12345678A',
    email: 'maria@example.com',
    phones: ['612345678'],
    bankAccounts: ['ES1234567890123456789012'],
    address: { address: 'Calle Mayor 1', cupsLuz: 'ES0031405...', cupsGas: '' },
  };
  const validItem = { productId: 'prod-1', name: 'Seguro Hogar', quantity: 1, price: 49.99 };
  const valid = { client: validClient, items: [validItem], comercial: 'Carlos Ruiz' };

  it('passes for complete valid sale', () => {
    expect(saleFormSchema.safeParse(valid).success).toBe(true);
  });

  it('fails when items array is empty', () => {
    expect(saleFormSchema.safeParse({ ...valid, items: [] }).success).toBe(false);
  });

  it('fails when comercial is empty', () => {
    expect(saleFormSchema.safeParse({ ...valid, comercial: '' }).success).toBe(false);
  });

  it('fails when client email is invalid', () => {
    const result = saleFormSchema.safeParse({
      ...valid,
      client: { ...validClient, email: 'bad-email' },
    });
    expect(result.success).toBe(false);
  });
});

// ─── validateWithSchema ────────────────────────────────────────────────────────

describe('validateWithSchema', () => {
  it('returns null for valid data', () => {
    const result = validateWithSchema(productSchema, { name: 'Test', price: '10' });
    expect(result).toBeNull();
  });

  it('returns error object for invalid data', () => {
    const result = validateWithSchema(productSchema, { name: '', price: '0' });
    expect(result).not.toBeNull();
    expect(result).toHaveProperty('name');
  });

  it('includes error message per field', () => {
    const result = validateWithSchema(productSchema, { name: '', price: '0' });
    expect(typeof result!['name']).toBe('string');
  });
});

// ─── validateField ─────────────────────────────────────────────────────────────

describe('validateField', () => {
  it('returns undefined for valid field value', () => {
    expect(validateField(productSchema, 'name', 'Valid Name')).toBeUndefined();
  });

  it('returns error message for invalid field value', () => {
    const result = validateField(productSchema, 'name', '');
    expect(typeof result).toBe('string');
  });

  it('returns undefined for unknown field', () => {
    expect(validateField(productSchema, 'unknownField', 'value')).toBeUndefined();
  });
});
