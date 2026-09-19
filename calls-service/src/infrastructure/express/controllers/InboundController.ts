import type { Request, Response } from 'express';
import { prisma } from '@infrastructure/prisma/prismaClient';
import type { WebSocketServer } from '@infrastructure/websocket/WebSocketServer';
import type { InboundRoutingService } from '@application/services/InboundRoutingService';

export class InboundController {
  constructor(
    private wss: WebSocketServer,
    private routing: InboundRoutingService,
  ) {}

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

    const result = await this.routing.routeNewCall(from, to, providerCallId);
    res.json(result);
  };

  // Agent answers an incoming call
  answerCall = async (req: Request, res: Response): Promise<void> => {
    const callId = String(req.params['callId']);
    const agentId = (req as any).user?.id ?? (req as any).agentId;

    await (prisma.call.update as any)({
      where: { id: callId },
      data:  { status: 'answered', answeredAt: new Date(), agentId },
    });
    await prisma.agentSession.update({
      where: { agentId },
      data:  { status: 'busy', activeCallId: callId },
    });
    await prisma.callQueue.deleteMany({ where: { callId } });
    await this.routing.onAnswered(callId);

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

  // Agent declines the offered call — routing tries the next available agent.
  rejectCall = async (req: Request, res: Response): Promise<void> => {
    const { callId } = req.params;
    const agentId = (req as any).user?.id ?? (req as any).agentId;
    await this.routing.onRejected(String(callId), agentId);
    res.json({ callId, status: 'requeued' });
  };
}
