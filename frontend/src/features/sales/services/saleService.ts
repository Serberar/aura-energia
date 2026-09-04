/* src/features/sales/services/saleService.ts */

import api from '@/api/crmApi';
import type {
  Sale,
  CreateSaleData,
  SaleResponse,
  SaleFilters,
  ChangeSaleStatusRequest,
  CreateSaleItemData,
  UpdateSaleItemData,
  SalesStats,
} from '@/types/sales';
import { createClient } from '@/features/clientes/services/clientService';
import { SALE_ENDPOINTS } from './api';
import { logger } from '@/utils/logger';

/**
 * Construye el DTO EXACTO que el backend espera
 */
function buildBackendCreateDto(data: CreateSaleData) {
  return {
    client: {
      id: data.client.id,
      firstName: data.client.firstName,
      lastName: data.client.lastName,
      dni: data.client.dni,
      email: data.client.email,
      birthday: data.client.birthday,
      phones: data.client.phones,
      bankAccounts: data.client.bankAccounts ?? [],
      address: data.client.address,
    },
    items: data.items.map((it) => ({
      productId: it.productId ?? null,
      name: it.name,
      quantity: it.quantity,
      price: it.price,
    })),
    comercial: data.comercial,
  };
}

/** Obtener todas las ventas */
export const getAllSales = async (filters?: SaleFilters): Promise<Sale[]> => {
  try {
    logger.debug('Obteniendo ventas', { ...(filters || {}) });

    const params = new URLSearchParams();
    if (filters?.clientId) params.append('clientId', filters.clientId);
    if (filters?.statusId) params.append('statusId', filters.statusId);
    if (filters?.from) params.append('from', filters.from);
    if (filters?.to) params.append('to', filters.to);
    if (filters?.productId) params.append('productId', filters.productId);
    if (filters?.minTotal !== undefined) params.append('minTotal', String(filters.minTotal));
    if (filters?.maxTotal !== undefined) params.append('maxTotal', String(filters.maxTotal));
    if (filters?.comercial) params.append('comercial', filters.comercial);

    const url = params.toString()
      ? `${SALE_ENDPOINTS.BASE}?${params.toString()}`
      : SALE_ENDPOINTS.BASE;

    const response = await api.get<Sale[]>(url);

    logger.info(`Ventas obtenidas: ${response.data.length}`);
    return response.data;

  } catch (error) {
    logger.apiError('GET /sales', error);
    throw error;
  }
};

/** Obtener venta por ID */
export const getSaleById = async (id: string): Promise<Sale> => {
  try {
    logger.debug(`Obteniendo venta con ID: ${id}`);

    const response = await api.get<Sale>(SALE_ENDPOINTS.BY_ID(id));

    logger.info(`Venta obtenida: ${response.data.id}`, {
      items: response.data.items?.length ?? 0,
    });

    return response.data;

  } catch (error) {
    logger.apiError(`GET /sales/${id}`, error);
    throw error;
  }
};

/** Crear una nueva venta */
export const createSale = async (data: CreateSaleData): Promise<Sale> => {
  try {
    // Cliente manual (sin id): crearlo primero en el sistema para obtener un UUID válido
    if (!data.client.id) {
      logger.debug('Cliente manual detectado — creando en el sistema antes de la venta');
      const newClient = await createClient({
        firstName: data.client.firstName,
        lastName: data.client.lastName,
        dni: data.client.dni,
        email: data.client.email,
        phones: data.client.phones,
        bankAccounts: data.client.bankAccounts ?? [],
        addresses: [data.client.address],
      });
      data = { ...data, client: { ...data.client, id: newClient.id } };
      logger.info(`Cliente manual creado con id: ${newClient.id}`);
    }

    const backendDto = buildBackendCreateDto(data);

    logger.debug('Creando nueva venta (DTO backend)', backendDto);

    const response = await api.post<SaleResponse>(SALE_ENDPOINTS.BASE, backendDto);

    logger.info(`Venta creada: ${response.data.sale.id}`, {
      total: response.data.sale.totalAmount,
      items: response.data.sale.items.length,
    });

    return response.data.sale;

  } catch (error) {
    logger.apiError('POST /sales', error);
    throw error;
  }
};

/** Añadir item */
export const addSaleItem = async (
  saleId: string,
  itemData: CreateSaleItemData
): Promise<Sale> => {
  try {
    const payload = {
      productId: itemData.productId ?? null,
      name: itemData.name,
      quantity: Number(itemData.quantity),
      price: Number(itemData.price),
    };

    logger.debug(`Añadiendo item a venta ${saleId}`, payload);

    const response = await api.post<SaleResponse>(SALE_ENDPOINTS.ITEMS(saleId), payload);

    logger.info(`Item añadido a venta ${saleId}`, { itemName: itemData.name });

    return response.data.sale;

  } catch (error) {
    logger.apiError(`POST /sales/${saleId}/items`, error);
    throw error;
  }
};

/** Actualizar item */
export const updateSaleItem = async (
  saleId: string,
  itemId: string,
  itemData: UpdateSaleItemData
): Promise<Sale> => {
  try {
    logger.debug(`Actualizando item ${itemId} de venta ${saleId}`);

    const response = await api.put<SaleResponse>(
      SALE_ENDPOINTS.ITEM_BY_ID(saleId, itemId),
      itemData
    );

    logger.info(`Item ${itemId} actualizado en venta ${saleId}`);

    return response.data.sale;

  } catch (error) {
    logger.apiError(`PUT /sales/${saleId}/items/${itemId}`, error);
    throw error;
  }
};

/** Eliminar item */
export const removeSaleItem = async (saleId: string, itemId: string): Promise<Sale> => {
  try {
    logger.debug(`Eliminando item ${itemId} de venta ${saleId}`);

    const response = await api.delete<SaleResponse>(
      SALE_ENDPOINTS.ITEM_BY_ID(saleId, itemId)
    );

    logger.info(`Item ${itemId} eliminado de venta ${saleId}`);

    return response.data.sale;

  } catch (error) {
    logger.apiError(`DELETE /sales/${saleId}/${itemId}`, error);
    throw error;
  }
};

/** Cambiar estado */
export const changeSaleStatus = async (
  saleId: string,
  statusData: ChangeSaleStatusRequest
): Promise<Sale> => {
  try {
    logger.debug(`Cambiando estado de venta ${saleId}`);

    const response = await api.patch<SaleResponse>(
      SALE_ENDPOINTS.CHANGE_STATUS(saleId),
      statusData
    );

    logger.info(`Estado cambiado para venta ${saleId}`);

    return response.data.sale;

  } catch (error) {
    logger.apiError(`PATCH /sales/${saleId}/status`, error);
    throw error;
  }
};

/** Eliminar venta */
export const deleteSale = async (id: string): Promise<void> => {
  try {
    logger.debug(`Eliminando venta: ${id}`);

    await api.delete(SALE_ENDPOINTS.BY_ID(id));

    logger.info(`Venta eliminada: ${id}`);

  } catch (error) {
    logger.apiError(`DELETE /sales/${id}`, error);
    throw error;
  }
};

/** Actualizar datos del cliente en la venta */
export const updateSaleClient = async (saleId: string, clientSnapshot: any, comercial?: string): Promise<Sale> => {
  try {
    logger.debug(`Actualizando cliente de venta ${saleId}`);

    const response = await api.patch<{ sale: Sale }>(
      SALE_ENDPOINTS.UPDATE_CLIENT(saleId),
      { clientSnapshot, comercial }
    );

    logger.info(`Cliente de venta ${saleId} actualizado`);

    return response.data.sale;

  } catch (error) {
    logger.apiError(`PATCH /sales/${saleId}/client`, error);
    throw error;
  }
};

/** Obtener estadísticas de ventas (excluyendo canceladas) */
export const getSalesStats = async (): Promise<SalesStats> => {
  try {
    logger.debug('Obteniendo estadísticas de ventas');

    const response = await api.get<SalesStats>(SALE_ENDPOINTS.STATS);

    logger.info('Estadísticas de ventas obtenidas', { stats: response.data });

    return response.data;

  } catch (error) {
    logger.apiError('GET /sales/stats', error);
    throw error;
  }
};

/** Obtener lista de comerciales únicos para filtros */
export const getComerciales = async (): Promise<string[]> => {
  try {
    logger.debug('Obteniendo lista de comerciales');

    const response = await api.get<string[]>(SALE_ENDPOINTS.COMERCIALES);

    logger.info(`Comerciales obtenidos: ${response.data.length}`);

    return response.data;

  } catch (error) {
    logger.apiError('GET /sales/comerciales', error);
    throw error;
  }
};
