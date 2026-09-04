import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '@infrastructure/prisma/prismaClient';
import type { ICallRepository } from '@domain/repositories/ICallRepository';
import type { WebSocketServer } from '@infrastructure/websocket/WebSocketServer';

const WrapUpSchema = z.object({
  dispositionCodeId: z.string().optional(),
  agentNotes:        z.string().max(4000).optional(),
  wrapUpStartedAt:   z.string().datetime().optional(),
});

const CreateCodeSchema = z.object({
  label:     z.string().min(1).max(80),
  color:     z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  isDefault: z.boolean().optional(),
  order:     z.number().int().optional(),
});

export class DispositionController {
  constructor(
    private callRepo: ICallRepository,
    private wss:      WebSocketServer,
  ) {}

  listCodes = async (_req: Request, res: Response): Promise<void> => {
    const codes = await (prisma as any).dispositionCode.findMany({
      where:   { active: true },
      orderBy: { order: 'asc' },
    });
    res.json(codes);
  };

  createCode = async (req: Request, res: Response): Promise<void> => {
    const parsed = CreateCodeSchema.safeParse(req.body);
    if (!parsed.success) { res.status(422).json({ error: parsed.error.flatten() }); return; }
    const code = await (prisma as any).dispositionCode.create({ data: parsed.data });
    res.status(201).json(code);
  };

  deleteCode = async (req: Request, res: Response): Promise<void> => {
    await (prisma as any).dispositionCode.update({
      where: { id: req.params['codeId'] as string },
      data:  { active: false },
    });
    res.json({ ok: true });
  };

  submitWrapUp = async (req: Request, res: Response): Promise<void> => {
    const parsed = WrapUpSchema.safeParse(req.body);
    if (!parsed.success) { res.status(422).json({ error: parsed.error.flatten() }); return; }

    const call = await this.callRepo.findById(req.params['callId'] as string);
    if (!call) { res.status(404).json({ error: 'Not found' }); return; }

    const wrapUpStartedAt = parsed.data.wrapUpStartedAt
      ? new Date(parsed.data.wrapUpStartedAt)
      : (call.endedAt ?? new Date());

    const updated = await this.callRepo.update(call.id, {
      dispositionCodeId: parsed.data.dispositionCodeId ?? null,
      agentNotes:        parsed.data.agentNotes,
      wrapUpStartedAt,
      wrapUpEndedAt: new Date(),
    });

    this.wss.sendToAgent(call.agentId, { type: 'call:wrapup-done', call: updated });
    res.json(updated);
  };
}
