/**
 * Hook para acciones sobre clientes
 */

import { useAppDispatch } from '@/hooks/reduxHooks';
import { createClient,  searchClient } from '../clientsSlice';
import type { CreateClientData } from '@/types/sales';

export const useClientActions = () => {
  const dispatch = useAppDispatch();

  const create = async (data: CreateClientData) => {
    const result = await dispatch(createClient(data));
    if (createClient.fulfilled.match(result)) {
      return result.payload;
    }
    throw new Error(result.payload as string || 'Error al crear cliente');
  };

  const search = async (value: string) => {
    const result = await dispatch(searchClient(value));
    if (searchClient.fulfilled.match(result)) {
      return result.payload;
    }
    throw new Error(result.payload as string || 'Error al buscar cliente');
  };

  return {
    createClient: create,
    searchClient: search,
  };
};
