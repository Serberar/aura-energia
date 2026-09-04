import type { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import type { InitiateCallUseCase } from '@application/use-cases/InitiateCallUseCase';
import type { HangUpCallUseCase } from '@application/use-cases/HangUpCallUseCase';
import type { HandleCallEventUseCase } from '@application/use-cases/HandleCallEventUseCase';
import type { ICallRepository } from '@domain/repositories/ICallRepository';
import type { AuthRequest } from '../middleware/authMiddleware';
import type { WebSocketServer } from '@infrastructure/websocket/WebSocketServer';
import { prisma } from '@infrastructure/prisma/prismaClient';

const InitiateSchema = z.object({
  clientPhone:   z.string().min(7),
  clientId:      z.string().optional(),
  saleId:        z.string().optional(),
  agendaEntryId: z.string().optional(),
  record:        z.boolean().optional(),
});

const NotesSchema = z.object({ text: z.string().max(2000) });
const DtmfSchema  = z.object({ digit: z.string().regex(/^[0-9*#]$/) });

const EventSchema = z.object({
  callId:         z.string(),
  providerCallId: z.string(),
  event:          z.string(),
  timestamp:      z.string(),
  duration:       z.number().optional(),
  recordingUrl:   z.string().optional(),
  disposition:    z.string().optional(),
  providerRaw:    z.unknown().optional(),
});

export class CallController {
  constructor(
    private initiateUC: InitiateCallUseCase,
    private hangUpUC:   HangUpCallUseCase,
    private eventUC:    HandleCallEventUseCase,
    private callRepo:   ICallRepository,
    private wss:        WebSocketServer,
  ) {}

  initiate = async (req: Request, res: Response): Promise<void> => {
    const parsed = InitiateSchema.safeParse(req.body);
    if (!parsed.success) { res.status(422).json({ error: parsed.error.flatten() }); return; }
    try {
      const call = await this.initiateUC.execute({
        agentId: (req as AuthRequest).agentId,
        ...parsed.data,
      });
      res.status(201).json(call);
    } catch (err) {
      res.status(502).json({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
  };

  demoCreate = async (req: Request, res: Response): Promise<void> => {
    const { clientPhone, clientName } = req.body as { clientPhone?: string; clientName?: string };
    const agentId = (req as AuthRequest).agentId;
    const id = randomUUID();
    const call = await prisma.call.create({
      data: {
        id,
        agentId,
        clientPhone: clientPhone ?? '000000000',
        status: 'initiated',
        direction: 'outbound',
        startedAt: new Date(),
      },
    });
    await this.callRepo.setAgentActiveCall(agentId, id);
    this.wss.broadcast({
      type: 'call:updated',
      call: { ...call, clientName: clientName ?? null },
    });
    res.status(201).json({ ...call, clientName: clientName ?? null });
  };

  hangUp = async (req: Request, res: Response): Promise<void> => {
    const callId = req.params['callId'] as string;
    const agentId = (req as AuthRequest).agentId;
    const agentRole = (req as AuthRequest).agentRole;
    const call = await this.callRepo.findById(callId);
    if (!call) { res.status(404).json({ error: 'Not found' }); return; }
    if (agentRole !== 'administrador' && agentRole !== 'coordinador' && call.agentId !== agentId) {
      res.status(403).json({ error: 'No puedes colgar llamadas de otros agentes' });
      return;
    }
    await this.hangUpUC.execute(callId);
    res.json({ ok: true });
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const agentId  = (req as AuthRequest).agentId;
    const page     = parseInt(String(req.query['page']    ?? '1'),  10);
    const pageSize = parseInt(String(req.query['pageSize'] ?? '50'), 10);
    const fromStr  = req.query['from'] as string | undefined;
    const toStr    = req.query['to']   as string | undefined;
    const dispRaw  = req.query['dispositionCodeId'] as string | undefined;
    const dispositionCodeId = dispRaw === 'null' ? null : dispRaw;
    const result   = await this.callRepo.list({
      agentId,
      saleId:             req.query['saleId']      as string | undefined,
      clientId:           req.query['clientId']    as string | undefined,
      clientPhone:        req.query['clientPhone'] as string | undefined,
      status:             req.query['status']      as any,
      dispositionCodeId:  dispRaw !== undefined ? dispositionCodeId : undefined,
      from:               fromStr ? new Date(fromStr) : undefined,
      to:                 toStr   ? new Date(toStr)   : undefined,
      page,
      pageSize,
    });
    res.json(result);
  };

  reviewSummary = async (_req: Request, res: Response): Promise<void> => {
    try {
      const summary = await this.callRepo.reviewSummary();
      res.json(summary);
    } catch (err) {
      console.error('[CallController.reviewSummary]', err);
      res.status(500).json({ error: 'Error al obtener resumen' });
    }
  };

  export = async (req: Request, res: Response): Promise<void> => {
    const agentId = (req as AuthRequest).agentId;
    const fromStr = req.query['from'] as string | undefined;
    const toStr   = req.query['to']   as string | undefined;
    const { data } = await this.callRepo.list({
      agentId,
      clientPhone: req.query['clientPhone'] as string | undefined,
      status:      req.query['status'] as any,
      from:        fromStr ? new Date(fromStr) : undefined,
      to:          toStr   ? new Date(toStr)   : undefined,
      pageSize:    10_000,
    });

    const header = 'Fecha,Teléfono,Estado,Duración,Disposición,Notas agente\n';
    const rows   = data.map((c) => [
      new Date(c.createdAt).toLocaleString('es-ES'),
      c.clientPhone,
      c.status,
      c.duration ?? '',
      c.agentNotes ? `"${c.agentNotes.replace(/"/g, '""')}"` : '',
    ].join(',')).join('\n');

    const date = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="llamadas-${date}.csv"`);
    res.send('﻿' + header + rows); // BOM for Excel
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const call = await this.callRepo.findById(req.params['callId'] as string);
    if (!call) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(call);
  };

  mute = async (req: Request, res: Response): Promise<void> => {
    const agentId = (req as AuthRequest).agentId;
    const agentRole = (req as AuthRequest).agentRole;
    const call = await this.callRepo.findById(req.params['callId'] as string);
    if (!call) { res.status(404).json({ error: 'Not found' }); return; }
    if (agentRole !== 'administrador' && agentRole !== 'coordinador' && call.agentId !== agentId) {
      res.status(403).json({ error: 'No puedes silenciar llamadas de otros agentes' });
      return;
    }
    const updated = await this.callRepo.update(call.id, { muted: !call.muted });
    this.wss.sendToAgent(call.agentId, { type: 'call:control', call: updated });
    res.json(updated);
  };

  hold = async (req: Request, res: Response): Promise<void> => {
    const agentId = (req as AuthRequest).agentId;
    const agentRole = (req as AuthRequest).agentRole;
    const call = await this.callRepo.findById(req.params['callId'] as string);
    if (!call) { res.status(404).json({ error: 'Not found' }); return; }
    if (agentRole !== 'administrador' && agentRole !== 'coordinador' && call.agentId !== agentId) {
      res.status(403).json({ error: 'No puedes poner en espera llamadas de otros agentes' });
      return;
    }
    const updated = await this.callRepo.update(call.id, { onHold: !call.onHold });
    this.wss.sendToAgent(call.agentId, { type: 'call:control', call: updated });
    res.json(updated);
  };

  dtmf = async (req: Request, res: Response): Promise<void> => {
    const parsed = DtmfSchema.safeParse(req.body);
    if (!parsed.success) { res.status(422).json({ error: parsed.error.flatten() }); return; }
    const agentId = (req as AuthRequest).agentId;
    const agentRole = (req as AuthRequest).agentRole;
    const call = await this.callRepo.findById(req.params['callId'] as string);
    if (!call) { res.status(404).json({ error: 'Not found' }); return; }
    if (agentRole !== 'administrador' && agentRole !== 'coordinador' && call.agentId !== agentId) {
      res.status(403).json({ error: 'No puedes enviar DTMF en llamadas de otros agentes' });
      return;
    }
    await this.callRepo.addEvent(call.id, 'dtmf', { digit: parsed.data.digit });
    res.json({ ok: true });
  };

  saveNotes = async (req: Request, res: Response): Promise<void> => {
    const parsed = NotesSchema.safeParse(req.body);
    if (!parsed.success) { res.status(422).json({ error: parsed.error.flatten() }); return; }
    const agentId = (req as AuthRequest).agentId;
    const agentRole = (req as AuthRequest).agentRole;
    const call = await this.callRepo.findById(req.params['callId'] as string);
    if (!call) { res.status(404).json({ error: 'Not found' }); return; }
    if (agentRole !== 'administrador' && agentRole !== 'coordinador' && call.agentId !== agentId) {
      res.status(403).json({ error: 'No puedes modificar notas de llamadas de otros agentes' });
      return;
    }
    const updated = await this.callRepo.update(call.id, { notes: parsed.data.text });
    res.json(updated);
  };

  // Endpoint interno — llamado por el connector (MockProvider) con CallEventDTO
  handleWebhook = async (req: Request, res: Response): Promise<void> => {
    const parsed = EventSchema.safeParse(req.body);
    if (!parsed.success) { res.status(422).json({ error: parsed.error.flatten() }); return; }
    await this.eventUC.execute(parsed.data);
    res.json({ ok: true });
  };
}
