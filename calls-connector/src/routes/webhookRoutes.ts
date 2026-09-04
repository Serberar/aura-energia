import { Router } from 'express';
import type { Request, Response } from 'express';
import axios from 'axios';
import { CallEventDTOSchema } from '../dtos/CallEventDTO';
import { config } from '../config';

export const webhookRouter = Router();

// POST /provider/webhook
// Recibe el webhook nativo del proveedor real (Twilio, Vicidial, etc.),
// lo normaliza a CallEventDTO y lo reenvía al calls-service.
// Con el MockProvider este endpoint no se usa (el mock llama directamente al callbackUrl).
webhookRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  // Cada proveedor tiene su propio mapper — aquí iría el switch según config.provider.
  // Por ahora soportamos recibir un CallEventDTO ya normalizado (útil para testing).
  const parsed = CallEventDTOSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({ error: 'Invalid event payload', details: parsed.error.flatten() });
    return;
  }

  try {
    await axios.post(
      `${config.callsServiceUrl}/api/calls/webhook`,
      parsed.data,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-internal-api-key': config.internalApiKey,
        },
        timeout: 5_000,
      },
    );
    res.status(200).json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(502).json({ error: 'Failed to forward event to calls-service', message });
  }
});
