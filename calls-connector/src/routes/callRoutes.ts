import { Router } from 'express';
import type { Request, Response } from 'express';
import { CallRequestDTOSchema } from '../dtos/CallRequestDTO';
import { getProvider } from '../providers/providerFactory';

export const callRouter = Router();

// POST /connect/call
// Recibe un CallRequestDTO del calls-service, inicia la llamada con el proveedor.
callRouter.post('/call', async (req: Request, res: Response): Promise<void> => {
  const parsed = CallRequestDTOSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({ error: 'Invalid CallRequestDTO', details: parsed.error.flatten() });
    return;
  }

  try {
    const provider = getProvider();
    const result = await provider.initiateCall(parsed.data);
    res.status(200).json({ providerCallId: result.providerCallId });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(502).json({ error: 'Provider error', message });
  }
});

// POST /connect/hangup/:providerCallId
callRouter.post('/hangup/:providerCallId', async (req: Request, res: Response): Promise<void> => {
  const providerCallId = req.params['providerCallId'] as string;
  try {
    await getProvider().hangUp(providerCallId);
    res.status(200).json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(502).json({ error: 'Provider error', message });
  }
});
