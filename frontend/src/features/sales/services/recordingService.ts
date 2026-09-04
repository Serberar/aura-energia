/* src/features/sales/services/recordingService.ts */

import api from '@/api/crmApi';
import type { Recording, UploadRecordingResponse, DeleteRecordingResponse } from '@/types/sales';
import { logger } from '@/utils/logger';

/**
 * Endpoints de API para grabaciones
 */
const RECORDING_ENDPOINTS = {
  LIST: (saleId: string) => `/sales/${saleId}/recordings`,
  UPLOAD: (saleId: string) => `/sales/${saleId}/recordings`,
  DOWNLOAD: (saleId: string, recordingId: string) =>
    `/sales/${saleId}/recordings/${recordingId}`,
  DELETE: (saleId: string, recordingId: string) =>
    `/sales/${saleId}/recordings/${recordingId}`,
} as const;

/**
 * Listar grabaciones de una venta
 */
export const listRecordings = async (saleId: string): Promise<Recording[]> => {
  try {
    logger.debug(`Obteniendo grabaciones de venta ${saleId}`);

    const response = await api.get<Recording[]>(RECORDING_ENDPOINTS.LIST(saleId));

    logger.info(`Grabaciones obtenidas: ${response.data.length}`, { saleId });

    return response.data;
  } catch (error) {
    logger.apiError(`GET /sales/${saleId}/recordings`, error);
    throw error;
  }
};

/**
 * Subir grabación a una venta
 */
export const uploadRecording = async (
  saleId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<Recording> => {
  try {
    logger.debug(`Subiendo grabación a venta ${saleId}`, {
      filename: file.name,
      size: file.size,
      type: file.type,
    });

    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<UploadRecordingResponse>(
      RECORDING_ENDPOINTS.UPLOAD(saleId),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      }
    );

    logger.info(`Grabación subida: ${response.data.recording.id}`, {
      saleId,
      filename: file.name,
    });

    return response.data.recording;
  } catch (error) {
    logger.apiError(`POST /sales/${saleId}/recordings`, error);
    throw error;
  }
};

/**
 * Descargar grabación
 */
export const downloadRecording = async (
  saleId: string,
  recordingId: string,
  filename: string
): Promise<void> => {
  try {
    logger.debug(`Descargando grabación ${recordingId}`, { saleId, filename });

    const response = await api.get(RECORDING_ENDPOINTS.DOWNLOAD(saleId, recordingId), {
      responseType: 'blob',
    });

    // Crear enlace de descarga
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    logger.info(`Grabación descargada: ${filename}`, { saleId, recordingId });
  } catch (error) {
    logger.apiError(`GET /sales/${saleId}/recordings/${recordingId}`, error);
    throw error;
  }
};

/**
 * Eliminar grabación
 */
export const deleteRecording = async (saleId: string, recordingId: string): Promise<void> => {
  try {
    logger.debug(`Eliminando grabación ${recordingId}`, { saleId });

    await api.delete<DeleteRecordingResponse>(RECORDING_ENDPOINTS.DELETE(saleId, recordingId));

    logger.info(`Grabación eliminada: ${recordingId}`, { saleId });
  } catch (error) {
    logger.apiError(`DELETE /sales/${saleId}/recordings/${recordingId}`, error);
    throw error;
  }
};

/**
 * Verificar si es audio
 */
export const isAudio = (mimeType: string): boolean => mimeType.startsWith('audio/');

/**
 * Verificar si es video
 */
export const isVideo = (mimeType: string): boolean => mimeType.startsWith('video/');
