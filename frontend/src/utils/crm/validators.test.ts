import { describe, it, expect } from 'vitest';
import {
  validateProduct,
  validateSale,
  validateSaleItem,
  validateClient,
  isValidPrice,
  isValidQuantity,
  isValidEmail,
  isValidPhone,
  isValidDNI,
  isNotEmpty,
  hasMinLength,
  hasMaxLength,
  isInRange,
} from './validators';

describe('validators', () => {
  describe('isValidPrice', () => {
    it('should return true for valid prices', () => {
      expect(isValidPrice(0)).toBe(true);
      expect(isValidPrice(10.99)).toBe(true);
      expect(isValidPrice(1000)).toBe(true);
    });

    it('should return false for invalid prices', () => {
      expect(isValidPrice(-1)).toBe(false);
      expect(isValidPrice(NaN)).toBe(false);
      expect(isValidPrice(Infinity)).toBe(false);
    });
  });

  describe('isValidQuantity', () => {
    it('should return true for valid quantities', () => {
      expect(isValidQuantity(1)).toBe(true);
      expect(isValidQuantity(10)).toBe(true);
      expect(isValidQuantity(100)).toBe(true);
    });

    it('should return false for invalid quantities', () => {
      expect(isValidQuantity(0)).toBe(false);
      expect(isValidQuantity(-1)).toBe(false);
      expect(isValidQuantity(1.5)).toBe(false);
      expect(isValidQuantity(NaN)).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('should return true for valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co')).toBe(true);
      expect(isValidEmail('info+tag@company.es')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('no-at-sign.com')).toBe(false);
      expect(isValidEmail('@nodomain.com')).toBe(false);
      expect(isValidEmail('no-domain@')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('should return true for valid Spanish phones', () => {
      expect(isValidPhone('612345678')).toBe(true);
      expect(isValidPhone('712345678')).toBe(true);
      expect(isValidPhone('812345678')).toBe(true);
      expect(isValidPhone('912345678')).toBe(true);
      expect(isValidPhone('+34612345678')).toBe(true);
    });

    it('should handle formatted phones', () => {
      expect(isValidPhone('612 34 56 78')).toBe(true);
      expect(isValidPhone('612-34-56-78')).toBe(true);
      expect(isValidPhone('(612) 345-678')).toBe(true);
    });

    it('should return false for invalid phones', () => {
      expect(isValidPhone('123456789')).toBe(false); // Doesn't start with 6-9
      expect(isValidPhone('61234567')).toBe(false); // Too short
      expect(isValidPhone('6123456789')).toBe(false); // Too long
    });
  });

  describe('isValidDNI', () => {
    it('should return true for valid DNIs', () => {
      expect(isValidDNI('12345678Z')).toBe(true);
      expect(isValidDNI('87654321X')).toBe(true);
    });

    it('should return true for valid NIEs', () => {
      expect(isValidDNI('X1234567L')).toBe(true);
      expect(isValidDNI('Y1234567X')).toBe(true);
    });

    it('should handle formatted DNI/NIE', () => {
      expect(isValidDNI('12345678-Z')).toBe(true);
      expect(isValidDNI('12 345 678 Z')).toBe(true);
    });

    it('should return false for invalid DNI/NIE', () => {
      expect(isValidDNI('12345678A')).toBe(false); // Wrong letter
      expect(isValidDNI('1234567Z')).toBe(false); // Too short
      expect(isValidDNI('123456789Z')).toBe(false); // Too long
      expect(isValidDNI('ABCDEFGHJ')).toBe(false); // Invalid format
    });
  });

  describe('isNotEmpty', () => {
    it('should return true for non-empty strings', () => {
      expect(isNotEmpty('hello')).toBe(true);
      expect(isNotEmpty(' a ')).toBe(true);
    });

    it('should return false for empty strings', () => {
      expect(isNotEmpty('')).toBe(false);
      expect(isNotEmpty('   ')).toBe(false);
    });
  });

  describe('hasMinLength', () => {
    it('should return true when meets minimum length', () => {
      expect(hasMinLength('hello', 5)).toBe(true);
      expect(hasMinLength('hello', 3)).toBe(true);
    });

    it('should return false when below minimum length', () => {
      expect(hasMinLength('hi', 3)).toBe(false);
      expect(hasMinLength('', 1)).toBe(false);
    });
  });

  describe('hasMaxLength', () => {
    it('should return true when within maximum length', () => {
      expect(hasMaxLength('hello', 10)).toBe(true);
      expect(hasMaxLength('hello', 5)).toBe(true);
    });

    it('should return false when exceeds maximum length', () => {
      expect(hasMaxLength('hello world', 5)).toBe(false);
    });
  });

  describe('isInRange', () => {
    it('should return true when within range', () => {
      expect(isInRange(5, 1, 10)).toBe(true);
      expect(isInRange(1, 1, 10)).toBe(true);
      expect(isInRange(10, 1, 10)).toBe(true);
    });

    it('should return false when outside range', () => {
      expect(isInRange(0, 1, 10)).toBe(false);
      expect(isInRange(11, 1, 10)).toBe(false);
    });
  });

  describe('validateProduct', () => {
    it('should validate correct product', () => {
      const product = {
        name: 'Test Product',
        sku: 'TEST-001',
        price: 19.99,
        stock: 10,
        description: 'A test product',
      };
      const result = validateProduct(product);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject product without name', () => {
      const product = {
        name: '',
        price: 19.99,
        stock: 10,
      };
      const result = validateProduct(product);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('El nombre del producto es requerido');
    });

    it('should reject product with invalid price', () => {
      const product = {
        name: 'Test Product',
        price: -10,
        stock: 10,
      };
      const result = validateProduct(product);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('precio'))).toBe(true);
    });

    it('should not validate stock (not used by system)', () => {
      const product = {
        name: 'Test Product',
        price: 19.99,
        stock: -5,
      };
      const result = validateProduct(product);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateSaleItem', () => {
    it('should validate correct sale item', () => {
      const item = {
        productId: '123',
        quantity: 5,
        unitPrice: 10.99,
      };
      const result = validateSaleItem(item);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject item without product', () => {
      const item = {
        quantity: 5,
        unitPrice: 10.99,
      };
      const result = validateSaleItem(item);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('El producto es requerido');
    });

    it('should reject item with invalid quantity', () => {
      const item = {
        productId: '123',
        quantity: 0,
        unitPrice: 10.99,
      };
      const result = validateSaleItem(item);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('cantidad'))).toBe(true);
    });
  });

  describe('validateSale', () => {
    it('should validate correct sale', () => {
      const sale = {
        clientId: '123',
        statusId: '456',
        items: [
          { id: '001', productId: '789', nameSnapshot: 'Product', quantity: 2, unitPrice: 10, finalPrice: 20 },
        ],
        notes: 'Test sale',
      };
      const result = validateSale(sale);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject sale without client', () => {
      const sale = {
        statusId: '456',
        items: [
          { id: '001', productId: '789', nameSnapshot: 'Product', quantity: 2, unitPrice: 10, finalPrice: 20 },
        ],
      };
      const result = validateSale(sale);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('El cliente es requerido');
    });

    it('should reject sale without items', () => {
      const sale = {
        clientId: '123',
        statusId: '456',
        items: [],
      };
      const result = validateSale(sale);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('La venta debe tener al menos un producto');
    });
  });

  describe('validateClient', () => {
    it('should validate correct client', () => {
      const client = {
        firstName: 'Juan',
        lastName: 'Pérez',
        dni: '12345678Z',
        phones: ['612345678'],
        email: 'juan@example.com',
      };
      const result = validateClient(client);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject client without name', () => {
      const client = {
        firstName: '',
        lastName: 'Pérez',
        dni: '12345678Z',
      };
      const result = validateClient(client);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('El nombre es requerido');
    });

    it('should reject client with invalid DNI', () => {
      const client = {
        firstName: 'Juan',
        lastName: 'Pérez',
        dni: '12345678A', // Wrong letter
      };
      const result = validateClient(client);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('El DNI/NIE no es válido');
    });

    it('should reject client with invalid email', () => {
      const client = {
        firstName: 'Juan',
        lastName: 'Pérez',
        dni: '12345678Z',
        email: 'invalid-email',
      };
      const result = validateClient(client);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('El email no es válido');
    });
  });
});
