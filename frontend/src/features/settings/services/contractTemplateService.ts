import api from '@/api/crmApi';
import { logger } from '@/utils/logger';
import type { ContractConfig } from './contractConfigService';
import { migrateContractConfig } from './contractConfigService';

/** Una plantilla de contrato con identidad propia */
export interface ContractTemplate extends ContractConfig {
  id: string;
  nombre: string;
  esDefecto: boolean;
}

type RawTemplate = {
  id: string;
  nombre: string;
  esDefecto: boolean;
  logoPath?: string | null;
  logoUrl?: string | null;
  [key: string]: unknown;
};

function normalizeTemplate(raw: RawTemplate): ContractTemplate {
  const config = migrateContractConfig(raw as Parameters<typeof migrateContractConfig>[0]);
  return {
    ...config,
    id: raw.id,
    nombre: raw.nombre,
    esDefecto: raw.esDefecto,
    logoUrl: raw.logoUrl ?? null,
  };
}

export const listTemplates = async (): Promise<ContractTemplate[]> => {
  const response = await api.get<RawTemplate[]>('/contract-templates');
  return response.data.map(normalizeTemplate);
};

export const getTemplate = async (id: string): Promise<ContractTemplate> => {
  const response = await api.get<RawTemplate>(`/contract-templates/${id}`);
  return normalizeTemplate(response.data);
};

export const createTemplate = async (
  data: Pick<ContractTemplate, 'nombre'>
): Promise<ContractTemplate> => {
  try {
    const response = await api.post<RawTemplate>('/contract-templates', data);
    return normalizeTemplate(response.data);
  } catch (error) {
    logger.apiError('POST /contract-templates', error);
    throw error;
  }
};

export const saveTemplate = async (
  id: string,
  data: Partial<Omit<ContractTemplate, 'id' | 'logoPath' | 'logoUrl'>>
): Promise<ContractTemplate> => {
  try {
    const response = await api.patch<RawTemplate>(`/contract-templates/${id}`, data);
    return normalizeTemplate(response.data);
  } catch (error) {
    logger.apiError(`PATCH /contract-templates/${id}`, error);
    throw error;
  }
};

export const deleteTemplate = async (id: string): Promise<void> => {
  try {
    await api.delete(`/contract-templates/${id}`);
  } catch (error) {
    logger.apiError(`DELETE /contract-templates/${id}`, error);
    throw error;
  }
};

export const uploadTemplateLogo = async (
  id: string,
  file: File
): Promise<{ logoUrl: string }> => {
  const formData = new FormData();
  formData.append('logo', file);
  try {
    const response = await api.post<{ logoUrl: string }>(
      `/contract-templates/${id}/logo`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  } catch (error) {
    logger.apiError(`POST /contract-templates/${id}/logo`, error);
    throw error;
  }
};

export const deleteTemplateLogo = async (id: string): Promise<void> => {
  try {
    await api.delete(`/contract-templates/${id}/logo`);
  } catch (error) {
    logger.apiError(`DELETE /contract-templates/${id}/logo`, error);
    throw error;
  }
};

/**
 * Descarga el logo de la plantilla con auth y devuelve un blob URL.
 * El caller es responsable de llamar URL.revokeObjectURL cuando ya no lo necesite.
 */
export const fetchTemplateLogoObjectUrl = async (id: string): Promise<string> => {
  const response = await api.get(`/contract-templates/${id}/logo`, { responseType: 'blob' });
  return URL.createObjectURL(response.data as Blob);
};
