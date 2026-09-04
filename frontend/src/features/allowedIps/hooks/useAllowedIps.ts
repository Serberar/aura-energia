import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import type { CreateAllowedIpData } from '../services/allowedIpService';
import {
  fetchAllowedIps,
  createAllowedIp,
  deleteAllowedIp,
  clearError,
} from '../allowedIpSlice';

export const useAllowedIps = () => {
  const dispatch = useAppDispatch();

  const ips = useAppSelector((state) => state.allowedIps.ips);
  const loading = useAppSelector((state) => state.allowedIps.loading);
  const error = useAppSelector((state) => state.allowedIps.error);
  const lastFetch = useAppSelector((state) => state.allowedIps.lastFetch);

  const loadIps = useCallback(
    (force = false) => {
      const shouldFetch = force || !lastFetch || Date.now() - lastFetch > 5 * 60 * 1000;
      if (shouldFetch) {
        dispatch(fetchAllowedIps());
      }
    },
    [dispatch, lastFetch]
  );

  const addIp = useCallback(
    async (data: CreateAllowedIpData) => {
      const result = await dispatch(createAllowedIp(data));
      if (createAllowedIp.fulfilled.match(result)) {
        return result.payload;
      }
      throw new Error(result.payload as string);
    },
    [dispatch]
  );

  const removeIp = useCallback(
    async (id: string) => {
      const result = await dispatch(deleteAllowedIp(id));
      if (deleteAllowedIp.fulfilled.match(result)) {
        return true;
      }
      throw new Error(result.payload as string);
    },
    [dispatch]
  );

  const clearErrors = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    loadIps();
  }, [loadIps]);

  return {
    ips,
    loading,
    error,
    loadIps,
    addIp,
    removeIp,
    clearErrors,
  };
};

export default useAllowedIps;
