import 'dotenv/config';

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Falta variable de entorno requerida: ${key}`);
  return val;
}

export const config = {
  port:          parseInt(process.env.PORT ?? '3005', 10),
  internalApiKey: required('INTERNAL_API_KEY'),
  lleidaApiKey:  process.env.LLEIDA_API_KEY ?? '',
  lleidaUser:    process.env.LLEIDA_USER ?? '',
  lleidaBaseUrl: process.env.LLEIDA_BASE_URL ?? 'https://api.lleida.net/cs/v1',
  useMock:       process.env.USE_MOCK === 'true',
} as const;
