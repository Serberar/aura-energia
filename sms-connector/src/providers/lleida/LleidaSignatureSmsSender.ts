import axios from 'axios';
import type { ISignatureSmsSender } from '../ISignatureSmsSender';
import type { SignatureSmsSendDTO } from '../../dtos/SignatureSmsSendDTO';
import { config } from '../../config';

export class LleidaSignatureSmsSender implements ISignatureSmsSender {
  async send(dto: SignatureSmsSendDTO): Promise<{ signatureId: string }> {
    const nameParts = dto.clientName.trim().split(' ');
    const name    = nameParts[0] ?? '';
    const surname = nameParts.slice(1).join(' ') || '';
    const phone   = normalizePhone(dto.signerPhone);

    const body = {
      request:    'START_SIGNATURE',
      request_id: dto.saleId,
      user:       dto.user,
      signature: {
        config_id:   dto.configId,
        contract_id: dto.contractId,
        level: [
          {
            level_order: 0,
            signatories: [{ name, surname, phone, email: dto.signerEmail }],
          },
        ],
        file: [
          {
            filename:   'contrato.pdf',
            content:    dto.pdf,
            file_group: 'contract_files',
          },
        ],
      },
    };

    const response = await axios.post(`${config.lleidaBaseUrl}/start_signature`, body, {
      headers: {
        Authorization: `x-api-key ${config.lleidaApiKey}`,
        'Content-Type': 'application/json; charset=utf-8',
        Accept: 'application/json',
      },
    });

    const signatureId: string | undefined = response.data?.signature?.signature_id;
    if (!signatureId) {
      throw new Error(
        `Lleida no devolvió signature_id: ${JSON.stringify(response.data)}`,
      );
    }

    return { signatureId: String(signatureId) };
  }
}

function normalizePhone(phone: string): string {
  const trimmed = phone.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits  = trimmed.replace(/\D/g, '');
  if (hasPlus) return `+${digits}`;
  if (digits.startsWith('34')) return `+${digits}`;
  return `+34${digits}`;
}
