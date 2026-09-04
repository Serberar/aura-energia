import axios from 'axios';
import { config } from '@infrastructure/../config';
import type { ICallRepository } from '@domain/repositories/ICallRepository';
import type { Call, CallStatus } from '@domain/entities/Call';
import { isTerminal } from '@domain/entities/Call';
import type { WebSocketServer } from '@infrastructure/websocket/WebSocketServer';

export interface CallEventPayload {
  callId:         string;
  providerCallId: string;
  event:          string;
  timestamp:      string;
  duration?:      number;
  recordingUrl?:  string;
  disposition?:   string;
  providerRaw?:   unknown;
}

const EVENT_TO_STATUS: Record<string, CallStatus> = {
  initiated:  'initiated',
  ringing:    'ringing',
  answered:   'answered',
  completed:  'completed',
  'no-answer': 'no_answer',
  busy:       'busy',
  failed:     'failed',
};

export class HandleCallEventUseCase {
  constructor(
    private calls: ICallRepository,
    private wss: WebSocketServer,
  ) {}

  async execute(payload: CallEventPayload): Promise<void> {
    const call = await this.calls.findByProviderCallId(payload.providerCallId)
      ?? await this.calls.findById(payload.callId);

    if (!call) return;

    const newStatus = EVENT_TO_STATUS[payload.event];
    const update: Parameters<ICallRepository['update']>[1] = {};

    if (newStatus) update.status = newStatus;
    if (payload.duration)     update.duration    = payload.duration;
    if (payload.recordingUrl) update.recordingUrl = payload.recordingUrl;
    if (payload.disposition)  update.disposition  = payload.disposition;
    if (!call.providerCallId) update.providerCallId = payload.providerCallId;

    if (payload.event === 'answered') update.answeredAt = new Date(payload.timestamp);
    if (newStatus && isTerminal(newStatus)) update.endedAt = new Date(payload.timestamp);

    const updated = await this.calls.update(call.id, update);
    await this.calls.addEvent(call.id, payload.event, payload);

    // Emitir al agente por WebSocket
    this.wss.sendToAgent(call.agentId, {
      type:  `call:${payload.event}`,
      call:  updated,
      event: payload,
    });

    // Clear active call on agent session when terminal
    if (newStatus && isTerminal(newStatus)) {
      this.calls.setAgentActiveCall(call.agentId, null).catch(() => {});
      this.notifyCrm(updated).catch(() => { /* fire-and-forget */ });
    }
  }

  private async notifyCrm(call: Call): Promise<void> {
    await axios.post(
      `${config.crmBackendUrl}/api/calls/events`,
      {
        callId:      call.id,
        agentId:     call.agentId,
        clientId:    call.clientId,
        saleId:      call.saleId,
        status:      call.status,
        duration:    call.duration,
        disposition: call.disposition,
        recordingUrl: call.recordingUrl,
        startedAt:   call.startedAt,
        answeredAt:  call.answeredAt,
        endedAt:     call.endedAt,
      },
      {
        headers: { 'x-internal-api-key': config.internalApiKey },
        timeout: 5_000,
      },
    );
  }
}
