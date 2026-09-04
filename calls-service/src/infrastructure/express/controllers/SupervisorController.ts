import type { Request, Response } from 'express';
import type { ICallRepository } from '@domain/repositories/ICallRepository';
import type { UpdateAgentStatusUseCase } from '@application/use-cases/UpdateAgentStatusUseCase';
import type { WebSocketServer } from '@infrastructure/websocket/WebSocketServer';

export class SupervisorController {
  constructor(
    private callRepo:       ICallRepository,
    private agentStatusUC:  UpdateAgentStatusUseCase,
    private wss:            WebSocketServer,
  ) {}

  getStats = async (_req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.callRepo.getTodayStats();
      res.json(stats);
    } catch (err) {
      console.error('SupervisorController.getStats error', err);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  };

  getActiveCalls = async (_req: Request, res: Response): Promise<void> => {
    try {
      const calls = await this.callRepo.getActiveCalls();
      const withMonitors = calls.map((c: any) => ({
        ...c,
        monitorCount: this.wss.getMonitorCount(c.id),
      }));
      res.json(withMonitors);
    } catch (err) {
      console.error('SupervisorController.getActiveCalls error', err);
      res.status(500).json({ error: 'Error al obtener llamadas activas' });
    }
  };

  getAgents = async (_req: Request, res: Response): Promise<void> => {
    try {
      const sessions = await this.agentStatusUC.listAll();
      res.json(sessions);
    } catch (err) {
      console.error('SupervisorController.getAgents error', err);
      res.status(500).json({ error: 'Error al obtener agentes' });
    }
  };

  getAgentCalls = async (req: Request, res: Response): Promise<void> => {
    try {
      const agentId  = req.params['agentId'] as string;
      const page     = parseInt(String(req.query['page']    ?? '1'),  10);
      const pageSize = parseInt(String(req.query['pageSize'] ?? '25'), 10);
      const fromStr  = req.query['from'] as string | undefined;
      const toStr    = req.query['to']   as string | undefined;

      const result = await this.callRepo.list({
        agentId,
        from: fromStr ? new Date(fromStr) : undefined,
        to:   toStr   ? new Date(toStr)   : undefined,
        page,
        pageSize,
      });
      res.json(result);
    } catch (err) {
      console.error('SupervisorController.getAgentCalls error', err);
      res.status(500).json({ error: 'Error al obtener llamadas del agente' });
    }
  };

  getHistoricalStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const now = new Date();
      const defaultFrom = new Date(now);
      defaultFrom.setDate(defaultFrom.getDate() - 30);

      const from    = req.query.from    ? new Date(req.query.from as string) : defaultFrom;
      const to      = req.query.to      ? new Date(req.query.to as string)   : now;
      const agentId = req.query.agentId as string | undefined;

      const stats = await this.callRepo.getHistoricalStats(from, to, agentId);
      res.json(stats);
    } catch (err) {
      console.error('SupervisorController.getHistoricalStats error', err);
      res.status(500).json({ error: 'Error al obtener estadísticas históricas' });
    }
  };
}
