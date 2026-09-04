import { z } from 'zod';

export const CallRequestDTOSchema = z.object({
  callId:         z.string().uuid(),
  agentId:        z.string().min(1),
  agentExtension: z.string().optional(),
  clientPhone:    z.string().min(7),
  clientId:       z.string().optional(),
  saleId:         z.string().optional(),
  callbackUrl:    z.string().url(),
  record:         z.boolean(),
  metadata:       z.record(z.string(), z.unknown()).optional(),
});

export type CallRequestDTO = z.infer<typeof CallRequestDTOSchema>;
