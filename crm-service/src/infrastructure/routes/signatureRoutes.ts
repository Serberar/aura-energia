import { Router, Request, Response, NextFunction, urlencoded } from 'express';
import { SignatureController } from '@infrastructure/express/controllers/SignatureController';
import { authMiddleware } from '@infrastructure/express/middleware/authMiddleware';
import { validateRequest } from '@infrastructure/express/middleware/validateRequest';
import {
  sendContractSchema,
  resendContractSchema,
  webhookPayloadSchema,
} from '@infrastructure/express/validation/signatureSchemas';

function webhookSecretMiddleware(req: Request, res: Response, next: NextFunction): void {
  const expectedSecret = process.env.SIGNATURE_WEBHOOK_SECRET;
  if (!expectedSecret) {
    res.status(503).json({ error: 'Servicio no disponible: SIGNATURE_WEBHOOK_SECRET no configurado' });
    return;
  }
  const provided = req.headers['x-webhook-secret'];
  if (!provided || provided !== expectedSecret) {
    res.status(401).json({ error: 'Webhook secret inválido' });
    return;
  }
  next();
}

const saleSignatureRouter = Router({ mergeParams: true });

// GET /api/sales/:saleId/signature — consultar estado de firma
saleSignatureRouter.get(
  '/:saleId/signature',
  authMiddleware,
  SignatureController.getStatus.bind(SignatureController)
);

// POST /api/sales/:saleId/signature/send — generar y enviar contrato
saleSignatureRouter.post(
  '/:saleId/signature/send',
  authMiddleware,
  validateRequest(sendContractSchema),
  SignatureController.sendContract.bind(SignatureController)
);

// POST /api/sales/:saleId/signature/resend — reenviar contrato
saleSignatureRouter.post(
  '/:saleId/signature/resend',
  authMiddleware,
  validateRequest(resendContractSchema),
  SignatureController.resendContract.bind(SignatureController)
);

// DELETE /api/sales/:saleId/signature — cancelar solicitud de firma
saleSignatureRouter.delete(
  '/:saleId/signature',
  authMiddleware,
  SignatureController.cancelSignature.bind(SignatureController)
);

// GET /api/sales/:saleId/signature/evidence — descargar evidencia PDF de firma
saleSignatureRouter.get(
  '/:saleId/signature/evidence',
  authMiddleware,
  SignatureController.getEvidence.bind(SignatureController)
);

// POST /api/sales/:saleId/signature/evidence/fetch — descargar evidencia desde Lleida.net manualmente
saleSignatureRouter.post(
  '/:saleId/signature/evidence/fetch',
  authMiddleware,
  SignatureController.fetchEvidenceFromProvider.bind(SignatureController)
);

// ── Webhook (sin autenticación JWT, verificación por secret opcional) ──
const webhookRouter = Router();

// POST /api/signature/webhook
webhookRouter.post(
  '/webhook',
  webhookSecretMiddleware,
  validateRequest(webhookPayloadSchema),
  SignatureController.handleWebhook.bind(SignatureController)
);

// POST /api/signature/lleida-callback
// Callback de Lleida.net Click & Sign (application/x-www-form-urlencoded)
webhookRouter.post(
  '/lleida-callback',
  urlencoded({ extended: false }),
  webhookSecretMiddleware,
  SignatureController.handleLleidaCallback.bind(SignatureController)
);

export { saleSignatureRouter, webhookRouter };
