import { prisma } from '@infrastructure/prisma/prismaClient';

interface RegisterCallEventInput {
  callId?: string;
  status?: string;
  saleId?: string;
  agentId?: string;
  duration?: number;
  recordingUrl?: string;
}

export class RegisterCallEventUseCase {
  async execute(input: RegisterCallEventInput): Promise<void> {
    const { saleId, callId, status, agentId, duration, recordingUrl } = input;
    if (!saleId) return;

    await prisma.saleHistory.create({
      data: {
        saleId,
        action: 'call_event',
        payload: { callId, status, agentId, duration, recordingUrl },
      },
    });
  }
}
