import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import callsReducer from '@/features/calls/callsSlice';
import CallsPage from '../CallsPage';
import type { Call, CallsState, AgentStatus } from '@/features/calls/types';

// ── Mocks ────────────────────────────────────────────────────────────────────
vi.mock('@/features/calls/services/callService', () => ({
  listCalls:      vi.fn().mockResolvedValue({ data: [], total: 0 }),
  buildExportUrl: vi.fn().mockReturnValue('http://localhost:3003/api/calls/export'),
  setAgentStatus: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/features/calls/services/agendaService', () => ({
  listAgenda: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/features/calls/services/dncService', () => ({
  addDnc: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/features/calls/components/AgendaPanel', () => ({
  default: () => <div data-testid="agenda-panel" />,
}));

// ── Helpers ───────────────────────────────────────────────────────────────────
const makeCall = (overrides: Partial<Call> = {}): Call => ({
  id: 'call-1', agentId: 'agent-1', clientPhone: '+34600000001',
  status: 'completed', direction: 'outbound', muted: false, onHold: false,
  duration: 90, startedAt: new Date().toISOString(), createdAt: new Date().toISOString(),
  ...overrides,
});

const makeStore = (agentStatus: AgentStatus = 'offline') =>
  configureStore({
    reducer: { calls: callsReducer },
    preloadedState: {
      calls: {
        activeCall: null, pendingWrapUp: null, incomingCall: null,
        queueEntries: [], predictiveStats: null,
        callHistory: [], total: 0,
        agendaEntries: [], reminders: [],
        loading: false, error: null, wsConnected: false,
        agentStatus, dialerOpen: false, demoActive: false,
      } satisfies CallsState,
    },
  });

const renderPage = (store = makeStore()) =>
  render(
    <Provider store={store}>
      <MemoryRouter>
        <CallsPage />
      </MemoryRouter>
    </Provider>
  );

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('CallsPage', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // reset default so cross-test mock contamination doesn't affect the empty-state test
    const svc = await import('@/features/calls/services/callService');
    (svc.listCalls as Mock).mockResolvedValue({ data: [], total: 0 });
  });

  it('renderiza el selector de estado del agente', () => {
    renderPage();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('muestra indicador de WS desconectado cuando wsConnected=false', () => {
    renderPage();
    expect(screen.getByText('Sin conexión')).toBeInTheDocument();
  });

  it('muestra el historial de llamadas cuando hay datos', async () => {
    const { listCalls } = await import('@/features/calls/services/callService');
    (listCalls as any).mockResolvedValue({ data: [makeCall()], total: 1 });
    renderPage();
    expect(await screen.findByText('+34600000001')).toBeInTheDocument();
    expect(screen.getByText('1:30')).toBeInTheDocument(); // 90s
  });

  it('muestra mensaje vacío cuando no hay llamadas', async () => {
    renderPage();
    expect(await screen.findByText('No hay llamadas con estos filtros')).toBeInTheDocument();
  });

  it('la tab Agenda muestra el AgendaPanel', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /agenda/i }));
    expect(screen.getByTestId('agenda-panel')).toBeInTheDocument();
  });

  it('el botón Nueva Llamada abre el dialer', () => {
    const store = makeStore();
    renderPage(store);
    fireEvent.click(screen.getByRole('button', { name: /nueva llamada/i }));
    expect(store.getState().calls.dialerOpen).toBe(true);
  });

  it('abrir filtros muestra el panel de filtros', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /filtros/i }));
    expect(screen.getByLabelText(/desde/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/hasta/i)).toBeInTheDocument();
  });

  it('seleccionar "Pausa" abre el modal de motivo', () => {
    renderPage();
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'paused' } });
    expect(screen.getByText(/motivo de pausa/i)).toBeInTheDocument();
  });

  it('muestra badge de estado correcto para llamada completada', async () => {
    const { listCalls } = await import('@/features/calls/services/callService');
    (listCalls as any).mockResolvedValue({ data: [makeCall({ status: 'completed' })], total: 1 });
    renderPage();
    expect(await screen.findByText('Completada')).toBeInTheDocument();
  });

  it('muestra badge sin respuesta para no_answer', async () => {
    const { listCalls } = await import('@/features/calls/services/callService');
    (listCalls as any).mockResolvedValue({ data: [makeCall({ status: 'no_answer' })], total: 1 });
    renderPage();
    expect(await screen.findByText('Sin respuesta')).toBeInTheDocument();
  });

  it('botón Exportar CSV está presente', () => {
    renderPage();
    expect(screen.getByRole('link', { name: /exportar/i })).toBeInTheDocument();
  });
});
