import type { Request, Response } from 'express';
import { prisma } from '@infrastructure/prisma/prismaClient';
import { getSession } from '@application/services/PredictiveDialer';
import type { AuthRequest } from '../middleware/authMiddleware';

export class DialerController {
  // ── Dial lists ─────────────────────────────────────────────

  listLists = async (_req: Request, res: Response): Promise<void> => {
    const lists = await (prisma as any).dialList.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { entries: true } } },
    });
    res.json(lists);
  };

  // Lists without an associated campaign — shown as unnamed campaigns in the UI
  listOrphan = async (_req: Request, res: Response): Promise<void> => {
    const lists = await (prisma as any).dialList.findMany({
      where: { campaign: null },
      orderBy: { createdAt: 'desc' },
    });

    if (lists.length === 0) { res.json([]); return; }

    const listIds = lists.map((l: { id: string }) => l.id);
    const statsRows = await (prisma as any).dialListEntry.groupBy({
      by: ['listId', 'status'],
      where: { listId: { in: listIds } },
      _count: { id: true },
    });

    const statsMap: Record<string, Record<string, number>> = {};
    for (const row of statsRows) {
      if (!statsMap[row.listId]) statsMap[row.listId] = {};
      statsMap[row.listId][row.status] = row._count.id;
    }

    const result = lists.map((l: { id: string }) => {
      const session = getSession(l.id);
      return {
        ...l,
        stats: statsMap[l.id] ?? null,
        dialerRunning: session?.running ?? false,
        dialerStats: session?.running ? session.stats() : null,
      };
    });

    res.json(result);
  };

  createList = async (req: Request, res: Response): Promise<void> => {
    const { name } = req.body as { name: string };
    if (!name) { res.status(400).json({ error: 'name requerido' }); return; }
    const list = await (prisma as any).dialList.create({ data: { name } });
    res.status(201).json(list);
  };

  updateList = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { name, status } = req.body as { name?: string; status?: string };
    const list = await (prisma as any).dialList.update({
      where: { id },
      data: { ...(name && { name }), ...(status && { status }) },
    });
    res.json(list);
  };

  deleteList = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    await (prisma as any).dialList.delete({ where: { id } });
    res.status(204).end();
  };

  // ── Entries ────────────────────────────────────────────────

  addEntries = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { entries } = req.body as {
      entries: { phone: string; clientId?: string; saleId?: string; clientName?: string; notes?: string }[];
    };
    if (!Array.isArray(entries) || entries.length === 0) {
      res.status(400).json({ error: 'entries debe ser un array no vacío' });
      return;
    }
    const created = await (prisma as any).dialListEntry.createMany({
      data: entries.map((e) => ({ ...e, listId: id })),
      skipDuplicates: true,
    });
    res.status(201).json({ created: created.count });
  };

  listEntries = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status } = req.query as { status?: string };
    const entries = await (prisma as any).dialListEntry.findMany({
      where: { listId: id, ...(status && { status }) },
      orderBy: [{ nextAttemptAt: 'asc' }, { createdAt: 'asc' }],
    });
    res.json(entries);
  };

  updateEntry = async (req: Request, res: Response): Promise<void> => {
    const { entryId } = req.params;
    const data = req.body;
    const entry = await (prisma as any).dialListEntry.update({ where: { id: entryId }, data });
    res.json(entry);
  };

  // ── Next contact for agent ─────────────────────────────────

  getNext = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const now = new Date();
    const entry = await (prisma as any).dialListEntry.findFirst({
      where: {
        listId: id,
        status: 'pending',
        OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
      },
      orderBy: [{ nextAttemptAt: 'asc' }, { createdAt: 'asc' }],
    });
    res.json(entry ?? null);
  };

  skipEntry = async (req: Request, res: Response): Promise<void> => {
    const { entryId } = req.params;
    const entry = await (prisma as any).dialListEntry.update({
      where: { id: entryId },
      data: { status: 'skipped' },
    });
    res.json(entry);
  };

  // ── Mark called (called after call ends) ───────────────────

  markCalled = async (req: Request, res: Response): Promise<void> => {
    const { entryId } = req.params;
    const { callId, nextAttemptAt } = req.body as { callId?: string; nextAttemptAt?: string };
    const entry = await (prisma as any).dialListEntry.update({
      where: { id: entryId },
      data: {
        status: nextAttemptAt ? 'pending' : 'called',
        attempts: { increment: 1 },
        lastAttemptAt: new Date(),
        lastCallId: callId,
        nextAttemptAt: nextAttemptAt ? new Date(nextAttemptAt) : null,
      },
    });
    // Check if all entries are done
    const remaining = await (prisma as any).dialListEntry.count({
      where: { listId: entry.listId, status: 'pending' },
    });
    if (remaining === 0) {
      await (prisma as any).dialList.update({
        where: { id: entry.listId },
        data: { status: 'completed' },
      });
    }
    res.json(entry);
  };

  getStats = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const groups = await (prisma as any).dialListEntry.groupBy({
      by: ['status'],
      where: { listId: id },
      _count: { id: true },
    });
    const result: Record<string, number> = {};
    for (const g of groups) result[g.status] = g._count.id;
    res.json(result);
  };
}
