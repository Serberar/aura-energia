import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InitiateCallUseCase } from '../InitiateCallUseCase';
import type { ICallRepository } from '@domain/repositories/ICallRepository';
import type { IAgendaRepository } from '@domain/repositories/IAgendaRepository';
import type { Call } from '@domain/entities/Call';

// Mock heavy dependencies
vi.mock('axios', () => ({
  default: { post: vi.fn().mockResolvedValue({ data: { providerCallId: 'prov-123' } }) },
}));

vi.mock('@infrastructure/../config', () => ({
  config: {
    connectorUrl:   'http://localhost:3004',
    crmBackendUrl:  'http://localhost:3002',
    internalApiKey: 'test-key',
  },
}));

// DncEntry mock — no entry by default (clean phone)
vi.mock('@infrastructure/prisma/prismaClient', () => ({
  prisma: {
    dncEntry: { findUnique: vi.fn().mockResolvedValue(null) },
  },
}));

import axios from 'axios';
import { prisma } from '@infrastructure/prisma/prismaClient';

const makeCall = (overrides: Partial<Call> = {}): Call => ({
  id: 'call-1', agentId: 'agent-1', clientPhone: '+34600000001',
  status: 'initiated', direction: 'outbound', muted: false, onHold: false,
  createdAt: new Date(), startedAt: new Date(),
  ...overrides,
} as Call);

const makeCallRepo = (call = makeCall()): ICallRepository => ({
  create:             vi.fn().mockResolvedValue(call),
  findById:           vi.fn().mockResolvedValue(call),
  update:             vi.fn().mockResolvedValue(call),
  setAgentActiveCall: vi.fn().mockResolvedValue(undefined),
  addEvent:           vi.fn(),
  list:               vi.fn(),
  findByProviderCallId: vi.fn(),
  getHistoricalStats: vi.fn(),
} as unknown as ICallRepository);

const makeAgendaRepo = (): IAgendaRepository => ({
  create: vi.fn(), findById: vi.fn(), list: vi.fn(),
  update: vi.fn().mockResolvedValue({}),
  delete: vi.fn(),
} as unknown as IAgendaRepository);

describe('InitiateCallUseCase', () => {
  let callRepo: ICallRepository;
  let agendaRepo: IAgendaRepository;
  let uc: InitiateCallUseCase;

  beforeEach(() => {
    callRepo   = makeCallRepo();
    agendaRepo = makeAgendaRepo();
    uc = new InitiateCallUseCase(callRepo, agendaRepo);
    vi.clearAllMocks();
    (prisma as any).dncEntry.findUnique.mockResolvedValue(null);
  });

  it('crea la llamada y llama al conector', async () => {
    (axios.post as any).mockResolvedValue({ data: { providerCallId: 'prov-123' } });

    await uc.execute({ agentId: 'agent-1', clientPhone: '+34600000001' });

    expect(callRepo.create).toHaveBeenCalledWith(expect.objectContaining({ clientPhone: '+34600000001' }));
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/connect/call'), expect.any(Object), expect.any(Object));
    expect(callRepo.update).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ providerCallId: 'prov-123' }));
  });

  it('marca la llamada como "failed" si el conector no responde', async () => {
    (axios.post as any).mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(uc.execute({ agentId: 'agent-1', clientPhone: '+34600000001' }))
      .rejects.toThrow('Connector unreachable');

    expect(callRepo.update).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ status: 'failed' }));
  });

  it('lanza DNC_BLOCKED si el teléfono está en lista DNC (no expirada)', async () => {
    (prisma as any).dncEntry.findUnique.mockResolvedValue({ phone: '+34600000001', expiresAt: null });

    await expect(uc.execute({ agentId: 'agent-1', clientPhone: '+34600000001' }))
      .rejects.toThrow('DNC_BLOCKED');

    expect(callRepo.create).not.toHaveBeenCalled();
  });

  it('permite llamar si la entrada DNC está expirada', async () => {
    (prisma as any).dncEntry.findUnique.mockResolvedValue({
      phone: '+34600000001',
      expiresAt: new Date(Date.now() - 1000), // ya expiró
    });
    (axios.post as any).mockResolvedValue({ data: { providerCallId: 'prov-123' } });

    await expect(uc.execute({ agentId: 'agent-1', clientPhone: '+34600000001' }))
      .resolves.toBeDefined();
  });

  it('actualiza la agenda entry a "called" si se pasa agendaEntryId', async () => {
    (axios.post as any).mockResolvedValue({ data: { providerCallId: 'prov-123' } });

    await uc.execute({ agentId: 'agent-1', clientPhone: '+34600000001', agendaEntryId: 'agenda-1' });

    expect(agendaRepo.update).toHaveBeenCalledWith('agenda-1', { status: 'called' });
  });

  it('asigna la llamada activa al agente', async () => {
    (axios.post as any).mockResolvedValue({ data: { providerCallId: 'prov-123' } });

    await uc.execute({ agentId: 'agent-1', clientPhone: '+34600000001' });

    expect(callRepo.setAgentActiveCall).toHaveBeenCalledWith('agent-1', expect.any(String));
  });
});
