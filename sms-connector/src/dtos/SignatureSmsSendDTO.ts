import { z } from 'zod';

export const SignatureSmsSendSchema = z.object({
  pdf:         z.string(),       // base64 del PDF del contrato
  signerEmail: z.string(),
  clientName:  z.string(),
  signerPhone: z.string(),
  saleId:      z.string(),
  contractId:  z.string(),
  user:        z.string(),       // usuario de Lleida.net
  configId:    z.number().int(), // LLEIDA_CONFIG_ID_SMS
});

export type SignatureSmsSendDTO = z.infer<typeof SignatureSmsSendSchema>;
