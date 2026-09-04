import type { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export function apiKeyMiddleware(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers['x-internal-api-key'];
  if (!key || key !== config.internalApiKey) {
    res.status(401).json({ error: 'Unauthorized: invalid or missing x-internal-api-key' });
    return;
  }
  next();
}
