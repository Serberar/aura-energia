import type { Request, Response } from 'express';
import { z } from 'zod';
import type { UpdateAgentStatusUseCase } from '@application/use-cases/UpdateAgentStatusUseCase';
import type { AuthRequest } from '../middleware/authMiddleware';

const StatusSchema = z.object({
  status: z.enum(['offline', 'available', 'busy', 'paused']),
  pauseReason: z.enum(['break', 'lunch', 'admin', 'training', 'personal']).optional(),
});

export class AgentController {
  constructor(private updateStatusUC: UpdateAgentStatusUseCase) {}

  getMe = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const name = [authReq.agentFirstName, authReq.agentLastName].filter(Boolean).join(' ') || undefined;
    const session = await this.updateStatusUC.getOrCreate(authReq.agentId, name);
    res.json(session);
  };

  setStatus = async (req: Request, res: Response): Promise<void> => {
    const parsed = StatusSchema.safeParse(req.body);
    if (!parsed.success) { res.status(422).json({ error: parsed.error.flatten() }); return; }
    const authReq = req as AuthRequest;
    const name = [authReq.agentFirstName, authReq.agentLastName].filter(Boolean).join(' ') || undefined;
    const session = await this.updateStatusUC.execute(
      authReq.agentId,
      parsed.data.status,
      parsed.data.pauseReason,
      name,
    );
    res.json(session);
  };

  listAll = async (_req: Request, res: Response): Promise<void> => {
    const sessions = await this.updateStatusUC.listAll();
    res.json(sessions);
  };

  getMyPauses = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const logs = await this.updateStatusUC.getPauseLogs(authReq.agentId);
    res.json(logs);
  };

  getAgentPauses = async (req: Request, res: Response): Promise<void> => {
    const agentId = req.params['agentId'] as string;
    const logs = await this.updateStatusUC.getPauseLogs(agentId);
    res.json(logs);
  };
}
