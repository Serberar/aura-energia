import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '@infrastructure/prisma/prismaClient';
import type { AuthRequest } from '../middleware/authMiddleware';
import { CampaignService, type CrmFilter } from '@application/services/CampaignService';
import { startSession, stopSession, getSession } from '@application/services/PredictiveDialer';
import { predictiveEmitter } from './PredictiveController';
import type { WebSocketServer } from '@infrastructure/websocket/WebSocketServer';

const campaignService = new CampaignService();

async function getEntryStats(dialListId: string): Promise<Record<string, number>> {
  const groups = await prisma.dialListEntry.groupBy({
    by:     ['status'],
    where:  { listId: dialListId },
    _count: { id: true },
  });
  const stats: Record<string, number> = {};
  for (const g of groups) stats[g.status] = g._count.id;
  return stats;
}

export class CampaignController {
  constructor(private wss: WebSocketServer) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    try {
      const campaigns = await prisma.campaign.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          dialList: { include: { _count: { select: { entries: true } } } },
          script:   { select: { id: true, name: true } },
        },
      });

      const results = await Promise.all(
        campaigns.map(async (c) => {
          const stats   = c.dialListId ? await getEntryStats(c.dialListId) : null;
          const session = c.dialListId ? getSession(c.dialListId) : undefined;
          return { ...c, stats, dialerRunning: session?.running ?? false };
        }),
      );
      res.json(results);
    } catch (err) {
      console.error('[CampaignController.list]', err);
      res.status(500).json({ error: 'Error al listar campañas' });
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const agentId = (req as AuthRequest).agentId;
      const { name, description, crmFilter, scriptId, maxAttempts = 3 } = req.body as {
        name: string;
        description?: string;
        crmFilter?: CrmFilter;
        scriptId?: string;
        maxAttempts?: number;
      };

      if (!name?.trim()) {
        res.status(400).json({ error: 'name requerido' });
        return;
      }

      const campaign = await prisma.$transaction(async (tx) => {
        const dialList = await tx.dialList.create({ data: { name: name.trim() } });
        return tx.campaign.create({
          data: {
            name:        name.trim(),
            description: description ?? undefined,
            crmFilter:   crmFilter ? (crmFilter as Prisma.InputJsonValue) : undefined,
            scriptId:    scriptId ?? undefined,
            maxAttempts,
            dialListId:  dialList.id,
            createdBy:   agentId,
          },
          include: {
            dialList: true,
            script:   { select: { id: true, name: true } },
          },
        });
      });

      let importResult = { imported: 0, skipped: 0, total: 0 };
      if (crmFilter && campaign.dialListId) {
        try {
          importResult = await campaignService.importClientsFromCRM(campaign.dialListId, crmFilter);
          await prisma.campaign.update({
            where: { id: campaign.id },
            data:  { totalImported: importResult.imported },
          });
        } catch (importErr) {
          console.error('[CampaignController.create] CRM import failed:', importErr);
        }
      }

      res.status(201).json({ ...campaign, importResult });
    } catch (err) {
      console.error('[CampaignController.create]', err);
      res.status(500).json({ error: 'Error al crear campaña' });
    }
  };

  getOne = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params['id'] as string;
      const campaign = await prisma.campaign.findUnique({
        where:   { id },
        include: {
          dialList: { include: { _count: { select: { entries: true } } } },
          script:   { select: { id: true, name: true } },
        },
      });
      if (!campaign) { res.status(404).json({ error: 'Campaña no encontrada' }); return; }

      const stats   = campaign.dialListId ? await getEntryStats(campaign.dialListId) : null;
      const session = campaign.dialListId ? getSession(campaign.dialListId) : undefined;

      res.json({
        ...campaign,
        stats,
        dialerRunning: session?.running ?? false,
        dialerStats:   session?.stats() ?? null,
      });
    } catch (err) {
      console.error('[CampaignController.getOne]', err);
      res.status(500).json({ error: 'Error al obtener campaña' });
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params['id'] as string;
      const { name, description, scriptId, maxAttempts, crmFilter } = req.body as {
        name?: string;
        description?: string;
        scriptId?: string | null;
        maxAttempts?: number;
        crmFilter?: CrmFilter | null;
      };

      const campaign = await prisma.campaign.update({
        where: { id },
        data: {
          ...(name        !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(maxAttempts !== undefined && { maxAttempts }),
          ...(scriptId    !== undefined && { scriptId }),
          ...(crmFilter   !== undefined && {
            crmFilter: crmFilter ? (crmFilter as Prisma.InputJsonValue) : Prisma.JsonNull,
          }),
        },
      });
      res.json(campaign);
    } catch (err) {
      console.error('[CampaignController.update]', err);
      res.status(500).json({ error: 'Error al actualizar campaña' });
    }
  };

  reimport = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params['id'] as string;
      const campaign = await prisma.campaign.findUnique({ where: { id } });
      if (!campaign)             { res.status(404).json({ error: 'Campaña no encontrada' }); return; }
      if (!campaign.dialListId)  { res.status(400).json({ error: 'Sin lista de marcación' }); return; }
      if (!campaign.crmFilter)   { res.status(400).json({ error: 'Sin filtro CRM configurado' }); return; }

      const filter = campaign.crmFilter as unknown as CrmFilter;
      const result = await campaignService.importClientsFromCRM(campaign.dialListId, filter);
      await prisma.campaign.update({
        where: { id },
        data:  { totalImported: { increment: result.imported } },
      });
      res.json(result);
    } catch (err) {
      console.error('[CampaignController.reimport]', err);
      res.status(500).json({ error: 'Error al re-importar' });
    }
  };

  start = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params['id'] as string;
      const campaign = await prisma.campaign.findUnique({ where: { id } });
      if (!campaign)            { res.status(404).json({ error: 'Campaña no encontrada' }); return; }
      if (!campaign.dialListId) { res.status(400).json({ error: 'Sin lista de marcación' }); return; }

      const listId = campaign.dialListId;
      await Promise.all([
        prisma.campaign.update({ where: { id }, data: { status: 'active' } }),
        prisma.dialList.update({ where: { id: listId }, data: { status: 'active' } }),
      ]);

      startSession(listId, predictiveEmitter);
      this.wss.broadcast({ type: 'campaign:started', campaignId: id });
      res.json({ campaignId: id, dialListId: listId, status: 'active' });
    } catch (err) {
      console.error('[CampaignController.start]', err);
      res.status(500).json({ error: 'Error al iniciar campaña' });
    }
  };

  stop = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params['id'] as string;
      const campaign = await prisma.campaign.findUnique({ where: { id } });
      if (!campaign)            { res.status(404).json({ error: 'Campaña no encontrada' }); return; }
      if (!campaign.dialListId) { res.status(400).json({ error: 'Sin lista de marcación' }); return; }

      const listId = campaign.dialListId;
      stopSession(listId);
      await Promise.all([
        prisma.campaign.update({ where: { id }, data: { status: 'paused' } }),
        prisma.dialList.update({ where: { id: listId }, data: { status: 'paused' } }),
      ]);
      this.wss.broadcast({ type: 'campaign:stopped', campaignId: id });
      res.json({ campaignId: id, status: 'paused' });
    } catch (err) {
      console.error('[CampaignController.stop]', err);
      res.status(500).json({ error: 'Error al detener campaña' });
    }
  };

  reset = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params['id'] as string;
      const campaign = await prisma.campaign.findUnique({ where: { id } });
      if (!campaign)            { res.status(404).json({ error: 'Campaña no encontrada' }); return; }
      if (!campaign.dialListId) { res.status(400).json({ error: 'Sin lista de marcación' }); return; }

      const listId = campaign.dialListId;
      stopSession(listId);

      await prisma.dialListEntry.updateMany({
        where: { listId },
        data:  { status: 'pending', attempts: 0, lastCallId: null, lastAttemptAt: null, nextAttemptAt: null },
      });

      await Promise.all([
        prisma.campaign.update({ where: { id }, data: { status: 'draft' } }),
        prisma.dialList.update({ where: { id: listId }, data: { status: 'draft' } }),
      ]);

      res.json({ campaignId: id, status: 'draft' });
    } catch (err) {
      console.error('[CampaignController.reset]', err);
      res.status(500).json({ error: 'Error al reiniciar campaña' });
    }
  };

  statusCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params['id'] as string;
      const campaign = await prisma.campaign.findUnique({
        where:  { id },
        select: { id: true, name: true, status: true, dialListId: true, totalImported: true },
      });
      if (!campaign) { res.status(404).json({ error: 'Campaña no encontrada' }); return; }

      const session    = campaign.dialListId ? getSession(campaign.dialListId) : undefined;
      const entryStats = campaign.dialListId ? await getEntryStats(campaign.dialListId) : null;

      res.json({
        ...campaign,
        entryStats,
        dialerStats:   session?.stats() ?? null,
        dialerRunning: session?.running ?? false,
      });
    } catch (err) {
      console.error('[CampaignController.statusCheck]', err);
      res.status(500).json({ error: 'Error al obtener estado' });
    }
  };
}
