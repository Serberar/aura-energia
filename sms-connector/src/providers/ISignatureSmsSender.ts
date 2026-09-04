import type { SignatureSmsSendDTO } from '../dtos/SignatureSmsSendDTO';

export interface ISignatureSmsSender {
  send(dto: SignatureSmsSendDTO): Promise<{ signatureId: string }>;
}
