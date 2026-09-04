import { config } from '../config';
import type { ISignatureSmsSender } from './ISignatureSmsSender';
import { LleidaSignatureSmsSender } from './lleida/LleidaSignatureSmsSender';
import { MockSignatureSmsSender } from './mock/MockSignatureSmsSender';

let instance: ISignatureSmsSender | null = null;

export function getProvider(): ISignatureSmsSender {
  if (!instance) {
    instance = config.useMock
      ? new MockSignatureSmsSender()
      : new LleidaSignatureSmsSender();
    console.log(`[sms-connector] Proveedor: ${config.useMock ? 'MOCK' : 'Lleida'}`);
  }
  return instance;
}
