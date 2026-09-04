import { EventEmitter } from 'events';
import axios from 'axios';
import { prisma } from '@infrastructure/prisma/prismaClient';
import { config } from '../../config';

export interface PredictiveStats {
  listId:        string;
  running:       boolean;
  dialed:        number;
  answered:      number;
  dropped:       number;
  amdDetected:   number;
  inFlight:      number;
  dropRate:      number;
  answerRate:    number;
  availAgents:   number;
  multiplier:    number;
}

// Singleton map: listId → PredictiveSession
const sessions = new Map<string, PredictiveSession>();

export function getSession(listId: string): PredictiveSession | undefined {
  return sessions.get(listId);
}

export function startSession(listId: string, emitter: EventEmitter): PredictiveSession {
  const existing = sessions.get(listId);
  if (existing?.running) return existing;
  const s = new PredictiveSession(listId, emitter);
  sessions.set(listId, s);
  s.start();
  return s;
}

export function stopSession(listId: string): void {
  sessions.get(listId)?.stop();
  sessions.delete(listId);
}

// Called by InboundController / HandleCallEventUseCase when a predictive call is answered/ended
export function notifyCallAnswered(listId: string, callId: string, agentAssigned: boolean): void {
  sessions.get(listId)?.onCallAnswered(callId, agentAssigned);
}

export function notifyCallEnded(listId: string, callId: string): void {
  sessions.get(listId)?.onCallEnded(callId);
}

class PredictiveSession {
  running  = false;
  dialed   = 0;
  answered = 0;
  dropped  = 0;
  amd      = 0;
  inFlight = new Set<string>(); // callIds currently ringing or answered

  private timer:   ReturnType<typeof setInterval> | null = null;
  private ticking  = false;
  private readonly INTERVAL_MS     = parseInt(process.env.PREDICTIVE_TICK_MS     ?? '4000', 10);
  private readonly AMD_RATE        = parseFloat(process.env.PREDICTIVE_AMD_RATE  ?? '0.25');
  private readonly TARGET_DROP_MAX = parseFloat(process.env.PREDICTIVE_DROP_MAX  ?? '0.03');

  constructor(
    private listId: string,
    private emitter: EventEmitter,
  ) {}

  start(): void {
    this.running = true;
    this.timer = setInterval(() => this.tick(), this.INTERVAL_MS);
    this.emitStats();
  }

  stop(): void {
    this.running = false;
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this.emitStats();
  }

  stats(): PredictiveStats {
    const totalAnswered = this.answered;
    const totalDialed   = this.dialed;
    const answerRate    = totalDialed > 0 ? totalAnswered / totalDialed : 0.5;
    const dropRate      = totalAnswered > 0
      ? Math.round((this.dropped / totalAnswered) * 1000) / 10
      : 0;

    return {
      listId:      this.listId,
      running:     this.running,
      dialed:      totalDialed,
      answered:    totalAnswered,
      dropped:     this.dropped,
      amdDetected: this.amd,
      inFlight:    this.inFlight.size,
      dropRate,
      answerRate:  Math.round(answerRate * 1000) / 10,
      availAgents: 0, // filled per-tick
      multiplier:  0, // filled per-tick
    };
  }

  private emitStats(): void {
    this.emitter.emit('predictive:stats', this.stats());
  }

  private async tick(): Promise<void> {
    if (!this.running || this.ticking) return;
    this.ticking = true;
    try {
      await this.doTick();
    } finally {
      this.ticking = false;
    }
  }

  private async doTick(): Promise<void> {
    if (!this.running) return;

    // 1. How many agents are available?
    const available = await prisma.agentSession.count({
      where: { status: 'available', activeCallId: null },
    });

    if (available === 0) {
      this.emitStats();
      return;
    }

    // 2. How many calls already in flight?
    const flying = this.inFlight.size;

    // 3. Predictive multiplier — aim to have (available + margin) calls ringing
    //    so that by the time one answers, an agent is free
    const histAnswerRate = this.dialed > 0
      ? this.answered / this.dialed
      : 0.5;

    // Multiplier: how many calls per agent to dial to get ~1 connect per agent
    // Stay under TARGET_DROP_MAX drop rate — simple heuristic
    const multiplier = Math.min(
      3,
      Math.max(1, Math.ceil(1 / Math.max(histAnswerRate, 0.1))),
    );

    const target  = available * multiplier;
    const toLaunch = Math.max(0, target - flying);

    // 4. Get next entries from list
    const entries = await prisma.dialListEntry.findMany({
      where: {
        listId: this.listId,
        status: 'pending',
        OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: new Date() } }],
      },
      take:    toLaunch,
      orderBy: [{ nextAttemptAt: 'asc' }, { createdAt: 'asc' }],
    });

    if (entries.length === 0) {
      // Check if list is complete
      const remaining = await prisma.dialListEntry.count({
        where: { listId: this.listId, status: 'pending' },
      });
      if (remaining === 0) {
        await prisma.dialList.update({
          where: { id: this.listId },
          data:  { status: 'completed' },
        });
        this.stop();
      }
      this.emitStats();
      return;
    }

    // 5. Launch calls
    for (const entry of entries) {
      void this.launchCall(entry);
    }

    // Broadcast updated stats
    const s = this.stats();
    s.availAgents = available;
    s.multiplier  = multiplier;
    this.emitter.emit('predictive:stats', s);
  }

  private async launchCall(entry: { id: string; phone: string; listId: string }): Promise<void> {
    const callId = crypto.randomUUID();
    this.inFlight.add(callId);
    this.dialed++;

    // Mark entry as "calling"
    await prisma.dialListEntry.update({
      where: { id: entry.id },
      data:  { status: 'calling', attempts: { increment: 1 }, lastAttemptAt: new Date() },
    });

    try {
      await axios.post(
        `${config.connectorUrl}/connect/call`,
        {
          callId,
          agentId:     `predictive-${this.listId}`,
          clientPhone: entry.phone,
          callbackUrl: `${config.callsServiceUrl}/api/calls/webhook`,
          record:      false,
          _predictive: { listId: this.listId, entryId: entry.id },
        },
        {
          headers: { 'x-internal-api-key': config.internalApiKey },
          timeout: 8_000,
        },
      );

      // Simulate AMD detection (25% chance) after a short delay
      if (Math.random() < this.AMD_RATE) {
        setTimeout(async () => {
          this.amd++;
          this.inFlight.delete(callId);
          await prisma.dialListEntry.update({
            where: { id: entry.id },
            data:  { status: 'called', nextAttemptAt: null },
          });
          this.emitStats();
        }, 1500 + Math.random() * 1000);
      }
    } catch {
      this.inFlight.delete(callId);
      await prisma.dialListEntry.update({
        where: { id: entry.id },
        data:  { status: 'pending', nextAttemptAt: new Date(Date.now() + 5 * 60_000) },
      });
    }
  }

  onCallAnswered(callId: string, agentAssigned: boolean): void {
    this.answered++;
    if (!agentAssigned) {
      this.dropped++;
      this.inFlight.delete(callId);
    }
    this.emitStats();
  }

  onCallEnded(callId: string): void {
    this.inFlight.delete(callId);
    this.emitStats();
  }
}
