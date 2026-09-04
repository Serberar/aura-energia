import axios from 'axios';
import {
  ISignatureProvider,
  SignatureMetadata,
  SendDocumentResult,
  DocumentStatusResult,
} from '@domain/services/ISignatureProvider';
import logger from '@infrastructure/observability/logger/logger';

const LLEIDA_BASE_URL = 'https://api.lleida.net/cs/v1';

const SIGNED_STATUSES   = new Set(['signed', 'end_ok', 'evidence_generated']);
const REJECTED_STATUSES = new Set(['declined', 'end_ko', 'cancelled', 'expired', 'failed', 'max_otp', 'max_access']);

export class LleidaSignatureProvider implements ISignatureProvider {
  private readonly apiKey:           string;
  private readonly user:             string;
  private readonly configId:         number;
  private readonly configIdSms:      number;
  private readonly smsConnectorUrl:  string;
  private readonly internalApiKey:   string;

  constructor(
    apiKey:          string,
    user:            string,
    configId:        number,
    configIdSms?:    number,
    smsConnectorUrl? : string,
    internalApiKey?:  string,
  ) {
    this.apiKey          = apiKey;
    this.user            = user;
    this.configId        = configId;
    this.configIdSms     = configIdSms ?? configId;
    this.smsConnectorUrl = smsConnectorUrl ?? 'http://localhost:3005';
    this.internalApiKey  = internalApiKey  ?? '';
  }

  private get headers() {
    return {
      Authorization:  `x-api-key ${this.apiKey}`,
      'Content-Type': 'application/json; charset=utf-8',
      Accept:         'application/json',
    };
  }

  async sendDocument(
    pdf:         Buffer,
    signerEmail: string,
    metadata:    SignatureMetadata,
  ): Promise<SendDocumentResult> {
    const isSms = metadata.deliveryMethod === 'sms';

    if (isSms) {
      return this.sendViaSmsConnector(pdf, signerEmail, metadata);
    }

    return this.sendViaEmail(pdf, signerEmail, metadata);
  }

  // ── Entrega por email: llama a Lleida directamente ──────────────────────
  private async sendViaEmail(
    pdf:         Buffer,
    signerEmail: string,
    metadata:    SignatureMetadata,
  ): Promise<SendDocumentResult> {
    const base64Pdf = pdf.toString('base64');
    const nameParts = (metadata.clientName || '').trim().split(' ');
    const name      = nameParts[0] ?? '';
    const surname   = nameParts.slice(1).join(' ') || '';

    const body = {
      request:    'START_SIGNATURE',
      request_id: metadata.saleId,
      user:       this.user,
      signature: {
        config_id:   this.configId,
        contract_id: metadata.saleId,
        level: [
          {
            level_order: 0,
            signatories: [{ name, surname, email: signerEmail }],
          },
        ],
        file: [
          {
            filename:   'contrato.pdf',
            content:    base64Pdf,
            file_group: 'contract_files',
          },
        ],
      },
    };

    logger.info('[Lleida] Iniciando firma por email', { saleId: metadata.saleId, signerEmail });

    let response;
    try {
      response = await axios.post(`${LLEIDA_BASE_URL}/start_signature`, body, {
        headers: this.headers,
      });
    } catch (err: any) {
      const lleidaError = err?.response?.data;
      logger.error('[Lleida] Error en start_signature (email)', { status: err?.response?.status, data: lleidaError, saleId: metadata.saleId });
      throw new Error(`Lleida.net rechazó la solicitud: ${JSON.stringify(lleidaError ?? err?.message)}`);
    }

    const resData = response.data as any;
    const signatureId = resData?.signature?.signature_id;
    if (!signatureId) {
      throw new Error(`Lleida.net no devolvió signature_id (email). Código: ${resData?.code}`);
    }

    logger.info('[Lleida] Firma por email iniciada', { saleId: metadata.saleId, signatureId });
    return { documentId: String(signatureId) };
  }

  // ── Entrega por SMS: delega en sms-connector ────────────────────────────
  private async sendViaSmsConnector(
    pdf:         Buffer,
    signerEmail: string,
    metadata:    SignatureMetadata,
  ): Promise<SendDocumentResult> {
    if (!metadata.signerPhone) {
      throw new Error('Se requiere signerPhone para entrega vía SMS');
    }

    logger.info('[Lleida] Delegando firma SMS al sms-connector', {
      saleId:      metadata.saleId,
      signerPhone: metadata.signerPhone,
    });

    try {
      const { data } = await axios.post(
        `${this.smsConnectorUrl}/sms/signature/send`,
        {
          pdf:         pdf.toString('base64'),
          signerEmail,
          clientName:  metadata.clientName ?? '',
          signerPhone: metadata.signerPhone,
          saleId:      metadata.saleId,
          contractId:  metadata.saleId,
          user:        this.user,
          configId:    this.configIdSms,
        },
        {
          headers: { 'x-internal-api-key': this.internalApiKey },
        },
      );

      const signatureId: string = (data as any).signatureId;
      logger.info('[Lleida] Firma SMS iniciada vía sms-connector', { saleId: metadata.saleId, signatureId });
      return { documentId: signatureId };
    } catch (err: any) {
      const detail = err?.response?.data ?? err?.message;
      logger.error('[Lleida] Error al delegar firma SMS al sms-connector', { saleId: metadata.saleId, detail });
      throw new Error(`sms-connector rechazó la solicitud: ${JSON.stringify(detail)}`);
    }
  }

  async getDocumentStatus(documentId: string): Promise<DocumentStatusResult> {
    const body = {
      request:      'GET_SIGNATURE_STATUS',
      request_id:   documentId,
      user:         this.user,
      signature_id: documentId,
    };

    const response = await axios.post(`${LLEIDA_BASE_URL}/get_signature_status`, body, {
      headers: this.headers,
    });

    const signatureStatus: string = (response.data as any)?.signature_status || '';
    logger.debug('[Lleida] Estado de firma consultado', { documentId, signatureStatus });

    if (SIGNED_STATUSES.has(signatureStatus))   return { status: 'signed' };
    if (REJECTED_STATUSES.has(signatureStatus)) return { status: 'rejected' };
    return { status: 'pending' };
  }

  async cancelDocument(documentId: string): Promise<void> {
    const body = {
      request:      'CANCEL_SIGNATURE',
      request_id:   documentId,
      user:         this.user,
      signature_id: documentId,
    };

    await axios.post(`${LLEIDA_BASE_URL}/cancel_signature`, body, { headers: this.headers });
    logger.info('[Lleida] Proceso de firma cancelado', { documentId });
  }

  async downloadEvidence(signatureId: string): Promise<Buffer | null> {
    const body = {
      request:      'GET_DOCUMENT',
      request_id:   signatureId,
      user:         this.user,
      signature_id: signatureId,
      file_group:   'SIGNATORY_EVIDENCE',
    };

    try {
      const response = await axios.post(`${LLEIDA_BASE_URL}/get_document`, body, { headers: this.headers });
      const files = (response.data as any)?.document?.file;

      if (!files || files.length === 0) {
        logger.debug('[Lleida] Sin archivos de evidencia disponibles', { signatureId });
        return null;
      }

      const content: string | undefined = files[0]?.content;
      if (!content) {
        logger.debug('[Lleida] Archivo de evidencia sin contenido base64', { signatureId });
        return null;
      }

      logger.info('[Lleida] Evidencia descargada correctamente', { signatureId });
      return Buffer.from(content, 'base64');
    } catch (error) {
      logger.error('[Lleida] Error descargando evidencia', error as Error, { signatureId });
      return null;
    }
  }

  static mapStatus(lleidaStatus: string): 'signed' | 'rejected' | null {
    if (SIGNED_STATUSES.has(lleidaStatus))   return 'signed';
    if (REJECTED_STATUSES.has(lleidaStatus)) return 'rejected';
    return null;
  }

  static normalizePhone(phone: string): string {
    const trimmed = phone.trim();
    const hasPlus = trimmed.startsWith('+');
    const digits  = trimmed.replace(/\D/g, '');
    if (hasPlus)                   return `+${digits}`;
    if (digits.startsWith('34'))   return `+${digits}`;
    return `+34${digits}`;
  }
}
