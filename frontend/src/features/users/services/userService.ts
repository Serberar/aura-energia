/**
 * Servicio de usuarios - Llamadas API tipadas
 */

import api from '@/api/axios';
import type { UserRole } from '@/types';
import { USER_ENDPOINTS } from './api';
import { logger } from '@/utils/logger';

// Tipos para el módulo de usuarios
export interface UserData {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  active: boolean;
  failedLoginAttempts: number;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface CreateUserData {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  role: UserRole;
}

export interface UserResponse {
  user: UserData;
  message: string;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  username?: string;
  password?: string;
  role?: UserRole;
  active?: boolean;
}

/**
 * Obtener todos los usuarios
 */
export const getAllUsers = async (): Promise<UserData[]> => {
  try {
    logger.debug('Obteniendo todos los usuarios');
    const response = await api.get<UserData[]>(USER_ENDPOINTS.BASE);
    logger.info(`Usuarios obtenidos: ${response.data.length}`);
    return response.data;
  } catch (error) {
    logger.apiError('GET /users', error);
    throw error;
  }
};

/**
 * Crear un nuevo usuario
 */
export const createUser = async (data: CreateUserData): Promise<UserData> => {
  try {
    logger.debug('Creando nuevo usuario', { username: data.username });
    const response = await api.post<UserResponse>(USER_ENDPOINTS.REGISTER, data);
    logger.info(`Usuario creado: ${response.data.user.username}`, {
      id: response.data.user.id,
    });
    return response.data.user;
  } catch (error) {
    logger.apiError('POST /users/register', error);
    throw error;
  }
};

/**
 * Eliminar un usuario
 */
export const deleteUser = async (userId: string): Promise<void> => {
  try {
    logger.debug(`Eliminando usuario: ${userId}`);
    await api.delete(USER_ENDPOINTS.BY_ID(userId));
    logger.info(`Usuario eliminado: ${userId}`);
  } catch (error) {
    logger.apiError(`DELETE /users/${userId}`, error);
    throw error;
  }
};

/**
 * Actualizar un usuario
 */
export const updateUser = async (userId: string, data: UpdateUserData): Promise<UserData> => {
  try {
    logger.debug(`Actualizando usuario: ${userId}`, { fields: Object.keys(data) });
    const response = await api.put<UserResponse>(USER_ENDPOINTS.BY_ID(userId), data);
    logger.info(`Usuario actualizado: ${userId}`);
    return response.data.user;
  } catch (error) {
    logger.apiError(`PUT /users/${userId}`, error);
    throw error;
  }
};
