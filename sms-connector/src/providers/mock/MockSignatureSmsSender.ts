import type { ISignatureSmsSender } from '../ISignatureSmsSender';
import type { SignatureSmsSendDTO } from '../../dtos/SignatureSmsSendDTO';

export class MockSignatureSmsSender implements ISignatureSmsSender {
  async send(dto: SignatureSmsSendDTO): Promise<{ signatureId: string }> {
    const signatureId = `mock-${dto.saleId}-${Date.now()}`;
    console.log(
      `[Mock] SMS de firma enviado: signatureId=${signatureId}, teléfono=${dto.signerPhone}`,
    );
    return { signatureId };
  }
}
