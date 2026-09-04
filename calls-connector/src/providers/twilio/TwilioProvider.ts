import axios from 'axios';
import { config } from '../../config';
import { twilioCallStore } from './twilioCallStore';
import type { ICallProvider, InitiateCallResult } from '../ICallProvider';
import type { CallRequestDTO } from '../../dtos/CallRequestDTO';

export class TwilioProvider implements ICallProvider {
  private readonly apiBase: string;
  private readonly auth: { username: string; password: string };

  constructor() {
    const { accountSid, authToken, number } = config.twilio;
    if (!accountSid || !authToken || !number) {
      throw new Error(
        'Twilio credentials missing. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_NUMBER.',
      );
    }
    if (!config.connectorPublicUrl) {
      throw new Error(
        'CONNECTOR_PUBLIC_URL is required for TwilioProvider (Twilio must reach this server).',
      );
    }
    this.apiBase = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}`;
    this.auth    = { username: accountSid, password: authToken };
  }

  async initiateCall(request: CallRequestDTO): Promise<InitiateCallResult> {
    const { connectorPublicUrl } = config;

    // Embed callId in the callback URL so we can reconstruct the event without a DB lookup
    const statusCb  = `${connectorPublicUrl}/twilio/webhook?callId=${request.callId}`;
    const twimlUrl  = `${connectorPublicUrl}/twilio/twiml/${request.callId}`;

    // Persist metadata so the TwiML endpoint can build the correct response
    twilioCallStore.set(request.callId, {
      agentExtension: request.agentExtension,
      callbackUrl:    request.callbackUrl,
      twilioNumber:   config.twilio.number,
    });

    const params = new URLSearchParams({
      To:                    request.clientPhone,
      From:                  config.twilio.number,
      Url:                   twimlUrl,
      StatusCallback:        statusCb,
      StatusCallbackMethod:  'POST',
      StatusCallbackEvent:   'initiated ringing answered completed',
      MachineDetection:      'Enable',
    });

    if (request.record) {
      params.set('Record',                        'true');
      params.set('RecordingStatusCallback',       statusCb);
      params.set('RecordingStatusCallbackEvent',  'completed');
    }

    const response = await axios.post<{ sid: string }>(
      `${this.apiBase}/Calls.json`,
      params.toString(),
      {
        auth: this.auth,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10_000,
      },
    );

    return { providerCallId: response.data.sid };
  }

  async hangUp(providerCallId: string): Promise<void> {
    await axios.post(
      `${this.apiBase}/Calls/${providerCallId}.json`,
      new URLSearchParams({ Status: 'completed' }).toString(),
      {
        auth: this.auth,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10_000,
      },
    );
  }
}
