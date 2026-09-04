import { Router } from 'express';
import type { Request, Response } from 'express';
import { SignatureSmsSendSchema } from '../dtos/SignatureSmsSendDTO';
import { apiKeyMiddleware } from '../middleware/apiKeyMiddleware';
import { getProvider } from '../providers/providerFactory';

export const smsRouter = Router();

// POST /sms/signature/send
// crm-service llama aquí cuando deliveryMethod === 'sms'
// Body: SignatureSmsSendDTO (pdf base64, signerEmail, clientName, signerPhone, saleId, contractId, user, configId)
// Response: { signatureId }
smsRouter.post('/signature/send', apiKeyMiddleware, async (req: Request, res: Response): Promise<void> => {
  const parsed = SignatureSmsSendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({ error: 'Payload inválido', details: parsed.error.flatten() });
    return;
  }

  try {
    const result = await getProvider().send(parsed.data);
    res.status(201).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    res.status(502).json({ error: 'Error del proveedor Lleida', message });
  }
});
