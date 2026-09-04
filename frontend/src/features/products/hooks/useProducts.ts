/**
 * Hook para gestión de lista de productos
 */

import { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { fetchProducts } from '../productsSlice';
import type { Product } from '@/types/sales';

interface UseProductsOptions {
  autoFetch?: boolean;
  filterActive?: boolean | null; // null = todos, true = solo activos, false = solo inactivos
  searchTerm?: string;
}

export const useProducts = (options: UseProductsOptions = {}) => {
  const { autoFetch = true, filterActive = null, searchTerm = '' } = options;

  const dispatch = useAppDispatch();
  const { products, loading, error, lastFetch } = useAppSelector((state) => state.products);

  // Auto-fetch al montar el componente
  useEffect(() => {
    if (autoFetch && !lastFetch) {
      dispatch(fetchProducts());
    }
  }, [autoFetch, lastFetch, dispatch]);

  // Refrescar productos
  const refresh = () => {
    dispatch(fetchProducts());
  };

  // Filtrar productos
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Filtrar por estado activo/inactivo
    if (filterActive !== null) {
      filtered = filtered.filter((p) => p.active === filterActive);
    }

    // Filtrar por término de búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.description?.toLowerCase().includes(term) ||
          p.sku?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [products, filterActive, searchTerm]);

  // Estadísticas
  const stats = useMemo(
    () => ({
      total: products.length,
      active: products.filter((p: Product) => p.active).length,
      inactive: products.filter((p: Product) => !p.active).length,
    }),
    [products]
  );

  return {
    products: filteredProducts,
    allProducts: products,
    loading,
    error,
    stats,
    refresh,
    lastFetch,
  };
};
