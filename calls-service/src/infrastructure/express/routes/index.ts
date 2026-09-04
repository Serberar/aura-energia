import { Router } from 'express';
import { authMiddleware, internalApiKeyMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/requireRole';
import type { CallController } from '../controllers/CallController';
import type { AgendaController } from '../controllers/AgendaController';
import type { AgentController } from '../controllers/AgentController';
import type { SupervisorController } from '../controllers/SupervisorController';
import type { DispositionController } from '../controllers/DispositionController';
import { RecordingController, uploadMiddleware } from '../controllers/RecordingController';
import type { DncController } from '../controllers/DncController';
import type { ScriptController } from '../controllers/ScriptController';
import type { DialerController } from '../controllers/DialerController';
import type { InboundController } from '../controllers/InboundController';
import type { PredictiveController } from '../controllers/PredictiveController';
import type { CampaignController } from '../controllers/CampaignController';

export function buildRoutes(
  callCtrl:        CallController,
  agendaCtrl:      AgendaController,
  agentCtrl:       AgentController,
  supervisorCtrl:  SupervisorController,
  dispositionCtrl: DispositionController,
  recordingCtrl:   RecordingController,
  dncCtrl:         DncController,
  scriptCtrl:      ScriptController,
  dialerCtrl:      DialerController,
  inboundCtrl:     InboundController,
  predictiveCtrl:  PredictiveController,
  campaignCtrl:    CampaignController,
): Router {
  const router = Router();

  // ── Calls ──────────────────────────────────────────────────
  router.get   ('/calls/review/summary',      authMiddleware, requireRole('administrador', 'coordinador'), callCtrl.reviewSummary);
  router.post  ('/calls/initiate',            authMiddleware,            callCtrl.initiate);
  if (process.env.NODE_ENV !== 'production') {
    router.post('/calls/demo/create',         authMiddleware,            callCtrl.demoCreate);
  }
  router.post  ('/calls/webhook',             internalApiKeyMiddleware,  callCtrl.handleWebhook);
  router.post  ('/calls/:callId/hangup',      authMiddleware,            callCtrl.hangUp);
  router.post  ('/calls/:callId/mute',        authMiddleware,            callCtrl.mute);
  router.post  ('/calls/:callId/hold',        authMiddleware,            callCtrl.hold);
  router.post  ('/calls/:callId/dtmf',        authMiddleware,            callCtrl.dtmf);
  router.post  ('/calls/:callId/notes',       authMiddleware,            callCtrl.saveNotes);
  router.patch ('/calls/:callId/wrapup',      authMiddleware,            dispositionCtrl.submitWrapUp);
  router.get   ('/calls/export',              authMiddleware,            callCtrl.export);
  router.get   ('/calls',                     authMiddleware,            callCtrl.list);
  router.get   ('/calls/:callId',             authMiddleware,            callCtrl.getById);
  router.post  ('/calls/:callId/recording',  authMiddleware, uploadMiddleware, recordingCtrl.upload);
  router.get   ('/calls/:callId/recording',  authMiddleware,            recordingCtrl.stream);

  // ── Disposition codes ──────────────────────────────────────
  router.get   ('/disposition-codes',         authMiddleware,            dispositionCtrl.listCodes);
  router.post  ('/disposition-codes',         authMiddleware,            dispositionCtrl.createCode);
  router.delete('/disposition-codes/:codeId', authMiddleware,            dispositionCtrl.deleteCode);

  // ── Agenda ─────────────────────────────────────────────────
  router.get   ('/agenda',                   authMiddleware,            agendaCtrl.list);
  router.post  ('/agenda',                   authMiddleware,            agendaCtrl.create);
  router.patch ('/agenda/:id',               authMiddleware,            agendaCtrl.update);
  router.delete('/agenda/:id',               authMiddleware,            agendaCtrl.delete);

  // ── Agents ─────────────────────────────────────────────────
  router.get   ('/agents/me',                authMiddleware,                                                agentCtrl.getMe);
  router.patch ('/agents/me/status',         authMiddleware,                                                agentCtrl.setStatus);
  router.get   ('/agents/me/pauses',         authMiddleware,                                                agentCtrl.getMyPauses);
  router.get   ('/agents',                   authMiddleware, requireRole('administrador', 'coordinador'),   agentCtrl.listAll);
  router.get   ('/agents/:agentId/pauses',   authMiddleware, requireRole('administrador', 'coordinador'),   agentCtrl.getAgentPauses);

  // ── Supervisor (admin/coordinador) ─────────────────────────
  const supervisorAuth = [authMiddleware, requireRole('administrador', 'coordinador')];
  router.get   ('/supervisor/stats',                    ...supervisorAuth, supervisorCtrl.getStats);
  router.get   ('/supervisor/stats/historical',         ...supervisorAuth, supervisorCtrl.getHistoricalStats);
  router.get   ('/supervisor/active-calls',             ...supervisorAuth, supervisorCtrl.getActiveCalls);
  router.get   ('/supervisor/agents',                   ...supervisorAuth, supervisorCtrl.getAgents);
  router.get   ('/supervisor/agents/:agentId/calls',   ...supervisorAuth, supervisorCtrl.getAgentCalls);

  // ── DNC ────────────────────────────────────────────────────
  router.get   ('/dnc',         authMiddleware,  dncCtrl.list);
  router.get   ('/dnc/check',   authMiddleware,  dncCtrl.check);
  router.post  ('/dnc',         authMiddleware,  dncCtrl.create);
  router.post  ('/dnc/bulk',    authMiddleware,  dncCtrl.bulk);
  router.delete('/dnc/:id',     authMiddleware,  dncCtrl.delete);

  // ── Scripts ─────────────────────────────────────────────────
  router.get   ('/scripts',     authMiddleware,  scriptCtrl.list);
  router.post  ('/scripts',     authMiddleware,  scriptCtrl.create);
  router.put   ('/scripts/:id', authMiddleware,  scriptCtrl.update);
  router.delete('/scripts/:id', authMiddleware,  scriptCtrl.delete);

  // ── Dialer (preview dialer) ──────────────────────────────────
  router.get   ('/dial-lists',                          authMiddleware, dialerCtrl.listLists);
  router.get   ('/dial-lists/orphan',                   authMiddleware, requireRole('administrador', 'coordinador'), dialerCtrl.listOrphan);
  router.post  ('/dial-lists',                          authMiddleware, dialerCtrl.createList);
  router.patch ('/dial-lists/:id',                      authMiddleware, dialerCtrl.updateList);
  router.delete('/dial-lists/:id',                      authMiddleware, dialerCtrl.deleteList);
  router.get   ('/dial-lists/:id/entries',              authMiddleware, dialerCtrl.listEntries);
  router.post  ('/dial-lists/:id/entries',              authMiddleware, dialerCtrl.addEntries);
  router.get   ('/dial-lists/:id/next',                 authMiddleware, dialerCtrl.getNext);
  router.get   ('/dial-lists/:id/stats',                authMiddleware, dialerCtrl.getStats);
  router.patch ('/dial-lists/:id/entries/:entryId',     authMiddleware, dialerCtrl.updateEntry);
  router.post  ('/dial-lists/:id/entries/:entryId/skip',  authMiddleware, dialerCtrl.skipEntry);
  router.post  ('/dial-lists/:id/entries/:entryId/called', authMiddleware, dialerCtrl.markCalled);

  // ── Predictive dialer (solo supervisor/admin) ────────────────
  const predictiveAuth = [authMiddleware, requireRole('administrador', 'coordinador')];
  router.post  ('/dial-lists/:id/predictive/start',  ...predictiveAuth, predictiveCtrl.start);
  router.post  ('/dial-lists/:id/predictive/stop',   ...predictiveAuth, predictiveCtrl.stop);
  router.get   ('/dial-lists/:id/predictive/status', ...predictiveAuth, predictiveCtrl.status);

  // ── Inbound calls + queue ────────────────────────────────────
  router.post  ('/inbound',              internalApiKeyMiddleware, inboundCtrl.handleInbound);
  router.get   ('/inbound/queue',        authMiddleware,           inboundCtrl.getQueue);
  router.post  ('/calls/:callId/answer', authMiddleware,           inboundCtrl.answerCall);
  router.post  ('/calls/:callId/reject', authMiddleware,           inboundCtrl.rejectCall);

  // ── Campaigns (supervisor/admin) ─────────────────────────────
  const campaignAuth = [authMiddleware, requireRole('administrador', 'coordinador')];
  router.get   ('/campaigns',                ...campaignAuth, campaignCtrl.list);
  router.post  ('/campaigns',                ...campaignAuth, campaignCtrl.create);
  router.get   ('/campaigns/:id',            ...campaignAuth, campaignCtrl.getOne);
  router.patch ('/campaigns/:id',            ...campaignAuth, campaignCtrl.update);
  router.post  ('/campaigns/:id/reimport',   ...campaignAuth, campaignCtrl.reimport);
  router.post  ('/campaigns/:id/reset',      ...campaignAuth, campaignCtrl.reset);
  router.post  ('/campaigns/:id/start',      ...campaignAuth, campaignCtrl.start);
  router.post  ('/campaigns/:id/stop',       ...campaignAuth, campaignCtrl.stop);
  router.get   ('/campaigns/:id/status',     ...campaignAuth, campaignCtrl.statusCheck);

  return router;
}
