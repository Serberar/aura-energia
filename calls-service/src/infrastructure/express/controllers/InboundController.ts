import type { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { prisma } from '@infrastructure/prisma/prismaClient';
import type { WebSocketServer } from '@infrastructure/websocket/WebSocketServer';

export class InboundController {
  constructor(private wss: WebSocketServer) {}

  // Webhook from provider for inbound call
  handleInbound = async (req: Request, res: Response): Promise<void> => {
    const { from, to, providerCallId } = req.body as {
      from: string;
      to: string;
      providerCallId?: string;
    };

    if (!from || !to) {
      res.status(400).json({ error: 'from y to son requeridos' });
      return;
    }

    // Find an available agent (round-robin by last updatedAt)
    const session = await prisma.agentSession.findFirst({
      where:   { status: 'available' },
      orderBy: { updatedAt: 'asc' },
    });

    const callId = randomUUID();

    // Create call record
    await (prisma.call.create as any)({
      data: {
        id:            callId,
        agentId:       session?.agentId ?? 'queue',
        clientPhone:   from,
        startedAt:     new Date(),
        direction:     'inbound',
        status:        session ? 'ringing' : 'initiated',
        providerCallId,
      },
    });

    if (session) {
      // Notify the agent
      this.wss.sendToAgent(session.agentId, {
        type:      'call:incoming',
        callId,
        from,
        to,
        agentId:   session.agentId,
      });
      res.json({ callId, assigned: true, agentId: session.agentId });
    } else {
      // No agent available — queue the call
      const queueCount = await prisma.callQueue.count({
        where: { answeredAt: null },
      });
      await prisma.callQueue.create({
        data: { callId, fromPhone: from, toPhone: to, position: queueCount + 1 },
      });

      this.wss.broadcast({ type: 'queue:call-added', callId, from, position: queueCount + 1 });
      res.json({ callId, queued: true, position: queueCount + 1 });
    }
  };

  // Agent answers an incoming call
  answerCall = async (req: Request, res: Response): Promise<void> => {
    const { callId } = req.params;
    const agentId = (req as any).user?.id ?? (req as any).agentId;

    await (prisma.call.update as any)({
      where: { id: callId },
      data:  { status: 'answered', answeredAt: new Date(), agentId },
    });
    await (prisma.agentSession.upsert as any)({
      where:  { agentId },
      update: { status: 'busy', activeCallId: callId },
      create: { agentId, status: 'busy', activeCallId: callId },
    });

    // Remove from queue if present
    await prisma.callQueue.deleteMany({ where: { callId: String(callId) } });

    this.wss.broadcast({ type: 'call:answered', callId, agentId });
    res.json({ callId, status: 'answered' });
  };

  // Get current queue
  getQueue = async (_req: Request, res: Response): Promise<void> => {
    const queue = await prisma.callQueue.findMany({
      where:   { answeredAt: null },
      orderBy: { position: 'asc' },
    });
    res.json(queue);
  };

  // Reject an incoming call
  rejectCall = async (req: Request, res: Response): Promise<void> => {
    const { callId } = req.params;
    await (prisma.call.update as any)({
      where: { id: callId },
      data:  { status: 'no_answer', endedAt: new Date() },
    });
    await prisma.callQueue.deleteMany({ where: { callId: String(callId) } });
    this.wss.broadcast({ type: 'call:rejected', callId });
    res.json({ callId, status: 'no_answer' });
  };
}
