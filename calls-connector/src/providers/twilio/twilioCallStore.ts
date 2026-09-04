export interface TwilioCallData {
  agentExtension?: string;
  callbackUrl: string;
  twilioNumber: string;
}

// In-process store: callId → call metadata needed by the TwiML endpoint
export const twilioCallStore = new Map<string, TwilioCallData>();
