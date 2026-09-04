/**
 * Hook para gestionar items de ventas
 */

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import type { CreateSaleItemData, UpdateSaleItemData } from '@/types/sales';
import { addSaleItem, updateSaleItem, removeSaleItem } from '../salesSlice';

export const useSaleItems = (saleId: string) => {
  const dispatch = useAppDispatch();
  const loading = useAppSelector((state) => state.sales.loading);
  const error = useAppSelector((state) => state.sales.error);

  const addItem = useCallback(
    async (itemData: CreateSaleItemData) => {
      const result = await dispatch(addSaleItem({ saleId, itemData }));
      if (addSaleItem.fulfilled.match(result)) {
        return result.payload;
      }
      throw new Error(result.payload as string);
    },
    [dispatch, saleId]
  );

  const updateItem = useCallback(
    async (itemId: string, itemData: UpdateSaleItemData) => {
      const result = await dispatch(updateSaleItem({ saleId, itemId, itemData }));
      if (updateSaleItem.fulfilled.match(result)) {
        return result.payload;
      }
      throw new Error(result.payload as string);
    },
    [dispatch, saleId]
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      const result = await dispatch(removeSaleItem({ saleId, itemId }));
      if (removeSaleItem.fulfilled.match(result)) {
        return result.payload;
      }
      throw new Error(result.payload as string);
    },
    [dispatch, saleId]
  );

  return {
    loading,
    error,
    addItem,
    updateItem,
    removeItem,
  };
};
