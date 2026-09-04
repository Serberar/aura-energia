import 'dotenv/config';

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const config = {
  port:             parseInt(process.env.PORT ?? '3004', 10),
  nodeEnv:          process.env.NODE_ENV ?? 'development',
  provider:         (process.env.PROVIDER ?? 'mock') as 'mock' | 'twilio' | 'vicidial',
  callsServiceUrl:  process.env.CALLS_SERVICE_URL ?? 'http://localhost:3003',
  internalApiKey:      required('INTERNAL_API_KEY'),
  connectorPublicUrl:  process.env.CONNECTOR_PUBLIC_URL ?? '',

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID ?? '',
    authToken:  process.env.TWILIO_AUTH_TOKEN ?? '',
    number:     process.env.TWILIO_NUMBER ?? '',
  },

  vicidial: {
    url:        process.env.VICIDIAL_URL ?? '',
    user:       process.env.VICIDIAL_USER ?? '',
    pass:       process.env.VICIDIAL_PASS ?? '',
    // Optional — required by some Vicidial installs for external_dial
    campaignId:    process.env.VICIDIAL_CAMPAIGN_ID ?? '',
    callServerIp:  process.env.VICIDIAL_CALL_SERVER_IP ?? '',
  },
} as const;
