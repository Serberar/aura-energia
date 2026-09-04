import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import callsReducer from '@/features/calls/callsSlice';
import supervisorReducer from '@/features/calls/supervisorSlice';
import SupervisorPage from '../SupervisorPage';

vi.mock('@/features/calls/services/supervisorService', () => ({
  getSupervisorStats:  vi.fn().mockResolvedValue(null),
  getActiveCalls:      vi.fn().mockResolvedValue([]),
  getSupervisorAgents: vi.fn().mockResolvedValue([]),
  getHistoricalStats:  vi.fn().mockResolvedValue({
    period:               { from: '', to: '' },
    total:                0,
    answered:             0,
    answerRate:           0,
    avgDuration:          0,
    hourlyDistribution:   [],
    dispositionBreakdown: [],
    agentRanking:         [],
    dailyTrend:           [],
  }),
}));

vi.mock('@/features/calls/hooks/useMonitorReceiver', () => ({
  useMonitorReceiver: () => ({
    statuses:       {},
    startListening: vi.fn(),
    stopListening:  vi.fn(),
  }),
}));

const makeStats = (overrides = {}) => ({
  today: {
    total: 42, answered: 35, answerRate: 83,
    avgDuration: 125, activeCalls: 3, ...overrides,
  },
  agents: { total: 5, online: 5, available: 2, busy: 3, paused: 0, offline: 0 },
});

const makeAgent = (overrides = {}) => ({
  agentId: 'agent-1', status: 'available',
  updatedAt: new Date().toISOString(), ...overrides,
});

const makeActiveCall = (overrides = {}) => ({
  id: 'call-1', agentId: 'agent-1', clientPhone: '+34600000001',
  status: 'answered', direction: 'outbound',
  startedAt: new Date().toISOString(), answeredAt: new Date().toISOString(),
  agentCurrentStatus: 'busy',
  ...overrides,
});

const makeStore = (supervisorState = {}) =>
  configureStore({
    reducer: { calls: callsReducer, supervisor: supervisorReducer },
    preloadedState: {
      calls: {
        activeCall: null, pendingWrapUp: null, incomingCall: null,
        queueEntries: [], predictiveStats: null, callHistory: [],
        total: 0, agendaEntries: [], reminders: [], loading: false,
        error: null, wsConnected: false, agentStatus: 'offline', dialerOpen: false,
      },
      supervisor: {
        stats: null, activeCalls: [], agents: [],
        loading: false, error: null, lastRefresh: null,
        ...supervisorState,
      },
    } as any,
  });

const renderPage = (store = makeStore()) =>
  render(
    <Provider store={store}>
      <MemoryRouter>
        <SupervisorPage />
      </MemoryRouter>
    </Provider>
  );

describe('SupervisorPage', () => {
  const emptyHistorical = {
    period: { from: '', to: '' },
    total: 0, answered: 0, answerRate: 0, avgDuration: 0,
    hourlyDistribution: [], dispositionBreakdown: [], agentRanking: [], dailyTrend: [],
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const svc = await import('@/features/calls/services/supervisorService');
    (svc.getSupervisorStats  as Mock).mockResolvedValue(null);
    (svc.getActiveCalls      as Mock).mockResolvedValue([]);
    (svc.getSupervisorAgents as Mock).mockResolvedValue([]);
    (svc.getHistoricalStats  as Mock).mockResolvedValue(emptyHistorical);
  });

  it('muestra el título del panel', () => {
    renderPage();
    expect(screen.getByText('Panel de Supervisor')).toBeInTheDocument();
  });

  it('muestra "Cargando…" mientras carga', () => {
    const store = makeStore({ loading: true });
    renderPage(store);
    expect(screen.getByRole('button', { name: /cargando/i })).toBeInTheDocument();
  });

  it('muestra el error cuando la carga falla', async () => {
    const svc = await import('@/features/calls/services/supervisorService');
    (svc.getSupervisorStats as Mock).mockRejectedValue(new Error('Error de conexión'));
    renderPage();
    expect(await screen.findByText('Error de conexión')).toBeInTheDocument();
  });

  it('muestra los tiles de estadísticas cuando hay datos', () => {
    const store = makeStore({ stats: makeStats() });
    renderPage(store);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('35')).toBeInTheDocument();
    expect(screen.getByText('83%')).toBeInTheDocument();
    expect(screen.getByText('2m 5s')).toBeInTheDocument();
  });

  it('muestra la tabla de agentes con sus estados', () => {
    const store = makeStore({ agents: [
      makeAgent({ agentId: 'agent-1', status: 'available' }),
      makeAgent({ agentId: 'agent-2', status: 'busy' }),
    ] });
    renderPage(store);
    expect(screen.getAllByText('Disponible').length).toBeGreaterThan(0);
    expect(screen.getAllByText('En llamada').length).toBeGreaterThan(0);
  });

  it('muestra la tabla de llamadas activas con el teléfono del cliente', () => {
    const store = makeStore({ activeCalls: [makeActiveCall()] });
    renderPage(store);
    expect(screen.getByText('+34600000001')).toBeInTheDocument();
  });

  it('el botón Actualizar llama al servicio de supervisor', async () => {
    const svc = await import('@/features/calls/services/supervisorService');
    renderPage();
    // wait for initial load to finish (button leaves "Cargando…" state)
    const btn = await screen.findByRole('button', { name: /actualizar/i });
    fireEvent.click(btn);
    await waitFor(() => expect(svc.getSupervisorStats).toHaveBeenCalledTimes(2)); // mount + click
  });

  it('muestra "Sin llamadas activas" cuando activeCalls está vacío', () => {
    const store = makeStore({ stats: makeStats(), activeCalls: [] });
    renderPage(store);
    expect(screen.getByText('Sin llamadas activas en este momento')).toBeInTheDocument();
  });

  it('muestra "No hay sesiones" cuando agents está vacío', () => {
    const store = makeStore({ agents: [] });
    renderPage(store);
    expect(screen.getByText('No hay sesiones de agente registradas')).toBeInTheDocument();
  });
});
