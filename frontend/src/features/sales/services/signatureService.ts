/* src/features/sales/services/signatureService.ts */

import api from '@/api/crmApi';
import type { SignatureRequest, SignatureRequestResponse } from '@/types/sales';
import { SALE_ENDPOINTS } from './api';
import { logger } from '@/utils/logger';

/** Enviar contrato al firmante (genera PDF y crea solicitud) */
export const sendContract = async (
  saleId: string,
  signerEmail: string,
  templateId?: string,
  deliveryMethod?: 'email' | 'sms',
  signerPhone?: string
): Promise<SignatureRequest> => {
  try {
    const contact = deliveryMethod === 'sms' ? signerPhone : signerEmail;
    logger.debug(`Enviando contrato para venta ${saleId} a ${contact} (${deliveryMethod ?? 'email'})`);
    const response = await api.post<SignatureRequestResponse>(
      SALE_ENDPOINTS.SIGNATURE_SEND(saleId),
      {
        signerEmail,
        ...(signerPhone ? { signerPhone } : {}),
        ...(deliveryMethod ? { deliveryMethod } : {}),
        ...(templateId ? { templateId } : {}),
      }
    );
    logger.info(`Contrato enviado para venta ${saleId}`);
    return response.data.signatureRequest;
  } catch (error) {
    logger.apiError(`POST /sales/${saleId}/signature/send`, error);
    throw error;
  }
};

/** Reenviar contrato (regenera PDF y reenvía) */
export const resendContract = async (
  saleId: string,
  signerEmail?: string
): Promise<SignatureRequest> => {
  try {
    logger.debug(`Reenviando contrato para venta ${saleId}`);
    const response = await api.post<SignatureRequestResponse>(
      SALE_ENDPOINTS.SIGNATURE_RESEND(saleId),
      signerEmail ? { signerEmail } : {}
    );
    logger.info(`Contrato reenviado para venta ${saleId}`);
    return response.data.signatureRequest;
  } catch (error) {
    logger.apiError(`POST /sales/${saleId}/signature/resend`, error);
    throw error;
  }
};

/** Obtener estado de firma de una venta */
export const getSignatureStatus = async (saleId: string): Promise<SignatureRequest | null> => {
  try {
    logger.debug(`Consultando estado de firma para venta ${saleId}`);
    const response = await api.get<SignatureRequest | null>(SALE_ENDPOINTS.SIGNATURE(saleId));
    return response.data;
  } catch (error) {
    logger.apiError(`GET /sales/${saleId}/signature`, error);
    throw error;
  }
};

/** Cancelar solicitud de firma */
export const cancelSignature = async (saleId: string): Promise<void> => {
  try {
    logger.debug(`Cancelando solicitud de firma para venta ${saleId}`);
    await api.delete(SALE_ENDPOINTS.SIGNATURE(saleId));
    logger.info(`Solicitud de firma cancelada para venta ${saleId}`);
  } catch (error) {
    logger.apiError(`DELETE /sales/${saleId}/signature`, error);
    throw error;
  }
};

/** Descargar el PDF de evidencia de firma y disparar descarga en el navegador */
export const downloadEvidence = async (saleId: string): Promise<void> => {
  try {
    logger.debug(`Descargando evidencia de firma para venta ${saleId}`);
    const response = await api.get(SALE_ENDPOINTS.SIGNATURE_EVIDENCE(saleId), {
      responseType: 'blob',
    });
    const url = URL.createObjectURL(new Blob([response.data as BlobPart], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `evidencia_firma_${saleId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    logger.info(`Evidencia descargada para venta ${saleId}`);
  } catch (error) {
    logger.apiError(`GET /sales/${saleId}/signature/evidence`, error);
    throw error;
  }
};

/** Descargar evidencia desde Lleida.net manualmente y almacenarla en el servidor */
export const fetchEvidenceFromProvider = async (saleId: string): Promise<void> => {
  try {
    logger.debug(`Descargando evidencia desde Lleida.net para venta ${saleId}`);
    await api.post(SALE_ENDPOINTS.SIGNATURE_EVIDENCE_FETCH(saleId));
    logger.info(`Evidencia descargada desde Lleida.net para venta ${saleId}`);
  } catch (error) {
    logger.apiError(`POST /sales/${saleId}/signature/evidence/fetch`, error);
    throw error;
  }
};

/** [DEMO] Simular que el cliente ha firmado el contrato */
export const simulateSign = async (providerDocumentId: string): Promise<void> => {
  try {
    logger.debug(`[DEMO] Simulando firma del documento ${providerDocumentId}`);
    await api.post('/signature/webhook', {
      providerDocumentId,
      event: 'signed',
      signedUrl: 'https://demo.example.com/signed-document.pdf',
    });
    logger.info(`[DEMO] Firma simulada para documento ${providerDocumentId}`);
  } catch (error) {
    logger.apiError('POST /signature/webhook (demo)', error);
    throw error;
  }
};
