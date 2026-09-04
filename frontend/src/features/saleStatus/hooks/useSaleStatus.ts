/**
 * Hook personalizado para gestionar estados de venta
 */

import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import type {
  CreateSaleStatusData,
  UpdateSaleStatusData,
  ReorderStatusesRequest,
} from '@/types/sales';
import {
  fetchSaleStatuses,
  fetchSaleStatusById,
  createSaleStatus,
  updateSaleStatus,
  deleteSaleStatus,
  reorderSaleStatuses,
  clearError,
} from '../saleStatusSlice';

/**
 * Hook para acceder y gestionar estados de venta desde Redux
 * Proporciona métodos para CRUD y reordenamiento
 */
export const useSaleStatus = () => {
  const dispatch = useAppDispatch();

  // Selectors
  const statuses = useAppSelector((state) => state.saleStatus.statuses);
  const loading = useAppSelector((state) => state.saleStatus.loading);
  const error = useAppSelector((state) => state.saleStatus.error);
  const lastFetch = useAppSelector((state) => state.saleStatus.lastFetch);

  /**
   * Cargar todos los estados de venta
   * Solo hace fetch si no hay datos o han pasado más de 5 minutos
   */
  const loadStatuses = useCallback(
    (force = false) => {
      const shouldFetch = force || !lastFetch || Date.now() - lastFetch > 5 * 60 * 1000;

      if (shouldFetch) {
        dispatch(fetchSaleStatuses());
      }
    },
    [dispatch, lastFetch]
  );

  /**
   * Cargar un estado específico por ID
   */
  const loadStatusById = useCallback(
    (id: string) => {
      return dispatch(fetchSaleStatusById(id));
    },
    [dispatch]
  );

  /**
   * Crear un nuevo estado de venta
   */
  const createStatus = useCallback(
    async (data: CreateSaleStatusData) => {
      const result = await dispatch(createSaleStatus(data));
      if (createSaleStatus.fulfilled.match(result)) {
        return result.payload;
      }
      throw new Error(result.payload as string);
    },
    [dispatch]
  );

  /**
   * Actualizar un estado existente
   */
  const updateStatus = useCallback(
    async (id: string, data: UpdateSaleStatusData) => {
      const result = await dispatch(updateSaleStatus({ id, data }));
      if (updateSaleStatus.fulfilled.match(result)) {
        return result.payload;
      }
      throw new Error(result.payload as string);
    },
    [dispatch]
  );

  /**
   * Eliminar un estado de venta
   */
  const deleteStatus = useCallback(
    async (id: string) => {
      const result = await dispatch(deleteSaleStatus(id));
      if (deleteSaleStatus.fulfilled.match(result)) {
        return true;
      }
      throw new Error(result.payload as string);
    },
    [dispatch]
  );

  /**
   * Reordenar estados de venta
   */
  const reorderStatuses = useCallback(
    async (data: ReorderStatusesRequest) => {
      const result = await dispatch(reorderSaleStatuses(data));
      if (reorderSaleStatuses.fulfilled.match(result)) {
        return result.payload;
      }
      throw new Error(result.payload as string);
    },
    [dispatch]
  );

  /**
   * Limpiar errores
   */
  const clearErrors = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  /**
   * Obtener un estado por ID desde el estado local
   */
  const getStatusById = useCallback(
    (id: string) => {
      return statuses.find((status) => status.id === id);
    },
    [statuses]
  );

  /**
   * Obtener estados finales
   */
  const finalStatuses = statuses.filter((status) => status.isFinal);

  /**
   * Obtener estados no finales
   */
  const nonFinalStatuses = statuses.filter((status) => !status.isFinal);

  /**
   * Verificar si existe un estado con un orden específico
   */
  const hasStatusWithOrder = useCallback(
    (order: number) => {
      return statuses.some((status) => status.order === order);
    },
    [statuses]
  );

  /**
   * Obtener el siguiente número de orden disponible
   */
  const getNextOrder = useCallback(() => {
    if (statuses.length === 0) return 0;
    return Math.max(...statuses.map((s) => s.order)) + 1;
  }, [statuses]);

  // Auto-cargar estados al montar el componente
  useEffect(() => {
    loadStatuses();
  }, [loadStatuses]);

  return {
    // Estado
    statuses,
    loading,
    error,
    finalStatuses,
    nonFinalStatuses,

    // Métodos
    loadStatuses,
    loadStatusById,
    createStatus,
    updateStatus,
    deleteStatus,
    reorderStatuses,
    clearErrors,

    // Helpers
    getStatusById,
    hasStatusWithOrder,
    getNextOrder,
  };
};

export default useSaleStatus;
