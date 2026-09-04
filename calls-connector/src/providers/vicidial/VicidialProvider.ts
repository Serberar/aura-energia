import axios from 'axios';
import { config } from '../../config';
import type { ICallProvider, InitiateCallResult } from '../ICallProvider';
import type { CallRequestDTO } from '../../dtos/CallRequestDTO';
import type { CallEventDTO } from '../../dtos/CallEventDTO';

// ─── Vicidial agent statuses ────────────────────────────────────────────────
// Returned by non_agent_api.php?function=agent_status (first pipe-delimited token).
// The exact set can vary between Vicidial versions — adjust here if needed.
type VicidialStatus = 'READY' | 'INCALL' | 'QUEUE' | 'DISPO' | 'PAUSED' | 'DEAD' | 'UNKNOWN';

// ─── In-process call registry ────────────────────────────────────────────────
interface VicidialCallMeta {
  callId:         string;
  providerCallId: string;
  callbackUrl:    string;
  agentUser:      string;
  lastVStatus:    VicidialStatus;
  ringingEmitted: boolean;
  answeredEmitted: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────

export class VicidialProvider implements ICallProvider {
  private readonly apiBase: string;
  private readonly cred:    { user: string; pass: string };

  private readonly POLL_INTERVAL_MS = 3_000;
  private readonly MAX_CALL_MS      = 2 * 60 * 60 * 1_000; // 2 h safety stop

  private polling  = new Map<string, NodeJS.Timeout>();
  private callMeta = new Map<string, VicidialCallMeta>();

  constructor() {
    const { url, user, pass } = config.vicidial;
    if (!url || !user || !pass) {
      throw new Error(
        'Vicidial credentials missing. Set VICIDIAL_URL, VICIDIAL_USER and VICIDIAL_PASS.',
      );
    }
    this.apiBase = `${url.replace(/\/$/, '')}/vicidial/non_agent_api.php`;
    this.cred    = { user, pass };
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  async initiateCall(request: CallRequestDTO): Promise<InitiateCallResult> {
    // agentExtension must be the Vicidial agent user ID (e.g. "6666")
    const agentUser = request.agentExtension ?? request.agentId;

    // Vicidial expects the number WITHOUT leading '+'
    const dialNumber = request.clientPhone.replace(/^\+/, '');

    const params = new URLSearchParams({
      source:       'crm',
      user:         this.cred.user,
      pass:         this.cred.pass,
      function:     'external_dial',
      phone_number: dialNumber,
      agent_user:   agentUser,
      dnc_check:    'N',
      alt_dial:     'NONE',
    });

    // Some Vicidial installs require campaign_id and call_server_ip
    if (config.vicidial.campaignId)   params.set('campaign_id',    config.vicidial.campaignId);
    if (config.vicidial.callServerIp) params.set('call_server_ip', config.vicidial.callServerIp);

    const raw = await this.get(params, 10_000);

    if (!raw.startsWith('SUCCESS')) {
      throw new Error(`Vicidial external_dial failed: ${raw}`);
    }

    // Response format: "SUCCESS: lead_id=12345|channel=SIP/6666-0001|..."
    const channelMatch = raw.match(/channel(?:_name)?=([^|]+)/i);
    const leadMatch    = raw.match(/lead_id=(\d+)/i);
    const providerCallId = channelMatch?.[1] ?? leadMatch?.[1] ?? request.callId;

    // Emit 'initiated' synchronously
    await this.postEvent(request.callbackUrl, {
      callId:         request.callId,
      providerCallId,
      event:          'initiated',
      timestamp:      new Date().toISOString(),
      providerRaw:    raw,
    });

    // Store metadata for polling
    const meta: VicidialCallMeta = {
      callId:          request.callId,
      providerCallId,
      callbackUrl:     request.callbackUrl,
      agentUser,
      lastVStatus:     'UNKNOWN',
      ringingEmitted:  false,
      answeredEmitted: false,
    };
    this.callMeta.set(request.callId, meta);
    this.startPolling(request.callId);

    return { providerCallId };
  }

  async hangUp(providerCallId: string): Promise<void> {
    // Find the agentUser for this provider call
    let agentUser = '';
    for (const m of this.callMeta.values()) {
      if (m.providerCallId === providerCallId) {
        agentUser = m.agentUser;
        break;
      }
    }

    const params = new URLSearchParams({
      source:     'crm',
      user:       this.cred.user,
      pass:       this.cred.pass,
      function:   'external_hangup',
      agent_user: agentUser,
    });

    await this.get(params, 10_000).catch((err) => {
      console.error(`[vicidial] hangUp failed: ${err instanceof Error ? err.message : String(err)}`);
    });
  }

  // ─── Polling ───────────────────────────────────────────────────────────────

  private startPolling(callId: string): void {
    const timer = setInterval(() => {
      void this.poll(callId);
    }, this.POLL_INTERVAL_MS);

    this.polling.set(callId, timer);

    // Safety: stop after MAX_CALL_MS regardless
    setTimeout(() => this.cleanup(callId), this.MAX_CALL_MS);
  }

  private async poll(callId: string): Promise<void> {
    const meta = this.callMeta.get(callId);
    if (!meta) { this.cleanup(callId); return; }

    let vStatus: VicidialStatus;
    try {
      vStatus = await this.fetchAgentStatus(meta.agentUser);
    } catch (err) {
      console.error(`[vicidial-poll] ${callId}: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }

    if (vStatus === meta.lastVStatus) return;
    meta.lastVStatus = vStatus;

    // ── State machine ────────────────────────────────────────────────────────

    // QUEUE → ringing (agent is being connected to client)
    if (vStatus === 'QUEUE' && !meta.ringingEmitted) {
      meta.ringingEmitted = true;
      await this.postEvent(meta.callbackUrl, {
        callId, providerCallId: meta.providerCallId,
        event: 'ringing', timestamp: new Date().toISOString(),
        disposition: vStatus,
      });
      return;
    }

    // INCALL → answered
    if (vStatus === 'INCALL' && !meta.answeredEmitted) {
      meta.ringingEmitted  = true;
      meta.answeredEmitted = true;
      await this.postEvent(meta.callbackUrl, {
        callId, providerCallId: meta.providerCallId,
        event: 'answered', timestamp: new Date().toISOString(),
        disposition: vStatus,
      });
      return;
    }

    // DISPO / READY / DEAD after answered → completed
    if (['DISPO', 'READY', 'DEAD'].includes(vStatus) && meta.answeredEmitted) {
      await this.postEvent(meta.callbackUrl, {
        callId, providerCallId: meta.providerCallId,
        event: 'completed', timestamp: new Date().toISOString(),
        disposition: vStatus,
      });
      this.cleanup(callId);
      return;
    }

    // DEAD / READY without ever answering → no-answer
    if (['DEAD', 'READY'].includes(vStatus) && !meta.answeredEmitted) {
      await this.postEvent(meta.callbackUrl, {
        callId, providerCallId: meta.providerCallId,
        event: 'no-answer', timestamp: new Date().toISOString(),
        disposition: vStatus,
      });
      this.cleanup(callId);
    }
  }

  private cleanup(callId: string): void {
    const timer = this.polling.get(callId);
    if (timer) {
      clearInterval(timer);
      this.polling.delete(callId);
    }
    this.callMeta.delete(callId);
  }

  // ─── Vicidial HTTP helpers ─────────────────────────────────────────────────

  // Queries the current status of a Vicidial agent.
  // The 'agent_status' function is available in Vicidial >= 2.14.
  // Response format: "<STATUS>|<EXTENSION>|<CAMPAIGN>|..."
  // For older installs, replace with 'in_session_check' or a custom poller.
  private async fetchAgentStatus(agentUser: string): Promise<VicidialStatus> {
    const params = new URLSearchParams({
      source:     'crm',
      user:       this.cred.user,
      pass:       this.cred.pass,
      function:   'agent_status',
      agent_user: agentUser,
    });

    const raw = await this.get(params, 5_000);
    const first = raw.split('|')[0]?.trim().toUpperCase();

    const known: VicidialStatus[] = ['READY', 'INCALL', 'QUEUE', 'DISPO', 'PAUSED', 'DEAD'];
    return known.includes(first as VicidialStatus)
      ? (first as VicidialStatus)
      : 'UNKNOWN';
  }

  private async get(params: URLSearchParams, timeoutMs: number): Promise<string> {
    const response = await axios.get<string>(`${this.apiBase}?${params.toString()}`, {
      timeout:          timeoutMs,
      responseType:     'text',
      validateStatus:   () => true, // parse Vicidial errors ourselves
    });
    return String(response.data ?? '').trim();
  }

  private async postEvent(
    callbackUrl: string,
    event: Omit<CallEventDTO, 'event'> & { event: CallEventDTO['event'] },
  ): Promise<void> {
    try {
      await axios.post(callbackUrl, event, {
        headers: {
          'Content-Type':       'application/json',
          'x-internal-api-key': config.internalApiKey,
        },
        timeout: 5_000,
      });
    } catch (err) {
      console.error(`[vicidial] postEvent(${event.event}) failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
