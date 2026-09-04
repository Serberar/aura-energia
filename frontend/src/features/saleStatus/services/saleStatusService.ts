/**
 * Servicio de estados de venta - Llamadas API tipadas
 */

import api from '@/api/crmApi';
import type {
  SaleStatus,
  CreateSaleStatusData,
  UpdateSaleStatusData,
  SaleStatusResponse,
  ReorderStatusesRequest,
} from '@/types/sales';
import { SALE_STATUS_ENDPOINTS } from './api';
import { logger } from '@/utils/logger';

/**
 * Obtener todos los estados de venta
 * Los estados vienen ordenados por el campo 'order'
 */
export const getAllSaleStatuses = async (): Promise<SaleStatus[]> => {
  try {
    logger.debug('Obteniendo todos los estados de venta');
    const response = await api.get<SaleStatus[]>(SALE_STATUS_ENDPOINTS.BASE);
    logger.info(`Estados de venta obtenidos: ${response.data.length}`);
    return response.data;
  } catch (error) {
    logger.apiError('GET /sale-statuses', error);
    throw error;
  }
};

/**
 * Obtener un estado de venta por ID
 */
export const getSaleStatusById = async (id: string): Promise<SaleStatus> => {
  try {
    logger.debug(`Obteniendo estado de venta con ID: ${id}`);
    const response = await api.get<SaleStatus>(SALE_STATUS_ENDPOINTS.BY_ID(id));
    logger.info(`Estado de venta obtenido: ${response.data.name}`);
    return response.data;
  } catch (error) {
    logger.apiError(`GET /sale-statuses/${id}`, error);
    throw error;
  }
};

/**
 * Crear un nuevo estado de venta
 */
export const createSaleStatus = async (data: CreateSaleStatusData): Promise<SaleStatus> => {
  try {
    logger.debug('Creando nuevo estado de venta', { name: data.name });
    const response = await api.post<SaleStatusResponse>(SALE_STATUS_ENDPOINTS.BASE, data);
    logger.info(`Estado de venta creado: ${response.data.status.name}`, {
      id: response.data.status.id,
    });
    return response.data.status;
  } catch (error) {
    logger.apiError('POST /sale-statuses', error);
    throw error;
  }
};

/**
 * Actualizar un estado de venta existente
 */
export const updateSaleStatus = async (
  id: string,
  data: UpdateSaleStatusData
): Promise<SaleStatus> => {
  try {
    logger.debug(`Actualizando estado de venta: ${id}`, { data });
    const response = await api.put<SaleStatusResponse>(SALE_STATUS_ENDPOINTS.BY_ID(id), data);
    logger.info(`Estado de venta actualizado: ${response.data.status.name}`);
    return response.data.status;
  } catch (error) {
    logger.apiError(`PUT /sale-statuses/${id}`, error);
    throw error;
  }
};

/**
 * Eliminar un estado de venta
 */
export const deleteSaleStatus = async (id: string): Promise<void> => {
  try {
    logger.debug(`Eliminando estado de venta: ${id}`);
    await api.delete(SALE_STATUS_ENDPOINTS.BY_ID(id));
    logger.info(`Estado de venta eliminado: ${id}`);
  } catch (error) {
    logger.apiError(`DELETE /sale-statuses/${id}`, error);
    throw error;
  }
};

/**
 * Reordenar múltiples estados de venta
 * Envía un array con los IDs y sus nuevos valores de 'order'
 */
export const reorderSaleStatuses = async (data: ReorderStatusesRequest): Promise<SaleStatus[]> => {
  try {
    logger.debug('Reordenando estados de venta', { count: data.statuses.length });
    const response = await api.patch<SaleStatus[]>(SALE_STATUS_ENDPOINTS.REORDER, data);
    logger.info(`Estados de venta reordenados: ${response.data.length}`);
    return response.data;
  } catch (error) {
    logger.apiError('PATCH /sale-statuses/reorder', error);
    throw error;
  }
};
