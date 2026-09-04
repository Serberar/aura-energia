import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { config } from './config';

// Infrastructure
import { WebSocketServer } from '@infrastructure/websocket/WebSocketServer';
import { CallPrismaRepository } from '@infrastructure/prisma/CallPrismaRepository';
import { AgendaPrismaRepository } from '@infrastructure/prisma/AgendaPrismaRepository';
import { AgendaScheduler } from '@infrastructure/scheduler/AgendaScheduler';

// Use cases
import { InitiateCallUseCase } from '@application/use-cases/InitiateCallUseCase';
import { HandleCallEventUseCase } from '@application/use-cases/HandleCallEventUseCase';
import { HangUpCallUseCase } from '@application/use-cases/HangUpCallUseCase';
import { CreateAgendaEntryUseCase } from '@application/use-cases/CreateAgendaEntryUseCase';
import { UpdateAgendaEntryUseCase } from '@application/use-cases/UpdateAgendaEntryUseCase';
import { UpdateAgentStatusUseCase } from '@application/use-cases/UpdateAgentStatusUseCase';

// Controllers & routes
import { CallController } from '@infrastructure/express/controllers/CallController';
import { AgendaController } from '@infrastructure/express/controllers/AgendaController';
import { AgentController } from '@infrastructure/express/controllers/AgentController';
import { SupervisorController } from '@infrastructure/express/controllers/SupervisorController';
import { DispositionController } from '@infrastructure/express/controllers/DispositionController';
import { RecordingController } from '@infrastructure/express/controllers/RecordingController';
import { DncController } from '@infrastructure/express/controllers/DncController';
import { ScriptController } from '@infrastructure/express/controllers/ScriptController';
import { DialerController } from '@infrastructure/express/controllers/DialerController';
import { InboundController } from '@infrastructure/express/controllers/InboundController';
import { PredictiveController } from '@infrastructure/express/controllers/PredictiveController';
import { CampaignController } from '@infrastructure/express/controllers/CampaignController';
import { buildRoutes } from '@infrastructure/express/routes/index';

// ── Bootstrap ────────────────────────────────────────────────────────
const app = express();
app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));
app.use('/api', rateLimit({ windowMs: 60_000, max: 300, standardHeaders: true, legacyHeaders: false }));

// Health
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'calls-service', port: config.port });
});

// Wire up
const callRepo   = new CallPrismaRepository();
const agendaRepo = new AgendaPrismaRepository();
const wss        = new WebSocketServer();

const initiateUC   = new InitiateCallUseCase(callRepo, agendaRepo);
const handleEventUC = new HandleCallEventUseCase(callRepo, wss);
const hangUpUC     = new HangUpCallUseCase(callRepo, wss);
const createAgenda = new CreateAgendaEntryUseCase(agendaRepo);
const updateAgenda = new UpdateAgendaEntryUseCase(agendaRepo);
const agentStatusUC = new UpdateAgentStatusUseCase(wss);

const callCtrl       = new CallController(initiateUC, hangUpUC, handleEventUC, callRepo, wss);
const agendaCtrl     = new AgendaController(createAgenda, updateAgenda, agendaRepo);
const agentCtrl      = new AgentController(agentStatusUC);
const supervisorCtrl   = new SupervisorController(callRepo, agentStatusUC, wss);
const dispositionCtrl  = new DispositionController(callRepo, wss);
const recordingCtrl    = new RecordingController(callRepo);
const dncCtrl          = new DncController();
const scriptCtrl       = new ScriptController();
const dialerCtrl       = new DialerController();
const inboundCtrl      = new InboundController(wss);
const predictiveCtrl   = new PredictiveController(wss);
const campaignCtrl     = new CampaignController(wss);

app.use('/api', buildRoutes(callCtrl, agendaCtrl, agentCtrl, supervisorCtrl, dispositionCtrl, recordingCtrl, dncCtrl, scriptCtrl, dialerCtrl, inboundCtrl, predictiveCtrl, campaignCtrl));

// 404
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// ── HTTP + WebSocket server ──────────────────────────────────────────
const server = http.createServer(app);

server.on('upgrade', (req, socket, head) => {
  if (req.url === '/ws') {
    wss.server.handleUpgrade(req, socket, head, (ws) => {
      wss.server.emit('connection', ws, req);
    });
  } else {
    socket.destroy();
  }
});

server.listen(config.port, () => {
  console.log(`[calls-service] Running on port ${config.port}`);
  new AgendaScheduler(agendaRepo, wss).start();
});
