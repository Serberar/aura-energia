import { useState, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../hooks/reduxHooks';
import { clientService } from '../../../features/clientes/services/clientService';
import { doSearch1Skore } from '../../../features/1skore/skoreSlice';
import type { Client, SkoreSearchResponse } from '../../../types';
import {
  calculateClientCompleteness,
  deduplicateCrmClients,
} from '../utils/clientDeduplication';
import { logger } from '../../../utils/logger';

/**
 * Calcula un puntaje de completitud para un resultado de Skore
 */
const calculateSkoreCompleteness = (skore: Record<string, unknown>): number => {
  let score = 0;
  if (skore.nombre) score += 1;
  if (skore.apellidos) score += 1;
  if (skore.documento) score += 1;
  if (skore.fecha_nacimiento) score += 1;
  if (skore.dir_direccion) score += 2;
  if (skore.dir_cp) score += 1;
  if (skore.dir_municipio) score += 1;
  if (skore.dir_provincia) score += 1;
  const telefonos = skore.telefonos as string[] | undefined;
  if (telefonos?.length) score += telefonos.length;
  const emails = skore.emails as string[] | undefined;
  if (emails?.length) score += emails.length * 2;
  if (skore.cnae) score += 1;
  if (skore.operador_actual) score += 1;
  return score;
};

/**
 * Compara la completitud de un cliente CRM vs un resultado de Skore
 * Retorna true si Skore tiene más datos útiles
 */
const skoreHasMoreData = (client: Client, skore: Record<string, unknown>): boolean => {
  const crmScore = calculateClientCompleteness(client);
  const skoreScore = calculateSkoreCompleteness(skore);
  return skoreScore > crmScore;
};

export interface SkoreResult {
  searchValue?: string;
  // Campos de teléfono
  telefono?: string;
  tipo_telefono?: string;
  // Campos de DNI
  nombre?: string;
  apellidos?: string;
  // Campos comunes
  documento?: string;
  tipo_documento?: string;
  fecha_nacimiento?: string;
  cnae?: string;
  cnae_descripcion?: string;
  dir_direccion?: string;
  dir_cp?: string;
  dir_municipio?: string;
  dir_provincia?: string;
  comunidad_autonoma?: string;
  telefonos?: string[];
  emails?: string[];
  // Campos adicionales de teléfono
  activo_voz?: string;
  activo_whatsapp?: string;
  operador_actual?: string;
  fecha_ult_portabilidad?: string;
  operador_donante?: string;
  operador_original?: string;
}

export interface UnifiedSearchResult {
  searchTerm: string;
  crmClients: Client[];
  skoreResults: SkoreResult[];
  error?: string;
  isLoading: boolean;
  autoLoadJson?: boolean;
}

export const useUnifiedSearch = () => {
  const dispatch = useAppDispatch();
  const crmOnlineSearchEnabled = useAppSelector((s) => s.appSettings.crmOnlineSearchEnabled);
  const [searchResults, setSearchResults] = useState<UnifiedSearchResult[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const performUnifiedSearch = useCallback(async (searchTerm: string) => {
    // Cancelar búsqueda anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    if (!searchTerm.trim()) {
      throw new Error('Introduce un número de teléfono o DNI para buscar');
    }

    // Crear resultado inicial con loading
    const initialResult: UnifiedSearchResult = {
      searchTerm,
      crmClients: [],
      skoreResults: [],
      isLoading: true,
    };

    setSearchResults(prev => [...prev, initialResult]);

    try {
      // Verificar si fue cancelada antes de empezar
      if (signal.aborted) return;

      // Ejecutar búsquedas según configuración
      const searches: [Promise<Client[] | Client>, Promise<SkoreSearchResponse>] = [
        clientService.searchClient(searchTerm, signal),
        crmOnlineSearchEnabled
          ? dispatch(doSearch1Skore(searchTerm)).unwrap()
          : Promise.reject(new Error('online-search-disabled')),
      ];
      const [crmResults, skoreResult] = await Promise.allSettled(searches);

      // Verificar si fue cancelada mientras esperábamos
      if (signal.aborted) return;

      const crmValue = crmResults.status === 'fulfilled' ? crmResults.value : [];
      const rawCrmClients: Client[] = Array.isArray(crmValue) ? crmValue : [crmValue];
      const rawSkoreResults = skoreResult.status === 'fulfilled' ?
        [{ ...skoreResult.value, searchValue: searchTerm }] : [];

      // Deduplicar clientes del CRM (fusionar registros con mismo DNI)
      const finalCrmClients = deduplicateCrmClients(rawCrmClients);

      // Filtrar duplicados entre CRM y Skore
      // Mostrar Skore si: no hay cliente en CRM con ese DNI, O si Skore tiene más datos
      const filteredSkoreResults = rawSkoreResults.filter(skoreResult => {
        const skoreData = skoreResult as Record<string, unknown>;
        const documento = skoreData.documento;
        if (!documento) return true; // Si no tiene DNI, lo mostramos

        const skoreDni = String(documento).toLowerCase().trim();
        const matchingCrmClient = finalCrmClients.find(
          (client: Client) => client.dni?.toLowerCase().trim() === skoreDni
        );

        // Mostrar Skore si:
        // 1. No hay cliente CRM con ese DNI
        // 2. O si Skore tiene más datos que el cliente CRM
        return !matchingCrmClient || skoreHasMoreData(matchingCrmClient, skoreData);
      });

      const finalResult: UnifiedSearchResult = {
        searchTerm,
        crmClients: finalCrmClients,
        skoreResults: filteredSkoreResults,
        error: undefined,
        isLoading: false,
        autoLoadJson: finalCrmClients.length === 0 && filteredSkoreResults.length > 0,
      };

      const skoreDisabled = !crmOnlineSearchEnabled;
      if (crmResults.status === 'rejected' && (skoreResult.status === 'rejected' && !skoreDisabled)) {
        finalResult.error = 'No se pudo realizar la búsqueda en ninguna base de datos';
      } else if (finalResult.crmClients.length === 0 && finalResult.skoreResults.length === 0) {
        finalResult.error = 'No se encontraron resultados';
      }

      // Actualizar el resultado
      setSearchResults(prev => 
        prev.map(result => 
          result.searchTerm === searchTerm && result.isLoading 
            ? finalResult 
            : result
        )
      );

    } catch (error) {
      // Ignorar errores de cancelación
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      // Error inesperado
      logger.error('Error en búsqueda unificada', error as Error);
      const errorResult: UnifiedSearchResult = {
        searchTerm,
        crmClients: [],
        skoreResults: [],
        error: 'Error inesperado durante la búsqueda',
        isLoading: false,
      };

      setSearchResults(prev =>
        prev.map(result =>
          result.searchTerm === searchTerm && result.isLoading
            ? errorResult
            : result
        )
      );
    }
  }, [dispatch]);

  const clearResults = () => {
    setSearchResults([]);
  };

  const removeResult = (searchTerm: string) => {
    setSearchResults(prev => prev.filter(result => result.searchTerm !== searchTerm));
  };

  return {
    searchResults,
    performUnifiedSearch,
    clearResults,
    removeResult,
    hasResults: searchResults.length > 0,
    isAnyLoading: searchResults.some(result => result.isLoading),
  };
};