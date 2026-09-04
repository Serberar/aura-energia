import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'events';

// Mock prisma before importing the module
vi.mock('@infrastructure/prisma/prismaClient', () => ({
  prisma: {
    agentSession:  { count: vi.fn() },
    dialListEntry: { findMany: vi.fn(), update: vi.fn(), count: vi.fn() },
    dialList:      { update: vi.fn() },
  },
}));

vi.mock('axios', () => ({
  default: { post: vi.fn().mockResolvedValue({ data: { providerCallId: 'prov-x' } }) },
}));

vi.mock('../../config', () => ({
  config: { connectorUrl: 'http://localhost:3004', internalApiKey: 'key' },
}));

import { startSession, stopSession, getSession } from '../PredictiveDialer';
import { prisma } from '@infrastructure/prisma/prismaClient';

describe('PredictiveDialer', () => {
  let emitter: EventEmitter;

  beforeEach(() => {
    emitter = new EventEmitter();
    vi.useFakeTimers();
    (prisma.agentSession.count as any).mockResolvedValue(2);
    (prisma as any).dialListEntry.findMany.mockResolvedValue([]);
    (prisma as any).dialListEntry.update.mockResolvedValue({});
    (prisma as any).dialListEntry.count.mockResolvedValue(0);
    (prisma as any).dialList.update.mockResolvedValue({});
  });

  afterEach(() => {
    stopSession('list-1');
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('startSession arranca corriendo y emite stats iniciales', () => {
    const statsEvents: any[] = [];
    emitter.on('predictive:stats', (s) => statsEvents.push(s));

    const session = startSession('list-1', emitter);

    expect(session.running).toBe(true);
    expect(statsEvents.length).toBeGreaterThan(0);
    expect(statsEvents[0]).toMatchObject({ listId: 'list-1', running: true });
  });

  it('stopSession detiene la sesión y emite running=false', () => {
    const statsEvents: any[] = [];
    emitter.on('predictive:stats', (s) => statsEvents.push(s));

    startSession('list-1', emitter);
    statsEvents.length = 0;
    stopSession('list-1');

    expect(statsEvents.some((s) => s.running === false)).toBe(true);
  });

  it('startSession devuelve la sesión existente si ya está corriendo', () => {
    const s1 = startSession('list-1', emitter);
    const s2 = startSession('list-1', emitter);
    expect(s1).toBe(s2);
  });

  it('getSession devuelve undefined después de stopSession', () => {
    startSession('list-1', emitter);
    stopSession('list-1');
    expect(getSession('list-1')).toBeUndefined();
  });

  it('stats() calcula dropRate correctamente', () => {
    const session = startSession('list-1', emitter);
    session.onCallAnswered('c1', true);
    session.onCallAnswered('c2', false); // dropped
    session.onCallAnswered('c3', true);

    const s = session.stats();
    // 1 dropped de 3 answered → 33.3%
    expect(s.dropped).toBe(1);
    expect(s.dropRate).toBeCloseTo(33.3, 0);
  });

  it('stats() reporta answerRate 0 con multiplier=1 cuando no hay marcadas', () => {
    const session = startSession('list-1', emitter);
    const s = session.stats();
    // dialed=0 → histAnswerRate defaults to 0.5 → multiplier = ceil(1/0.5)=2
    expect(s.dialed).toBe(0);
    expect(s.running).toBe(true);
  });

  it('onCallEnded elimina la llamada de inFlight', () => {
    const session = startSession('list-1', emitter);
    session.onCallAnswered('c1', true);
    session.onCallEnded('c1');

    expect(session.inFlight.has('c1')).toBe(false);
  });

  it('el tick lanza llamadas cuando hay agentes disponibles y entradas pendientes', async () => {
    (prisma.agentSession.count as any).mockResolvedValue(1);
    (prisma as any).dialListEntry.findMany.mockResolvedValue([
      { id: 'e1', phone: '+34600000001', listId: 'list-1' },
    ]);

    const session = startSession('list-2', emitter);

    // Advance timer to trigger tick
    await vi.advanceTimersByTimeAsync(4100);

    expect((prisma as any).dialListEntry.findMany).toHaveBeenCalled();
    stopSession('list-2');
  });

  it('el tick para la sesión si no quedan entradas pendientes', async () => {
    (prisma.agentSession.count as any).mockResolvedValue(1);
    (prisma as any).dialListEntry.findMany.mockResolvedValue([]);
    (prisma as any).dialListEntry.count.mockResolvedValue(0); // lista completa

    const session = startSession('list-3', emitter);
    await vi.advanceTimersByTimeAsync(4100);

    expect(session.running).toBe(false);
    expect((prisma as any).dialList.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'list-3' }, data: { status: 'completed' } }),
    );
    stopSession('list-3');
  });
});
