import 'dotenv/config';

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const config = {
  port:            parseInt(process.env.PORT ?? '3003', 10),
  nodeEnv:         process.env.NODE_ENV ?? 'development',
  jwtSecret:       required('JWT_SECRET'),
  internalApiKey:  required('INTERNAL_API_KEY'),
  crmBackendUrl:   process.env.CRM_BACKEND_URL    ?? 'http://localhost:3001',
  connectorUrl:    process.env.CONNECTOR_URL       ?? 'http://localhost:3004',
  callsServiceUrl: process.env.CALLS_SERVICE_URL   ?? `http://localhost:${process.env.PORT ?? '3003'}`,
  corsOrigin:      process.env.CORS_ORIGIN         ?? 'http://localhost:5173',
} as const;
