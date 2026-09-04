import { Request } from 'express';

export function normalizeIp(raw?: string): string | undefined {
  if (!raw) return undefined;
  if (raw.startsWith('::ffff:')) return raw.replace('::ffff:', '');
  if (raw === '::1') return '127.0.0.1';
  return raw;
}

export function resolveClientIp(req: Request): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  let raw: string | undefined;
  if (typeof forwarded === 'string') {
    raw = forwarded.split(',')[0].trim();
  } else if (Array.isArray(forwarded)) {
    raw = forwarded[0].trim();
  } else {
    raw = req.socket.remoteAddress;
  }
  return normalizeIp(raw);
}
