import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HandleCallEventUseCase } from '../HandleCallEventUseCase';
import type { ICallRepository } from '@domain/repositories/ICallRepository';
import type { Call } from '@domain/entities/Call';

vi.mock('axios');
vi.mock('@infrastructure/../config', () => ({
  config: { crmBackendUrl: 'http://localhost:3002', internalApiKey: 'test-key' },
}));

const makeCall = (overrides: Partial<Call> = {}): Call => ({
  id: 'call-1', agentId: 'agent-1', clientPhone: '+34600000001',
  status: 'initiated', direction: 'outbound', muted: false, onHold: false,
  createdAt: new Date(), startedAt: new Date(), providerCallId: 'prov-1',
  ...overrides,
} as Call);

const makeRepo = (call: Call | null = makeCall()): ICallRepository => ({
  create:                  vi.fn(),
  findById:                vi.fn().mockResolvedValue(call),
  findByProviderCallId:    vi.fn().mockResolvedValue(call),
  update:                  vi.fn().mockImplementation((_id, data) => Promise.resolve({ ...call, ...data })),
  addEvent:                vi.fn().mockResolvedValue(undefined),
  list:                    vi.fn(),
  setAgentActiveCall:      vi.fn().mockResolvedValue(undefined),
  getHistoricalStats:      vi.fn(),
} as unknown as ICallRepository);

const makeWss = () => ({ sendToAgent: vi.fn(), broadcast: vi.fn() } as any);

describe('HandleCallEventUseCase', () => {
  let repo: ICallRepository;
  let wss: ReturnType<typeof makeWss>;
  let uc: HandleCallEventUseCase;

  beforeEach(() => {
    repo = makeRepo();
    wss  = makeWss();
    uc   = new HandleCallEventUseCase(repo, wss);
    vi.clearAllMocks();
  });

  it('actualiza estado a "ringing" y emite WS', async () => {
    const call = makeCall({ providerCallId: 'prov-1' });
    (repo.findByProviderCallId as any).mockResolvedValue(call);
    (repo.update as any).mockResolvedValue({ ...call, status: 'ringing' });

    await uc.execute({ callId: 'call-1', providerCallId: 'prov-1', event: 'ringing', timestamp: new Date().toISOString() });

    expect(repo.update).toHaveBeenCalledWith('call-1', expect.objectContaining({ status: 'ringing' }));
    expect(wss.sendToAgent).toHaveBeenCalledWith('agent-1', expect.objectContaining({ type: 'call:ringing' }));
  });

  it('actualiza answeredAt cuando el evento es "answered"', async () => {
    const call = makeCall();
    (repo.findByProviderCallId as any).mockResolvedValue(call);
    (repo.update as any).mockResolvedValue({ ...call, status: 'answered' });

    const timestamp = '2026-01-01T10:00:00.000Z';
    await uc.execute({ callId: 'call-1', providerCallId: 'prov-1', event: 'answered', timestamp });

    expect(repo.update).toHaveBeenCalledWith('call-1', expect.objectContaining({
      status: 'answered',
      answeredAt: new Date(timestamp),
    }));
  });

  it('marca endedAt y limpia sesión del agente cuando es terminal (completed)', async () => {
    const call = makeCall({ status: 'answered' });
    (repo.findByProviderCallId as any).mockResolvedValue(call);
    (repo.update as any).mockResolvedValue({ ...call, status: 'completed' });

    const timestamp = '2026-01-01T10:05:00.000Z';
    await uc.execute({ callId: 'call-1', providerCallId: 'prov-1', event: 'completed', timestamp, duration: 300 });

    expect(repo.update).toHaveBeenCalledWith('call-1', expect.objectContaining({
      status: 'completed',
      endedAt: new Date(timestamp),
      duration: 300,
    }));
    expect(repo.setAgentActiveCall).toHaveBeenCalledWith('agent-1', null);
  });

  it('marca endedAt en no-answer (terminal)', async () => {
    const call = makeCall();
    (repo.findByProviderCallId as any).mockResolvedValue(call);
    (repo.update as any).mockResolvedValue({ ...call, status: 'no_answer' });

    await uc.execute({ callId: 'call-1', providerCallId: 'prov-1', event: 'no-answer', timestamp: new Date().toISOString() });

    expect(repo.update).toHaveBeenCalledWith('call-1', expect.objectContaining({ status: 'no_answer' }));
  });

  it('registra el evento en el log', async () => {
    const call = makeCall();
    (repo.findByProviderCallId as any).mockResolvedValue(call);
    (repo.update as any).mockResolvedValue(call);

    await uc.execute({ callId: 'call-1', providerCallId: 'prov-1', event: 'ringing', timestamp: new Date().toISOString() });

    expect(repo.addEvent).toHaveBeenCalledWith('call-1', 'ringing', expect.any(Object));
  });

  it('ignora el evento si la llamada no existe', async () => {
    (repo.findByProviderCallId as any).mockResolvedValue(null);
    (repo.findById as any).mockResolvedValue(null);

    await uc.execute({ callId: 'xxx', providerCallId: 'xxx', event: 'ringing', timestamp: new Date().toISOString() });

    expect(repo.update).not.toHaveBeenCalled();
    expect(wss.sendToAgent).not.toHaveBeenCalled();
  });

  it('guarda recordingUrl cuando llega el evento "recording"', async () => {
    const call = makeCall({ status: 'completed' });
    (repo.findByProviderCallId as any).mockResolvedValue(call);
    (repo.update as any).mockResolvedValue(call);

    await uc.execute({
      callId: 'call-1', providerCallId: 'prov-1', event: 'recording',
      timestamp: new Date().toISOString(), recordingUrl: 'https://mock/rec.mp3',
    });

    expect(repo.update).toHaveBeenCalledWith('call-1', expect.objectContaining({ recordingUrl: 'https://mock/rec.mp3' }));
  });
});
