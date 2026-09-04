import type { Request, Response } from 'express';
import { startSession, stopSession, getSession } from '@application/services/PredictiveDialer';
import type { WebSocketServer } from '@infrastructure/websocket/WebSocketServer';
import { EventEmitter } from 'events';

// One shared emitter per process — WS server listens to it
export const predictiveEmitter = new EventEmitter();

export class PredictiveController {
  constructor(private wss: WebSocketServer) {
    // Whenever the predictive dialer emits stats, broadcast via WS
    predictiveEmitter.on('predictive:stats', (stats) => {
      this.wss.broadcast({ type: 'predictive:stats', ...stats });
    });
  }

  start = async (req: Request, res: Response): Promise<void> => {
    const id = req.params['id'] as string;
    const session = startSession(id, predictiveEmitter);
    res.json({ running: session.running, listId: id });
  };

  stop = async (req: Request, res: Response): Promise<void> => {
    const id = req.params['id'] as string;
    stopSession(id);
    res.json({ running: false, listId: id });
  };

  status = async (req: Request, res: Response): Promise<void> => {
    const id = req.params['id'] as string;
    const session = getSession(id);
    if (!session) {
      res.json({ running: false, listId: id, dialed: 0, answered: 0, dropped: 0, amdDetected: 0, inFlight: 0, dropRate: 0, answerRate: 0, availAgents: 0, multiplier: 0 });
      return;
    }
    res.json(session.stats());
  };
}
