import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/crmApi', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn() },
}));

vi.mock('@/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), error: vi.fn(), apiError: vi.fn(), userAction: vi.fn() },
}));

import api from '@/api/crmApi';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  toggleProductActive,
} from './productService';
import type { Product } from '@/types/sales';

const mockApi = api as any;

const mockProduct: Product = {
  id: 'prod-1',
  name: 'Seguro de Vida',
  description: 'Plan básico',
  sku: 'SEG-VIDA-01',
  price: 29.99,
  active: true,
};

describe('productService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getAllProducts', () => {
    it('calls GET /products and returns array', async () => {
      mockApi.get.mockResolvedValue({ data: [mockProduct] });

      const result = await getAllProducts();

      expect(mockApi.get).toHaveBeenCalledWith('/products');
      expect(result).toEqual([mockProduct]);
    });

    it('returns empty array when no products', async () => {
      mockApi.get.mockResolvedValue({ data: [] });
      expect(await getAllProducts()).toEqual([]);
    });

    it('throws when API fails', async () => {
      mockApi.get.mockRejectedValue(new Error('Server error'));
      await expect(getAllProducts()).rejects.toThrow('Server error');
    });
  });

  describe('getProductById', () => {
    it('calls GET /products/:id and returns product', async () => {
      mockApi.get.mockResolvedValue({ data: mockProduct });

      const result = await getProductById('prod-1');

      expect(mockApi.get).toHaveBeenCalledWith('/products/prod-1');
      expect(result).toEqual(mockProduct);
    });

    it('throws when not found', async () => {
      mockApi.get.mockRejectedValue(new Error('Not found'));
      await expect(getProductById('non-existent')).rejects.toThrow('Not found');
    });
  });

  describe('createProduct', () => {
    it('calls POST /products with data and returns product from response.data.product', async () => {
      mockApi.post.mockResolvedValue({ data: { message: 'Created', product: mockProduct } });

      const result = await createProduct({ name: 'Seguro de Vida', price: 29.99 });

      expect(mockApi.post).toHaveBeenCalledWith('/products', { name: 'Seguro de Vida', price: 29.99 });
      expect(result).toEqual(mockProduct);
    });

    it('includes optional fields when provided', async () => {
      mockApi.post.mockResolvedValue({ data: { product: mockProduct } });

      await createProduct({ name: 'Test', price: 10, description: 'Desc', sku: 'SKU-01' });

      expect(mockApi.post).toHaveBeenCalledWith('/products', {
        name: 'Test',
        price: 10,
        description: 'Desc',
        sku: 'SKU-01',
      });
    });

    it('throws when API fails', async () => {
      mockApi.post.mockRejectedValue(new Error('Duplicate SKU'));
      await expect(createProduct({ name: 'Test', price: 10 })).rejects.toThrow('Duplicate SKU');
    });
  });

  describe('updateProduct', () => {
    it('calls PUT /products/:id with data and returns updated product', async () => {
      const updated = { ...mockProduct, name: 'Seguro de Vida Plus' };
      mockApi.put.mockResolvedValue({ data: { product: updated } });

      const result = await updateProduct('prod-1', { name: 'Seguro de Vida Plus' });

      expect(mockApi.put).toHaveBeenCalledWith('/products/prod-1', { name: 'Seguro de Vida Plus' });
      expect(result.name).toBe('Seguro de Vida Plus');
    });

    it('throws when API fails', async () => {
      mockApi.put.mockRejectedValue(new Error('Not found'));
      await expect(updateProduct('x', { name: 'X' })).rejects.toThrow('Not found');
    });
  });

  describe('toggleProductActive', () => {
    it('calls PATCH /products/:id/toggle and returns updated product', async () => {
      const toggled = { ...mockProduct, active: false };
      mockApi.patch.mockResolvedValue({ data: { product: toggled } });

      const result = await toggleProductActive('prod-1');

      expect(mockApi.patch).toHaveBeenCalledWith('/products/prod-1/toggle');
      expect(result.active).toBe(false);
    });

    it('throws when API fails', async () => {
      mockApi.patch.mockRejectedValue(new Error('Not found'));
      await expect(toggleProductActive('prod-1')).rejects.toThrow('Not found');
    });
  });
});
