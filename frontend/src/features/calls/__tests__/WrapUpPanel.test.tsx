import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import callsReducer from '../callsSlice';
import WrapUpPanel from '../components/WrapUpPanel';
import type { Call } from '../types';

vi.mock('../services/dispositionService', () => ({
  listDispositionCodes: vi.fn().mockResolvedValue([
    { id: 'd1', label: 'Interesado', color: '#16a34a', isDefault: true, order: 0, active: true },
    { id: 'd2', label: 'No interesado', color: '#dc2626', isDefault: false, order: 1, active: true },
  ]),
  submitWrapUp: vi.fn().mockResolvedValue({}),
}));

vi.mock('../callsSlice', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return { ...actual, submitWrapUp: vi.fn(() => ({ type: 'mock/submitWrapUp', payload: {} })) };
});

const makeCall = (overrides: Partial<Call> = {}): Call => ({
  id: 'call-1', agentId: 'agent-1', clientPhone: '+34600000001',
  status: 'completed', direction: 'outbound', muted: false, onHold: false,
  duration: 65, startedAt: new Date().toISOString(), createdAt: new Date().toISOString(),
  ...overrides,
});

const makeStore = (pendingWrapUp: Call | null = null) =>
  configureStore({
    reducer: { calls: callsReducer },
    preloadedState: {
      calls: {
        activeCall: null, pendingWrapUp, incomingCall: null,
        queueEntries: [], predictiveStats: null,
        callHistory: [], total: 0, agendaEntries: [], reminders: [],
        loading: false, error: null, wsConnected: false,
        agentStatus: 'offline', dialerOpen: false,
      },
    } as any,
  });

const renderPanel = (call: Call | null = null) => {
  const store = makeStore(call);
  return { store, ...render(<Provider store={store}><WrapUpPanel /></Provider>) };
};

describe('WrapUpPanel', () => {
  beforeEach(() => vi.clearAllMocks());

  it('no renderiza nada si no hay pendingWrapUp', () => {
    const { container } = renderPanel(null);
    expect(container.firstChild).toBeNull();
  });

  it('muestra el teléfono del cliente y la duración', async () => {
    renderPanel(makeCall());
    expect(await screen.findByText('+34600000001')).toBeInTheDocument();
    expect(screen.getByText('1:05')).toBeInTheDocument();
  });

  it('carga y muestra los códigos de disposición', async () => {
    renderPanel(makeCall());
    expect(await screen.findByText('Interesado')).toBeInTheDocument();
    expect(await screen.findByText('No interesado')).toBeInTheDocument();
  });

  it('muestra el contador de tiempo de wrap-up', async () => {
    renderPanel(makeCall());
    await screen.findByText('Interesado');
    // El contador empieza en 120
    expect(screen.getByText(/120/)).toBeInTheDocument();
  });

  it('el campo de notas acepta texto', async () => {
    renderPanel(makeCall());
    await screen.findByText('Interesado');
    const textarea = screen.getByPlaceholderText(/resumen/i);
    fireEvent.change(textarea, { target: { value: 'Cliente muy interesado' } });
    expect((textarea as HTMLTextAreaElement).value).toBe('Cliente muy interesado');
  });

  it('el botón "Guardar y cerrar" está presente', async () => {
    renderPanel(makeCall());
    await screen.findByText('Interesado');
    expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
  });
});
