/**
 * Servicio de productos - Llamadas API tipadas
 */

import api from '@/api/crmApi';
import type {
  Product,
  CreateProductData,
  UpdateProductData,
  ProductResponse,
} from '@/types/sales';
import { PRODUCT_ENDPOINTS } from './api';
import { logger } from '@/utils/logger';

/**
 * Obtener todos los productos
 */
export const getAllProducts = async (): Promise<Product[]> => {
  try {
    logger.debug('Obteniendo todos los productos');
    const response = await api.get<Product[]>(PRODUCT_ENDPOINTS.BASE);
    logger.info(`Productos obtenidos: ${response.data.length}`);
    return response.data;
  } catch (error) {
    logger.apiError('GET /products', error);
    throw error;
  }
};

/**
 * Obtener un producto por ID
 */
export const getProductById = async (id: string): Promise<Product> => {
  try {
    logger.debug(`Obteniendo producto con ID: ${id}`);
    const response = await api.get<Product>(PRODUCT_ENDPOINTS.BY_ID(id));
    logger.info(`Producto obtenido: ${response.data.name}`);
    return response.data;
  } catch (error) {
    logger.apiError(`GET /products/${id}`, error);
    throw error;
  }
};

/**
 * Crear un nuevo producto
 */
export const createProduct = async (data: CreateProductData): Promise<Product> => {
  try {
    logger.debug('Creando nuevo producto', { name: data.name });
    const response = await api.post<ProductResponse>(PRODUCT_ENDPOINTS.BASE, data);
    logger.info(`Producto creado: ${response.data.product.name}`, {
      id: response.data.product.id,
    });
    return response.data.product;
  } catch (error) {
    logger.apiError('POST /products', error);
    throw error;
  }
};

/**
 * Actualizar un producto existente
 */
export const updateProduct = async (
  id: string,
  data: UpdateProductData
): Promise<Product> => {
  try {
    logger.debug(`Actualizando producto: ${id}`, { data });
    const response = await api.put<ProductResponse>(PRODUCT_ENDPOINTS.BY_ID(id), data);
    logger.info(`Producto actualizado: ${response.data.product.name}`);
    return response.data.product;
  } catch (error) {
    logger.apiError(`PUT /products/${id}`, error);
    throw error;
  }
};

/**
 * Activar/Desactivar un producto
 */
export const toggleProductActive = async (id: string): Promise<Product> => {
  try {
    logger.debug(`Toggle activo para producto: ${id}`);
    const response = await api.patch<ProductResponse>(PRODUCT_ENDPOINTS.TOGGLE(id));
    logger.info(
      `Producto ${response.data.product.active ? 'activado' : 'desactivado'}: ${response.data.product.name}`
    );
    return response.data.product;
  } catch (error) {
    logger.apiError(`PATCH /products/${id}/toggle`, error);
    throw error;
  }
};
