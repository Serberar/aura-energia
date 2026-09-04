import type { Request, Response } from 'express';
import { z } from 'zod';
import type { CreateAgendaEntryUseCase } from '@application/use-cases/CreateAgendaEntryUseCase';
import type { UpdateAgendaEntryUseCase } from '@application/use-cases/UpdateAgendaEntryUseCase';
import type { IAgendaRepository } from '@domain/repositories/IAgendaRepository';
import type { AuthRequest } from '../middleware/authMiddleware';

const CreateSchema = z.object({
  clientPhone: z.string().min(7),
  clientId:    z.string().optional(),
  saleId:      z.string().optional(),
  clientName:  z.string().optional(),
  scheduledAt: z.string().datetime(),
  reminderAt:  z.string().datetime().optional(),
  notes:       z.string().optional(),
  priority:    z.enum(['low', 'normal', 'high']).optional(),
});

const UpdateSchema = z.object({
  scheduledAt: z.string().datetime().optional(),
  reminderAt:  z.string().datetime().nullable().optional(),
  notes:       z.string().optional(),
  status:      z.enum(['pending', 'called', 'cancelled', 'rescheduled']).optional(),
  priority:    z.enum(['low', 'normal', 'high']).optional(),
});

export class AgendaController {
  constructor(
    private createUC: CreateAgendaEntryUseCase,
    private updateUC: UpdateAgendaEntryUseCase,
    private repo:     IAgendaRepository,
  ) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const agentId = (req as AuthRequest).agentId;
    const status  = req.query['status'] as string | undefined;
    const entries = await this.repo.listByAgent(agentId, status ? { status: status as never } : undefined);
    res.json(entries);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const parsed = CreateSchema.safeParse(req.body);
    if (!parsed.success) { res.status(422).json({ error: parsed.error.flatten() }); return; }
    const entry = await this.createUC.execute({
      agentId: (req as AuthRequest).agentId,
      ...parsed.data,
      scheduledAt: new Date(parsed.data.scheduledAt),
      reminderAt:  parsed.data.reminderAt ? new Date(parsed.data.reminderAt) : undefined,
    });
    res.status(201).json(entry);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const parsed = UpdateSchema.safeParse(req.body);
    if (!parsed.success) { res.status(422).json({ error: parsed.error.flatten() }); return; }
    try {
      const entry = await this.updateUC.execute(req.params['id'] as string, {
        ...parsed.data,
        scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : undefined,
        reminderAt:  parsed.data.reminderAt != null
          ? new Date(parsed.data.reminderAt)
          : (parsed.data.reminderAt === null ? null : undefined),
      });
      res.json(entry);
    } catch (err) {
      res.status(404).json({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    await this.repo.delete(req.params['id'] as string);
    res.json({ ok: true });
  };
}
