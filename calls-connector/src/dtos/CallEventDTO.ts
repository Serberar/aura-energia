import { z } from 'zod';

export const CallEventTypeSchema = z.enum([
  'initiated',
  'ringing',
  'answered',
  'completed',
  'no-answer',
  'busy',
  'failed',
  'recording',
]);

export type CallEventType = z.infer<typeof CallEventTypeSchema>;

export const CallEventDTOSchema = z.object({
  callId:         z.string().uuid(),
  providerCallId: z.string(),
  event:          CallEventTypeSchema,
  timestamp:      z.string().datetime(),
  duration:       z.number().int().nonnegative().optional(),
  recordingUrl:   z.string().url().optional(),
  disposition:    z.string().optional(),
  providerRaw:    z.unknown().optional(),
});

export type CallEventDTO = z.infer<typeof CallEventDTOSchema>;
