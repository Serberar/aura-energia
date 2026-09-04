import { Router } from 'express';
import type { Request, Response } from 'express';
import axios from 'axios';
import { twilioCallStore } from '../providers/twilio/twilioCallStore';
import type { CallEventDTO } from '../dtos/CallEventDTO';
import { config } from '../config';
import { logger } from '../logger';

export const twilioRouter = Router();

// ---------------------------------------------------------------------------
// Twilio CallStatus → our CallEventType
// ---------------------------------------------------------------------------
const STATUS_MAP: Record<string, CallEventDTO['event'] | undefined> = {
  initiated:      'initiated',
  queued:         'initiated',
  ringing:        'ringing',
  'in-progress':  'answered',
  completed:      'completed',
  busy:           'busy',
  'no-answer':    'no-answer',
  failed:         'failed',
  canceled:       'failed',
};

// Express urlencoded / query give mixed types — cast body/query to plain string safely
function str(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0] as string;
  return '';
}

// ---------------------------------------------------------------------------
// GET /twilio/twiml/:callId
// Twilio fetches this URL when the called party answers.
// Responds with TwiML that connects the client to the agent.
// ---------------------------------------------------------------------------
twilioRouter.get('/twiml/:callId', (req: Request, res: Response): void => {
  const callId  = str(req.params['callId']);
  const callData = twilioCallStore.get(callId);

  res.set('Content-Type', 'text/xml');

  if (!callData) {
    res.send(
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<Response><Say language="es-ES">Lo sentimos, no se pudo conectar la llamada.</Say></Response>',
    );
    return;
  }

  const { agentExtension, twilioNumber } = callData;

  if (agentExtension && agentExtension.startsWith('+')) {
    // Two-leg PSTN call: client → Twilio → agent phone
    res.send(
      `<?xml version="1.0" encoding="UTF-8"?>` +
      `<Response>` +
      `<Dial callerId="${twilioNumber}" timeout="30" timeLimit="3600">` +
      `<Number>${agentExtension}</Number>` +
      `</Dial>` +
      `</Response>`,
    );
    return;
  }

  if (agentExtension && agentExtension.includes('@')) {
    // SIP softphone
    res.send(
      `<?xml version="1.0" encoding="UTF-8"?>` +
      `<Response>` +
      `<Dial callerId="${twilioNumber}" timeout="30" timeLimit="3600">` +
      `<Sip>${agentExtension}</Sip>` +
      `</Dial>` +
      `</Response>`,
    );
    return;
  }

  // Fallback: conference room — agent dials in separately
  res.send(
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<Response>` +
    `<Dial>` +
    `<Conference waitUrl="" beep="false" startConferenceOnEnter="true" endConferenceOnExit="true">` +
    `${callId}` +
    `</Conference>` +
    `</Dial>` +
    `</Response>`,
  );
});

// ---------------------------------------------------------------------------
// POST /twilio/webhook
// Receives Twilio status callbacks (form-encoded) and recording callbacks.
// Normalises to CallEventDTO and forwards to calls-service.
// ---------------------------------------------------------------------------
twilioRouter.post('/webhook', async (req: Request, res: Response): Promise<void> => {
  const callId          = str(req.query['callId']);
  // Express urlencoded parses body as Record<string, string|string[]> — cast for simplicity
  const body            = req.body as Record<string, unknown>;
  const callSid         = str(body['CallSid']);
  const recordingStatus = str(body['RecordingStatus']);

  if (!callId) {
    res.status(400).json({ error: 'Missing callId query param' });
    return;
  }

  let event: CallEventDTO;

  // --- Recording completed callback ---
  if (recordingStatus === 'completed') {
    const recordingUrl = str(body['RecordingUrl']) || undefined;
    const duration     = parseInt(str(body['RecordingDuration']), 10);

    event = {
      callId,
      providerCallId: callSid,
      event:          'recording',
      timestamp:      new Date().toISOString(),
      duration:       isNaN(duration) ? undefined : duration,
      recordingUrl,
      providerRaw:    body,
    };
  } else {
    // --- Call status callback ---
    const twilioStatus = str(body['CallStatus']);
    const mappedEvent  = STATUS_MAP[twilioStatus];

    if (!mappedEvent) {
      // Unknown status (e.g. voicemail-detection) — ack without forwarding
      res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response/>');
      return;
    }

    const durationRaw = str(body['CallDuration']);
    const duration    = durationRaw ? parseInt(durationRaw, 10) : undefined;

    event = {
      callId,
      providerCallId: callSid,
      event:          mappedEvent,
      timestamp:      new Date().toISOString(),
      duration:       duration !== undefined && !isNaN(duration) ? duration : undefined,
      disposition:    twilioStatus,
      providerRaw:    body,
    };
  }

  // Forward to calls-service using the stored callbackUrl (or fallback)
  const callData    = twilioCallStore.get(callId);
  const callbackUrl = callData?.callbackUrl ?? `${config.callsServiceUrl}/api/calls/webhook`;

  try {
    await axios.post(callbackUrl, event, {
      headers: {
        'Content-Type':       'application/json',
        'x-internal-api-key': config.internalApiKey,
      },
      timeout: 5_000,
    });
  } catch (err) {
    // Log but always return 200 to Twilio — non-200 triggers its retry loop
    logger.error('forward failed', err instanceof Error ? err.message : String(err));
  }

  // Twilio expects TwiML or an empty 200
  res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response/>');

  // Clean up store entry for terminal events
  const terminal: ReadonlySet<string> = new Set(['completed', 'failed', 'busy', 'no-answer']);
  if (terminal.has(event.event)) {
    twilioCallStore.delete(callId);
  }
});
