import { randomUUID } from 'crypto';
import axios from 'axios';
import { prisma } from '@infrastructure/prisma/prismaClient';
import { config } from '@infrastructure/../config';
import type { ICallRepository } from '@domain/repositories/ICallRepository';
import type { IAgendaRepository } from '@domain/repositories/IAgendaRepository';
import type { Call } from '@domain/entities/Call';

export interface InitiateCallInput {
  agentId:       string;
  clientPhone:   string;
  clientId?:     string;
  saleId?:       string;
  agendaEntryId?: string;
  record?:       boolean;
}

export class InitiateCallUseCase {
  constructor(
    private calls: ICallRepository,
    private agenda: IAgendaRepository,
  ) {}

  async execute(input: InitiateCallInput): Promise<Call> {
    // DNC check
    const dncEntry = await (prisma as any).dncEntry.findUnique({ where: { phone: input.clientPhone } });
    if (dncEntry) {
      const expired = dncEntry.expiresAt && new Date(dncEntry.expiresAt) < new Date();
      if (!expired) throw new Error('DNC_BLOCKED');
    }

    const callId = randomUUID();

    const call = await this.calls.create({
      id:           callId,
      agentId:      input.agentId,
      clientPhone:  input.clientPhone,
      clientId:     input.clientId,
      saleId:       input.saleId,
      agendaEntryId: input.agendaEntryId,
    });

    const callbackUrl = `${config.crmBackendUrl.replace('localhost', '127.0.0.1')
      .replace('3001', '3003')}/api/calls/webhook`;

    const body = {
      callId,
      agentId:      input.agentId,
      clientPhone:  input.clientPhone,
      clientId:     input.clientId,
      saleId:       input.saleId,
      callbackUrl:  `http://localhost:${process.env.PORT ?? 3003}/api/calls/webhook`,
      record:       input.record ?? false,
    };

    try {
      const resp = await axios.post(`${config.connectorUrl}/connect/call`, body, {
        headers: { 'x-internal-api-key': config.internalApiKey },
        timeout: 10_000,
      });
      const { providerCallId } = resp.data as { providerCallId: string };
      await this.calls.update(callId, { providerCallId });
    } catch {
      await this.calls.update(callId, { status: 'failed' });
      throw new Error('Connector unreachable — call marked as failed');
    }

    if (input.agendaEntryId) {
      await this.agenda.update(input.agendaEntryId, { status: 'called' });
    }

    await this.calls.setAgentActiveCall(input.agentId, callId);

    return this.calls.findById(callId) as Promise<Call>;
  }
}
