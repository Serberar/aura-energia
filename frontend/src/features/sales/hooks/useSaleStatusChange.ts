/**
 * Hook para cambiar el estado de una venta
 */

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { changeSaleStatus } from '../salesSlice';

export const useSaleStatusChange = (saleId: string) => {
  const dispatch = useAppDispatch();
  const loading = useAppSelector((state) => state.sales.loading);
  const error = useAppSelector((state) => state.sales.error);

  const changeStatus = useCallback(
    async (statusId: string) => {
      const result = await dispatch(changeSaleStatus({ saleId, statusData: { statusId } }));
      if (changeSaleStatus.fulfilled.match(result)) {
        return result.payload;
      }
      throw new Error(result.payload as string);
    },
    [dispatch, saleId]
  );

  return {
    loading,
    error,
    changeStatus,
  };
};
