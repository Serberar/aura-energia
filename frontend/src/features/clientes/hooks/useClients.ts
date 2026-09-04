/**
 * Hook para gestión de lista de clientes
 */

import { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { fetchClients } from '../clientsSlice';

interface UseClientsOptions {
  autoFetch?: boolean;
  searchTerm?: string;
}

export const useClients = (options: UseClientsOptions = {}) => {
  const { autoFetch = true, searchTerm = '' } = options;

  const dispatch = useAppDispatch();
  const { clients, loading, error, lastFetch } = useAppSelector((state) => state.clients);

  // Auto-fetch al montar el componente
  useEffect(() => {
    if (autoFetch && !lastFetch) {
      dispatch(fetchClients());
    }
  }, [autoFetch, lastFetch, dispatch]);

  // Refrescar clientes
  const refresh = () => {
    dispatch(fetchClients());
  };

  // Filtrar clientes
  const filteredClients = useMemo(() => {
    let filtered = [...clients];

    // Filtrar por término de búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.firstName.toLowerCase().includes(term) ||
          c.lastName.toLowerCase().includes(term) ||
          c.dni?.toLowerCase().includes(term) ||
          c.email?.toLowerCase().includes(term) ||
          c.businessName?.toLowerCase().includes(term) ||
          c.phones?.some((phone) => phone.toLowerCase().includes(term))
      );
    }

    return filtered;
  }, [clients, searchTerm]);

  // Estadísticas
  const stats = useMemo(
    () => ({
      total: clients.length,
    }),
    [clients]
  );

  return {
    clients: filteredClients,
    allClients: clients,
    loading,
    error,
    stats,
    refresh,
    lastFetch,
  };
};
