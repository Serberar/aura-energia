import type { Request, Response, NextFunction } from 'express';
import type { AuthRequest } from './authMiddleware';

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const agentRole = (req as AuthRequest).agentRole;
    if (!roles.includes(agentRole)) {
      res.status(403).json({ error: 'Acceso denegado: rol insuficiente' });
      return;
    }
    next();
  };
}
