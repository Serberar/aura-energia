import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { authMiddleware } from '@infrastructure/express/middleware/authMiddleware';
import { prisma } from '@infrastructure/prisma/prismaClient';

const SMS_SERVICE_URL  = process.env.SMS_SERVICE_URL  ?? 'http://localhost:3006';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY ?? '';

function internalKeyMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.headers['x-internal-api-key'] !== INTERNAL_API_KEY) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

// ── /api/sms ─────────────────────────────────────────────────────────
export const smsRouter = Router();

// Click-to-SMS desde el CRM: proxy al sms-service preservando el JWT del agente
smsRouter.post('/send', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { data } = await axios.post(
      `${SMS_SERVICE_URL}/api/sms/send`,
      req.body,
      { headers: { Authorization: req.headers.authorization ?? '' } },
    );
    res.status(201).json(data);
  } catch (err: unknown) {
    const e = err as { response?: { status?: number; data?: unknown } };
    res.status(e.response?.status ?? 502).json(e.response?.data ?? { error: 'SMS service unavailable' });
  }
});

// Webhook interno: sms-service notifica eventos terminales para registrar en SaleHistory
smsRouter.post('/events', internalKeyMiddleware, async (req: Request, res: Response) => {
  const { smsId, status, saleId, agentId, to, errorCode } = req.body as {
    smsId?: string; status?: string; saleId?: string;
    agentId?: string; to?: string; errorCode?: string;
  };

  if (saleId) {
    try {
      await prisma.saleHistory.create({
        data: {
          saleId,
          action: 'sms_event',
          payload: { smsId, status, agentId, to, errorCode },
        },
      });
    } catch (err) {
      console.warn('[smsRoutes] Error registrando evento en SaleHistory:', err);
    }
  }

  res.json({ ok: true });
});

// ── /api/sales (añade /:saleId/sms) ──────────────────────────────────
export const salesSmsRouter = Router();

salesSmsRouter.get('/:saleId/sms', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { data } = await axios.get(`${SMS_SERVICE_URL}/api/sms`, {
      params: { saleId: req.params['saleId'] },
      headers: { Authorization: req.headers.authorization ?? '' },
    });
    res.json(data);
  } catch (err: unknown) {
    const e = err as { response?: { status?: number; data?: unknown } };
    res.status(e.response?.status ?? 502).json(e.response?.data ?? { error: 'SMS service unavailable' });
  }
});
