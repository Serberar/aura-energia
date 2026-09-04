import api from '@/api/axios';
import { SETTINGS_ENDPOINTS } from './api';
import { logger } from '@/utils/logger';

export interface SystemSetting {
  key: string;
  value: boolean;
}

export const getSetting = async (key: string): Promise<SystemSetting> => {
  try {
    const response = await api.get<SystemSetting>(SETTINGS_ENDPOINTS.BY_KEY(key));
    return response.data;
  } catch (error) {
    logger.apiError(`GET /settings/${key}`, error);
    throw error;
  }
};

export const setSetting = async (key: string, value: boolean): Promise<SystemSetting> => {
  try {
    const response = await api.patch<SystemSetting>(SETTINGS_ENDPOINTS.BY_KEY(key), { value });
    logger.info(`Configuración '${key}' actualizada a ${value}`);
    return response.data;
  } catch (error) {
    logger.apiError(`PATCH /settings/${key}`, error);
    throw error;
  }
};
