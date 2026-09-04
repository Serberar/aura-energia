import type { Request, Response } from 'express';
import { prisma } from '@infrastructure/prisma/prismaClient';
import type { AuthRequest } from '../middleware/authMiddleware';

const DNC_BULK_LIMIT = 500;

export class DncController {
  list = async (_req: Request, res: Response): Promise<void> => {
    const entries = await (prisma as any).dncEntry.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(entries);
  };

  check = async (req: Request, res: Response): Promise<void> => {
    const { phone } = req.query as { phone: string };
    if (!phone) { res.status(400).json({ error: 'phone requerido' }); return; }
    const entry = await (prisma as any).dncEntry.findUnique({ where: { phone } });
    res.json({ blocked: !!entry, entry: entry ?? null });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const { phone, reason, expiresAt } = req.body as { phone: string; reason?: string; expiresAt?: string };
    const agentId = (req as AuthRequest).agentId;
    if (!phone) { res.status(400).json({ error: 'phone requerido' }); return; }
    try {
      const entry = await (prisma as any).dncEntry.upsert({
        where:  { phone },
        update: { reason, expiresAt: expiresAt ? new Date(expiresAt) : null, addedById: agentId },
        create: { phone, reason, expiresAt: expiresAt ? new Date(expiresAt) : null, addedById: agentId },
      });
      res.status(201).json(entry);
    } catch {
      res.status(409).json({ error: 'El número ya está en la lista DNC' });
    }
  };

  bulk = async (req: Request, res: Response): Promise<void> => {
    const { phones, reason } = req.body as { phones: string[]; reason?: string };
    const agentId = (req as AuthRequest).agentId;
    if (!Array.isArray(phones) || phones.length === 0) { res.status(400).json({ error: 'phones requerido' }); return; }
    if (phones.length > DNC_BULK_LIMIT) {
      res.status(400).json({ error: `No se pueden añadir más de ${DNC_BULK_LIMIT} números a la vez` });
      return;
    }
    let added = 0;
    for (const phone of phones) {
      await (prisma as any).dncEntry.upsert({
        where:  { phone },
        update: { reason: reason ?? null, addedById: agentId },
        create: { phone, reason: reason ?? null, addedById: agentId },
      });
      added++;
    }
    res.json({ added });
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    await (prisma as any).dncEntry.delete({ where: { id } });
    res.status(204).end();
  };
}
