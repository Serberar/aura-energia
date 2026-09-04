import { Router, Request, Response } from 'express';
import axios from 'axios';
import { authMiddleware } from '@infrastructure/express/middleware/authMiddleware';
import { internalApiKeyMiddleware } from '@infrastructure/express/middleware/internalApiKeyMiddleware';
import { RegisterCallEventUseCase } from '@application/use-cases/calls/RegisterCallEventUseCase';

const CALLS_SERVICE_URL = process.env.CALLS_SERVICE_URL ?? 'http://localhost:3003';

const registerCallEventUC = new RegisterCallEventUseCase();

// ── /api/calls ───────────────────────────────────────────────────────
export const callsRouter = Router();

// Click-to-call desde el CRM: proxy al calls-service preservando el JWT del agente
callsRouter.post('/initiate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { data } = await axios.post(
      `${CALLS_SERVICE_URL}/api/calls/initiate`,
      req.body,
      { headers: { Authorization: req.headers.authorization ?? '' } },
    );
    res.status(201).json(data);
  } catch (err: unknown) {
    const e = err as { response?: { status?: number; data?: unknown } };
    res.status(e.response?.status ?? 502).json(e.response?.data ?? { error: 'Calls service unavailable' });
  }
});

// Webhook interno: calls-service notifica eventos de llamada para registrar en SaleHistory
callsRouter.post('/events', internalApiKeyMiddleware, async (req: Request, res: Response) => {
  try {
    await registerCallEventUC.execute(req.body);
  } catch (err) {
    console.warn('[callsRoutes] Error registrando evento en SaleHistory:', err);
  }
  res.json({ ok: true });
});

// ── /api/sales (añade /:saleId/calls) ────────────────────────────────
export const salesCallsRouter = Router();

salesCallsRouter.get('/:saleId/calls', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { data } = await axios.get(`${CALLS_SERVICE_URL}/api/calls`, {
      params: { saleId: req.params['saleId'] },
      headers: { Authorization: req.headers.authorization ?? '' },
    });
    res.json(data);
  } catch (err: unknown) {
    const e = err as { response?: { status?: number; data?: unknown } };
    res.status(e.response?.status ?? 502).json(e.response?.data ?? { error: 'Calls service unavailable' });
  }
});
