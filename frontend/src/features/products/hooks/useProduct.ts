/**
 * Hook para gestión de un producto individual
 */

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { fetchProductById, selectProduct, clearSelectedProduct } from '../productsSlice';

interface UseProductOptions {
  autoFetch?: boolean;
  clearOnUnmount?: boolean;
}

export const useProduct = (productId: string | null, options: UseProductOptions = {}) => {
  const { autoFetch = true, clearOnUnmount = true } = options;

  const dispatch = useAppDispatch();
  const { selectedProduct, loading, error } = useAppSelector((state) => state.products);

  // Auto-fetch al montar si hay productId
  useEffect(() => {
    if (autoFetch && productId && productId !== selectedProduct?.id) {
      dispatch(fetchProductById(productId));
    }
  }, [autoFetch, productId, selectedProduct?.id, dispatch]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (clearOnUnmount) {
        dispatch(clearSelectedProduct());
      }
    };
  }, [clearOnUnmount, dispatch]);

  // Seleccionar producto manualmente
  const select = (product: any) => {
    dispatch(selectProduct(product));
  };

  // Refrescar producto actual
  const refresh = () => {
    if (productId) {
      dispatch(fetchProductById(productId));
    }
  };

  return {
    product: selectedProduct,
    loading,
    error,
    select,
    refresh,
  };
};
