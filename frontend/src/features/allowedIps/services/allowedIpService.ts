import api from '@/api/axios';
import { ALLOWED_IP_ENDPOINTS } from './api';
import { logger } from '@/utils/logger';

export interface AllowedIp {
  id: string;
  ip: string;
  description: string | null;
  createdAt: string;
}

export interface CreateAllowedIpData {
  ip: string;
  description?: string | null;
}

interface CreateAllowedIpResponse {
  message: string;
  allowedIp: AllowedIp;
}

export const getAllAllowedIps = async (): Promise<AllowedIp[]> => {
  try {
    logger.debug('Obteniendo IPs permitidas');
    const response = await api.get<AllowedIp[]>(ALLOWED_IP_ENDPOINTS.BASE);
    logger.info(`IPs permitidas obtenidas: ${response.data.length}`);
    return response.data;
  } catch (error) {
    logger.apiError('GET /allowed-ips', error);
    throw error;
  }
};

export const createAllowedIp = async (data: CreateAllowedIpData): Promise<AllowedIp> => {
  try {
    logger.debug('Creando IP permitida', { ip: data.ip });
    const response = await api.post<CreateAllowedIpResponse>(ALLOWED_IP_ENDPOINTS.BASE, data);
    logger.info(`IP permitida creada: ${response.data.allowedIp.ip}`);
    return response.data.allowedIp;
  } catch (error) {
    logger.apiError('POST /allowed-ips', error);
    throw error;
  }
};

export const deleteAllowedIp = async (id: string): Promise<void> => {
  try {
    logger.debug(`Eliminando IP permitida: ${id}`);
    await api.delete(ALLOWED_IP_ENDPOINTS.BY_ID(id));
    logger.info(`IP permitida eliminada: ${id}`);
  } catch (error) {
    logger.apiError(`DELETE /allowed-ips/${id}`, error);
    throw error;
  }
};

export interface IpFilterMode {
  filteringEnabled: boolean;
  allowAll: boolean;
}

export const getIpFilterMode = async (): Promise<IpFilterMode> => {
  try {
    const response = await api.get<IpFilterMode>(ALLOWED_IP_ENDPOINTS.FILTER_MODE);
    return response.data;
  } catch (error) {
    logger.apiError('GET /allowed-ips/filter-mode', error);
    throw error;
  }
};

export const setIpFilterMode = async (patch: Partial<IpFilterMode>): Promise<void> => {
  try {
    await api.put(ALLOWED_IP_ENDPOINTS.FILTER_MODE, patch);
  } catch (error) {
    logger.apiError('PUT /allowed-ips/filter-mode', error);
    throw error;
  }
};

export interface MyIpInfo {
  ip: string | null;
  isWhitelisted: boolean;
  isPrivate: boolean;
  alwaysAllowed: boolean;
}

export const getMyIp = async (): Promise<MyIpInfo> => {
  try {
    const response = await api.get<MyIpInfo>(ALLOWED_IP_ENDPOINTS.MY_IP);
    return response.data;
  } catch (error) {
    logger.apiError('GET /allowed-ips/my-ip', error);
    throw error;
  }
};
