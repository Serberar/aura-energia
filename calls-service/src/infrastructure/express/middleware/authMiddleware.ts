import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../../config';

export interface AuthRequest extends Request {
  agentId:        string;
  agentRole:      string;
  agentFirstName?: string;
  agentLastName?:  string;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing Authorization header' });
    return;
  }
  try {
    const payload = jwt.verify(header.slice(7), config.jwtSecret) as {
      id: string; role: string; firstName?: string; lastName?: string;
    };
    (req as AuthRequest).agentId        = payload.id;
    (req as AuthRequest).agentRole      = payload.role;
    (req as AuthRequest).agentFirstName = payload.firstName;
    (req as AuthRequest).agentLastName  = payload.lastName;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function internalApiKeyMiddleware(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers['x-internal-api-key'];
  if (!key || key !== config.internalApiKey) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}
