/**
 * Hook para acciones CRUD de productos
 */

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import {
  createProduct,
  updateProduct,
  toggleProductActive,
  clearError,
} from '../productsSlice';
import type { CreateProductData, UpdateProductData } from '@/types/sales';

export const useProductActions = () => {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.products);

  // Crear producto
  const create = useCallback(
    async (data: CreateProductData) => {
      const result = await dispatch(createProduct(data));
      if (createProduct.fulfilled.match(result)) {
        return result.payload;
      }
      throw new Error(result.payload as string);
    },
    [dispatch]
  );

  // Actualizar producto
  const update = useCallback(
    async (id: string, data: UpdateProductData) => {
      const result = await dispatch(updateProduct({ id, data }));
      if (updateProduct.fulfilled.match(result)) {
        return result.payload;
      }
      throw new Error(result.payload as string);
    },
    [dispatch]
  );

  // Toggle activo/inactivo
  const toggleActive = useCallback(
    async (id: string) => {
      const result = await dispatch(toggleProductActive(id));
      if (toggleProductActive.fulfilled.match(result)) {
        return result.payload;
      }
      throw new Error(result.payload as string);
    },
    [dispatch]
  );

  // Limpiar errores
  const clear = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    create,
    update,
    toggleActive,
    clearError: clear,
    loading,
    error,
  };
};
