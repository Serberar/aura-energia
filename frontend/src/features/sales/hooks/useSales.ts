/**
 * Hook para gestionar ventas
 */

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import type { CreateSaleData, SaleFilters } from '@/types/sales';
import {
  fetchSales,
  fetchSaleById,
  createSale,
  deleteSale,
  setFilters,
  clearFilters,
  selectSale,
  clearError,
} from '../salesSlice';

export const useSales = () => {
  const dispatch = useAppDispatch();

  const sales = useAppSelector((state) => state.sales.sales);
  const selectedSale = useAppSelector((state) => state.sales.selectedSale);
  const filters = useAppSelector((state) => state.sales.filters);
  const loading = useAppSelector((state) => state.sales.loading);
  const error = useAppSelector((state) => state.sales.error);
  const lastFetch = useAppSelector((state) => state.sales.lastFetch);

  const loadSales = useCallback(
    (saleFilters?: SaleFilters, force = false) => {
      const shouldFetch = force || !lastFetch || Date.now() - lastFetch > 5 * 60 * 1000;
      if (shouldFetch) {
        dispatch(fetchSales(saleFilters));
      }
    },
    [dispatch, lastFetch]
  );

  const loadSaleById = useCallback(
    (id: string) => {
      return dispatch(fetchSaleById(id));
    },
    [dispatch]
  );

  const create = useCallback(
    async (data: CreateSaleData) => {
      const result = await dispatch(createSale(data));
      if (createSale.fulfilled.match(result)) {
        return result.payload;
      }
      throw new Error(result.payload as string);
    },
    [dispatch]
  );

  const remove = useCallback(
    async (id: string) => {
      const result = await dispatch(deleteSale(id));
      if (deleteSale.fulfilled.match(result)) {
        return true;
      }
      throw new Error(result.payload as string);
    },
    [dispatch]
  );

  const applyFilters = useCallback(
    (newFilters: SaleFilters) => {
      dispatch(setFilters(newFilters));
      dispatch(fetchSales(newFilters));
    },
    [dispatch]
  );

  const removeFilters = useCallback(() => {
    dispatch(clearFilters());
    // No cargar ventas automáticamente al limpiar filtros
  }, [dispatch]);

  const selectSaleById = useCallback(
    (id: string | null) => {
      const sale = id ? sales.find((s) => s.id === id) : null;
      dispatch(selectSale(sale || null));
    },
    [dispatch, sales]
  );

  const clearErrors = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // NO cargar ventas automáticamente al montar el componente
  // useEffect(() => {
  //   loadSales();
  // }, [loadSales]);

  return {
    sales,
    selectedSale,
    filters,
    loading,
    error,
    loadSales,
    loadSaleById,
    create,
    remove,
    applyFilters,
    removeFilters,
    selectSaleById,
    clearErrors,
  };
};
