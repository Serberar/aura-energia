/**
 * Servicio de clientes - Actualizado para CRM
 * Usa los nuevos endpoints del backend CRM
 */

import api from '@/api/crmApi';
import type {
  Client,
  CreateClientData,
  UpdateClientData,
  PushClientDataRequest,
  ClientResponse,
  AddressInfo,
} from '@/types/sales';
import { logger } from '@/utils/logger';
import { CLIENT_ENDPOINTS } from './api';

/**
 * Normaliza las direcciones para que siempre sean objetos AddressInfo
 * Maneja tanto strings como objetos
 */
const normalizeAddresses = (addresses: (string | AddressInfo)[] | undefined): AddressInfo[] => {
  if (!addresses || !Array.isArray(addresses)) return [];

  return addresses.map((addr) => {
    if (typeof addr === 'string') {
      return { address: addr, cupsGas: '', cupsLuz: '' };
    }
    return addr;
  });
};

/**
 * Normaliza un cliente para asegurar estructura consistente
 */
const normalizeClient = (client: Client): Client => ({
  ...client,
  addresses: normalizeAddresses(client.addresses as unknown as (string | AddressInfo)[]),
});

/**
 * Buscar cliente por ID, DNI o teléfono
 * El backend detecta automáticamente el tipo de búsqueda
 * @param value - Valor de búsqueda (ID, DNI o teléfono)
 * @param signal - AbortSignal opcional para cancelar la petición
 */
export const searchClient = async (
  value: string,
  signal?: AbortSignal
): Promise<Client | Client[]> => {
  try {
    logger.debug(`Buscando cliente: ${value}`);
    const response = await api.get<Client | Client[]>(CLIENT_ENDPOINTS.BY_VALUE(value), {
      signal,
    });

    // El backend puede devolver un solo cliente (por ID) o array (por DNI/teléfono)
    const result = response.data;

    // Normalizar direcciones (pueden venir como strings o como objetos)
    if (Array.isArray(result)) {
      logger.info(`Clientes encontrados: ${result.length}`);
      return result.map(normalizeClient);
    } else {
      logger.info('Cliente encontrado por ID');
      return normalizeClient(result);
    }
  } catch (error) {
    // Re-lanzar errores de cancelación para que el caller los maneje
    if (error instanceof Error && error.name === 'CanceledError') {
      const abortError = new Error('Búsqueda cancelada');
      abortError.name = 'AbortError';
      throw abortError;
    }
    logger.apiError(`GET /clients/${value}`, error);
    throw error;
  }
};

/**
 * Obtener cliente por ID específicamente
 */
export const getClientById = async (id: string): Promise<Client> => {
  try {
    logger.debug(`Obteniendo cliente por ID: ${id}`);
    const response = await api.get<Client>(CLIENT_ENDPOINTS.BY_VALUE(id));
    logger.info(`Cliente obtenido: ${response.data.firstName} ${response.data.lastName}`);
    return normalizeClient(response.data);
  } catch (error) {
    logger.apiError(`GET /clients/${id}`, error);
    throw error;
  }
};

/**
 * Crear nuevo cliente
 */
export const createClient = async (data: CreateClientData): Promise<Client> => {
  try {
    logger.debug('Creando nuevo cliente', { firstName: data.firstName, lastName: data.lastName });
    const response = await api.post<ClientResponse>(CLIENT_ENDPOINTS.BASE, data);
    logger.info(`Cliente creado: ${response.data.client.id}`);
    return response.data.client;
  } catch (error) {
    logger.apiError('POST /clients', error);
    throw error;
  }
};

/**
 * Actualizar cliente existente
 */
export const updateClient = async (id: string, data: UpdateClientData): Promise<Client> => {
  try {
    logger.debug(`Actualizando cliente: ${id}`, { data });
    const response = await api.put<ClientResponse>(CLIENT_ENDPOINTS.BY_VALUE(id), data);
    logger.info(`Cliente actualizado: ${response.data.client.id}`);
    return normalizeClient(response.data.client);
  } catch (error) {
    logger.apiError(`PUT /clients/${id}`, error);
    throw error;
  }
};

/**
 * Añadir dato individual a un array del cliente
 * Usa el endpoint /push del backend CRM
 */
export const pushClientData = async (
  id: string,
  data: PushClientDataRequest
): Promise<Client> => {
  try {
    logger.debug(`Añadiendo datos al cliente: ${id}`, { data });
    const response = await api.post<ClientResponse>(CLIENT_ENDPOINTS.PUSH(id), data);
    logger.info(`Datos añadidos al cliente: ${id}`, { field: data.field });
    return normalizeClient(response.data.client);
  } catch (error) {
    logger.apiError(`POST /clients/${id}/push`, error);
    throw error;
  }
};

// Export por defecto con todas las funciones
export const clientService = {
  searchClient,
  getClientById,
  createClient,
  updateClient,
  pushClientData,
};

export default clientService;
