import axios from 'axios';
import { config } from '@infrastructure/../config';
import type { ICallRepository } from '@domain/repositories/ICallRepository';
import type { WebSocketServer } from '@infrastructure/websocket/WebSocketServer';

export class HangUpCallUseCase {
  constructor(
    private calls: ICallRepository,
    private wss: WebSocketServer,
  ) {}

  async execute(callId: string): Promise<void> {
    const call = await this.calls.findById(callId);
    if (!call) return;

    // Solo llamar al proveedor si hay una llamada real en curso
    if (call.providerCallId) {
      await axios.post(
        `${config.connectorUrl}/connect/hangup/${call.providerCallId}`,
        {},
        { headers: { 'x-internal-api-key': config.internalApiKey }, timeout: 5_000 },
      ).catch(() => { /* proveedor ya cerró la llamada */ });
    }

    const updated = await this.calls.update(callId, {
      status:  'completed',
      endedAt: new Date(),
      disposition: 'hung-up',
    });

    this.wss.sendToAgent(call.agentId, { type: 'call:completed', call: updated });
  }
}
