import { Prisma } from '@prisma/client';
import { prisma } from './prismaClient';
import type { ICallRepository, CreateCallInput, UpdateCallInput, ListCallsFilter, SupervisorStats, ActiveCallInfo, HistoricalStats, ReviewSummaryItem } from '@domain/repositories/ICallRepository';
import type { Call } from '@domain/entities/Call';

export class CallPrismaRepository implements ICallRepository {
  async create(input: CreateCallInput): Promise<Call> {
    return prisma.call.create({ data: { ...input, startedAt: new Date() } }) as unknown as unknown as Promise<Call>;
  }

  async findById(id: string): Promise<Call | null> {
    return prisma.call.findUnique({ where: { id } }) as unknown as unknown as Promise<Call | null>;
  }

  async findByProviderCallId(providerCallId: string): Promise<Call | null> {
    return prisma.call.findUnique({ where: { providerCallId } }) as unknown as Promise<Call | null>;
  }

  async update(id: string, input: UpdateCallInput): Promise<Call> {
    return prisma.call.update({ where: { id }, data: input }) as unknown as Promise<Call>;
  }

  async list(filter: ListCallsFilter): Promise<{ data: Call[]; total: number }> {
    const { agentId, saleId, clientId, clientPhone, status, dispositionCodeId, from, to, page = 1, pageSize = 20 } = filter;
    const where: Record<string, unknown> = {
      ...(agentId     && { agentId }),
      ...(saleId      && { saleId }),
      ...(clientId    && { clientId }),
      ...(status      && { status }),
      ...(clientPhone && { clientPhone: { contains: clientPhone } }),
      ...(dispositionCodeId !== undefined && { dispositionCodeId: dispositionCodeId }),
      ...((from || to) && {
        createdAt: {
          ...(from && { gte: from }),
          ...(to   && { lte: to   }),
        },
      }),
    };
    const [data, total] = await Promise.all([
      prisma.call.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { dispositionCode: true },
      }),
      prisma.call.count({ where }),
    ]);
    return { data: data as unknown as Call[], total };
  }

  async reviewSummary(): Promise<ReviewSummaryItem[]> {
    const groups = await prisma.call.groupBy({
      by:      ['dispositionCodeId'],
      _count:  { id: true },
      orderBy: { _count: { id: 'desc' } },
    });
    const codeIds = groups.map((g) => g.dispositionCodeId).filter((id): id is string => id !== null);
    const codes   = codeIds.length > 0
      ? await prisma.dispositionCode.findMany({ where: { id: { in: codeIds } }, select: { id: true, label: true, color: true } })
      : [];
    const codeMap = new Map(codes.map((c) => [c.id, c]));
    const result: ReviewSummaryItem[] = [];
    for (const g of groups) {
      if (g.dispositionCodeId === null) continue;
      const code = codeMap.get(g.dispositionCodeId);
      result.push({ id: g.dispositionCodeId, label: code?.label ?? 'Desconocido', color: code?.color ?? '#6b7280', count: g._count.id });
    }
    const nullGroup = groups.find((g) => g.dispositionCodeId === null);
    if (nullGroup) result.push({ id: null, label: 'Sin codificación', color: '#9ca3af', count: nullGroup._count.id });
    return result;
  }

  async setAgentActiveCall(agentId: string, callId: string | null): Promise<void> {
    await prisma.agentSession.upsert({
      where:  { agentId },
      update: { activeCallId: callId },
      create: { agentId, activeCallId: callId },
    });
  }

  async addEvent(callId: string, event: string, payload?: unknown): Promise<void> {
    await prisma.callEvent.create({
      data: { callId, event, payload: payload as object ?? undefined },
    });
  }

  async getTodayStats(): Promise<SupervisorStats> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [total, answered, activeCalls, durationAgg, agentGroups] = await Promise.all([
      prisma.call.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.call.count({
        where: { createdAt: { gte: todayStart }, status: { in: ['answered', 'completed'] } },
      }),
      prisma.call.count({ where: { status: { in: ['initiated', 'ringing', 'answered'] } } }),
      prisma.call.aggregate({
        where: { createdAt: { gte: todayStart }, status: 'completed', duration: { not: null } },
        _avg: { duration: true },
      }),
      prisma.agentSession.groupBy({ by: ['status'], _count: { agentId: true } }),
    ]);

    const agentCount = (s: string) =>
      agentGroups.find((g) => g.status === s)?._count.agentId ?? 0;

    const available = agentCount('available');
    const busy      = agentCount('busy');
    const paused    = agentCount('paused');
    const offline   = agentCount('offline');

    return {
      today: {
        total,
        answered,
        answerRate:  total > 0 ? Math.round((answered / total) * 1000) / 10 : 0,
        avgDuration: Math.round(durationAgg._avg.duration ?? 0),
        activeCalls,
      },
      agents: {
        total:     available + busy + paused + offline,
        online:    available + busy + paused,
        available,
        busy,
        paused,
        offline,
      },
    };
  }

  async getHistoricalStats(from: Date, to: Date, agentId?: string): Promise<HistoricalStats> {
    const where = {
      createdAt: { gte: from, lte: to },
      ...(agentId && { agentId }),
    };
    const answeredStatuses = ['answered', 'completed'] as ('answered' | 'completed')[];

    // 1. Overall aggregates
    const [total, answered, durationAgg] = await Promise.all([
      prisma.call.count({ where }),
      prisma.call.count({ where: { ...where, status: { in: answeredStatuses } } }),
      prisma.call.aggregate({
        where: { ...where, status: 'completed', duration: { not: null } },
        _avg: { duration: true },
      }),
    ]);

    // 2. Hourly distribution — raw SQL (Prisma doesn't support groupBy on time parts)
    const agentFilter = agentId ? Prisma.sql`AND "agentId" = ${agentId}` : Prisma.empty;
    const hourlyRaw = await prisma.$queryRaw<Array<{ hour: number; total: bigint; answered: bigint }>>`
      SELECT EXTRACT(HOUR FROM "createdAt")::int               AS hour,
             COUNT(*)::bigint                                   AS total,
             COUNT(CASE WHEN status IN ('answered','completed') THEN 1 END)::bigint AS answered
      FROM "Call"
      WHERE "createdAt" >= ${from} AND "createdAt" <= ${to}
      ${agentFilter}
      GROUP BY hour
      ORDER BY hour
    `;
    const hourMap = new Map<number, { total: number; answered: number }>();
    for (let h = 0; h < 24; h++) hourMap.set(h, { total: 0, answered: 0 });
    for (const r of hourlyRaw) {
      hourMap.set(r.hour, { total: Number(r.total), answered: Number(r.answered) });
    }
    const hourlyDistribution = Array.from(hourMap.entries()).map(([hour, v]) => ({ hour, ...v }));

    // 3. Daily trend — raw SQL
    const dailyRaw = await prisma.$queryRaw<Array<{ date: string; total: bigint; answered: bigint }>>`
      SELECT TO_CHAR("createdAt", 'YYYY-MM-DD')                AS date,
             COUNT(*)::bigint                                   AS total,
             COUNT(CASE WHEN status IN ('answered','completed') THEN 1 END)::bigint AS answered
      FROM "Call"
      WHERE "createdAt" >= ${from} AND "createdAt" <= ${to}
      ${agentFilter}
      GROUP BY date
      ORDER BY date
    `;
    const dailyTrend = dailyRaw.map((r) => ({
      date: r.date,
      total: Number(r.total),
      answered: Number(r.answered),
    }));

    // 4. Agent ranking — groupBy (pure DB aggregation, no full scan)
    // agentId is never null on Call, so counting it equals counting all records in the group
    const [agentGroups, answeredGroups] = await Promise.all([
      prisma.call.groupBy({
        by: ['agentId'],
        where,
        _count: { agentId: true },
        _avg:   { duration: true },
        orderBy: { _count: { agentId: 'desc' } },
        take: 20,
      }),
      prisma.call.groupBy({
        by: ['agentId'],
        where: { ...where, status: { in: answeredStatuses } },
        _count: { agentId: true },
      }),
    ]);
    const answeredByAgent = new Map(answeredGroups.map((g) => [g.agentId, g._count.agentId]));
    const agentRanking = agentGroups.map((g) => ({
      agentId:     g.agentId,
      total:       g._count.agentId,
      answered:    answeredByAgent.get(g.agentId) ?? 0,
      avgDuration: Math.round((g._avg?.duration) ?? 0),
    }));

    // 5. Disposition breakdown — groupBy + resolve labels in a single extra query
    // id is never null on Call, so it gives a correct total per group
    const dispGroups = await prisma.call.groupBy({
      by:      ['dispositionCodeId'],
      where,
      _count:  { id: true },
      orderBy: { _count: { id: 'desc' } },
    });
    const codeIds = dispGroups
      .map((d) => d.dispositionCodeId)
      .filter((id): id is string => id !== null);
    const codes = codeIds.length > 0
      ? await prisma.dispositionCode.findMany({
          where:  { id: { in: codeIds } },
          select: { id: true, label: true, color: true },
        })
      : [];
    const codeMap = new Map(codes.map((c) => [c.id, c]));
    const nullCount = dispGroups.find((d) => d.dispositionCodeId === null)?._count.id ?? 0;
    const dispositionBreakdown = [
      ...dispGroups
        .filter((d) => d.dispositionCodeId !== null)
        .map((d) => {
          const code = codeMap.get(d.dispositionCodeId!);
          return { label: code?.label ?? 'Desconocido', color: code?.color ?? '#6b7280', count: d._count.id };
        }),
      ...(nullCount > 0 ? [{ label: 'Sin disposición', color: '#6b7280', count: nullCount }] : []),
    ];

    return {
      period: { from: from.toISOString(), to: to.toISOString() },
      total,
      answered,
      answerRate:   total > 0 ? Math.round((answered / total) * 1000) / 10 : 0,
      avgDuration:  Math.round(durationAgg._avg.duration ?? 0),
      hourlyDistribution,
      dispositionBreakdown,
      agentRanking,
      dailyTrend,
    };
  }

  async getActiveCalls(): Promise<ActiveCallInfo[]> {
    const [calls, sessions] = await Promise.all([
      prisma.call.findMany({
        where:   { status: { in: ['initiated', 'ringing', 'answered'] } },
        orderBy: { startedAt: 'asc' },
      }),
      prisma.agentSession.findMany(),
    ]);

    const sessionMap = new Map(sessions.map((s) => [s.agentId, s.status]));
    return calls.map((c) => ({
      ...(c as Call),
      agentCurrentStatus: sessionMap.get(c.agentId) ?? 'offline',
    }));
  }
}
