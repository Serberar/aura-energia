import { randomUUID } from 'crypto';
import { prisma } from '@infrastructure/prisma/prismaClient';
import type { WebSocketServer } from '@infrastructure/websocket/WebSocketServer';

const NO_ANSWER_TIMEOUT_MS = 20_000;

interface OfferState {
  timer: ReturnType<typeof setTimeout>;
  from: string;
  to: string;
  triedAgentIds: Set<string>;
}

// Handles ACD-style routing for inbound calls: find an available agent, offer
// the call with a no-answer timeout, fall back to the next agent (or the
// queue) on timeout/rejection, and drain the queue when an agent frees up.
// Without this, calls could ring one agent forever or sit in the queue with
// no one ever coming back to check on them.
export class InboundRoutingService {
  private offers = new Map<string, OfferState>(); // callId → offer state

  constructor(private wss: WebSocketServer) {}

  async routeNewCall(from: string, to: string, providerCallId?: string): Promise<{
    callId: string; assigned: boolean; agentId?: string; position?: number;
  }> {
    const callId = randomUUID();
    await (prisma.call.create as any)({
      data: {
        id: callId, agentId: 'queue', clientPhone: from,
        startedAt: new Date(), direction: 'inbound', status: 'initiated', providerCallId,
      },
    });

    const assigned = await this.tryAssign(callId, from, to, new Set());
    if (assigned) return { callId, assigned: true, agentId: assigned };

    const position = await this.enqueue(callId, from, to);
    return { callId, assigned: false, position };
  }

  // Called when the offered agent actually answers — cancels the no-answer timeout.
  async onAnswered(callId: string): Promise<void> {
    this.clearOffer(callId);
  }

  // Called when the agent explicitly declines — try the next agent instead of
  // just killing the call.
  async onRejected(callId: string, rejectingAgentId: string): Promise<void> {
    const offer = this.offers.get(callId);
    this.clearOffer(callId);
    await this.freeAgent(rejectingAgentId, callId);

    const excluded = offer?.triedAgentIds ?? new Set([rejectingAgentId]);
    excluded.add(rejectingAgentId);
    const from = offer?.from;
    const to = offer?.to;
    if (!from || !to) return;

    const assigned = await this.tryAssign(callId, from, to, excluded);
    if (!assigned) await this.enqueue(callId, from, to);
  }

  // Called whenever an agent transitions into 'available' — gives them the
  // oldest waiting call instead of leaving it in the queue indefinitely.
  async drainQueueForAgent(agentId: string): Promise<void> {
    const next = await prisma.callQueue.findFirst({
      where: { answeredAt: null },
      orderBy: { position: 'asc' },
    });
    if (!next) return;

    const session = await prisma.agentSession.findUnique({ where: { agentId } });
    if (!session || session.status !== 'available' || session.activeCallId) return;

    await prisma.callQueue.delete({ where: { id: next.id } }).catch(() => {});
    await this.offerToAgent(next.callId, agentId, next.fromPhone, next.toPhone, new Set());
  }

  private async tryAssign(callId: string, from: string, to: string, excludeAgentIds: Set<string>): Promise<string | undefined> {
    const session = await prisma.agentSession.findFirst({
      where: { status: 'available', activeCallId: null, agentId: { notIn: [...excludeAgentIds] } },
      orderBy: { updatedAt: 'asc' },
    });
    if (!session) return undefined;

    await this.offerToAgent(callId, session.agentId, from, to, excludeAgentIds);
    return session.agentId;
  }

  private async offerToAgent(callId: string, agentId: string, from: string, to: string, previouslyTried: Set<string>): Promise<void> {
    // Reserve the agent immediately so a second inbound call arriving a moment
    // later can't be offered to the same agent (activeCallId = null is the
    // filter every "find an available agent" query uses).
    await prisma.agentSession.update({ where: { agentId }, data: { activeCallId: callId } });
    await (prisma.call.update as any)({ where: { id: callId }, data: { agentId, status: 'ringing' } });

    const triedAgentIds = new Set(previouslyTried);
    triedAgentIds.add(agentId);

    const timer = setTimeout(() => { this.onTimeout(callId).catch(() => {}); }, NO_ANSWER_TIMEOUT_MS);
    this.offers.set(callId, { timer, from, to, triedAgentIds });

    this.wss.sendToAgent(agentId, { type: 'call:incoming', callId, from, to, agentId });
  }

  private async onTimeout(callId: string): Promise<void> {
    const offer = this.offers.get(callId);
    if (!offer) return;
    this.offers.delete(callId);

    const call = await prisma.call.findUnique({ where: { id: callId } });
    if (!call || call.status !== 'ringing') return; // already answered elsewhere

    await this.freeAgent(call.agentId, callId);
    const assigned = await this.tryAssign(callId, offer.from, offer.to, offer.triedAgentIds);
    if (!assigned) await this.enqueue(callId, offer.from, offer.to);
  }

  private async freeAgent(agentId: string, callId: string): Promise<void> {
    await prisma.agentSession.updateMany({
      where: { agentId, activeCallId: callId },
      data: { activeCallId: null },
    }).catch(() => {});
  }

  private clearOffer(callId: string): void {
    const offer = this.offers.get(callId);
    if (offer) { clearTimeout(offer.timer); this.offers.delete(callId); }
  }

  private async enqueue(callId: string, from: string, to: string): Promise<number> {
    const queueCount = await prisma.callQueue.count({ where: { answeredAt: null } });
    const position = queueCount + 1;
    await prisma.callQueue.create({ data: { callId, fromPhone: from, toPhone: to, position } });
    await (prisma.call.update as any)({ where: { id: callId }, data: { agentId: 'queue', status: 'initiated' } });
    this.wss.broadcast({ type: 'queue:call-added', callId, fromPhone: from, position });
    return position;
  }
}
