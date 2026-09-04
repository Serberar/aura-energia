import { prisma } from '@infrastructure/prisma/prismaClient';
import type { AgentStatus, AgentSession } from '@domain/entities/AgentSession';
import type { WebSocketServer } from '@infrastructure/websocket/WebSocketServer';

export class UpdateAgentStatusUseCase {
  constructor(private wss: WebSocketServer) {}

  async execute(agentId: string, status: AgentStatus, pauseReason?: string, agentName?: string): Promise<AgentSession> {
    // Close open pause log when leaving paused state
    if (status !== 'paused') {
      const openLog = await (prisma as any).agentPauseLog.findFirst({
        where: { agentId, endedAt: null },
        orderBy: { startedAt: 'desc' },
      });
      if (openLog) {
        const duration = Math.round((Date.now() - new Date(openLog.startedAt).getTime()) / 1000);
        await (prisma as any).agentPauseLog.update({
          where: { id: openLog.id },
          data: { endedAt: new Date(), duration },
        });
      }
    }

    const updateData: Record<string, unknown> = { status };
    if (agentName)                             updateData.agentName   = agentName;
    if (status === 'paused' && pauseReason)    updateData.pauseReason = pauseReason;
    if (status !== 'paused')                   updateData.pauseReason = null;

    const session = await (prisma.agentSession.upsert as any)({
      where:  { agentId },
      update: updateData,
      create: {
        agentId, status,
        ...(agentName ? { agentName } : {}),
        ...(status === 'paused' && pauseReason ? { pauseReason } : {}),
      },
    });

    // Open new pause log when entering paused state
    if (status === 'paused' && pauseReason) {
      await (prisma as any).agentPauseLog.create({
        data: { agentId, reason: pauseReason },
      });
    }

    this.wss.broadcast({ type: 'agent:status-changed', agentId, status, agentName: session.agentName, pauseReason: updateData.pauseReason });
    return session as AgentSession;
  }

  async getOrCreate(agentId: string, agentName?: string): Promise<AgentSession> {
    const session = await prisma.agentSession.upsert({
      where:  { agentId },
      update: agentName ? { agentName } : {},
      create: { agentId, status: 'available', ...(agentName ? { agentName } : {}) },
    });
    return session as AgentSession;
  }

  async listAll(): Promise<AgentSession[]> {
    return prisma.agentSession.findMany() as Promise<AgentSession[]>;
  }

  async getPauseLogs(agentId: string, date?: Date): Promise<unknown[]> {
    const from = date ?? new Date(new Date().setHours(0, 0, 0, 0));
    return (prisma as any).agentPauseLog.findMany({
      where: { agentId, startedAt: { gte: from } },
      orderBy: { startedAt: 'asc' },
    });
  }
}
