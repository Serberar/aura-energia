import { describe, it, expect } from 'vitest';
import reducer, {
  wsCallUpdated, wsCallEnded, setWsConnected,
  openDialer, closeDialer, clearError,
  wsIncomingCall, dismissIncomingCall,
  wsQueueChanged, wsPredictiveStats,
  optimisticMute, optimisticHold, clearWrapUp,
  wsReminderReceived, dismissReminder,
} from '../callsSlice';
import type { CallsState } from '../types';
import type { Call } from '../types';

const makeCall = (overrides: Partial<Call> = {}): Call => ({
  id: 'call-1', agentId: 'agent-1', clientPhone: '+34600000001',
  status: 'initiated', direction: 'outbound', muted: false, onHold: false,
  startedAt: new Date().toISOString(), createdAt: new Date().toISOString(),
  ...overrides,
});

const initialState: CallsState = {
  activeCall: null, pendingWrapUp: null, incomingCall: null,
  queueEntries: [], predictiveStats: null,
  callHistory: [], total: 0, agendaEntries: [], reminders: [],
  loading: false, error: null, wsConnected: false,
  agentStatus: 'offline', dialerOpen: false,
};

describe('callsSlice reducers', () => {
  describe('wsCallUpdated', () => {
    it('actualiza activeCall cuando coincide el id', () => {
      const call = makeCall({ status: 'ringing' });
      const state = { ...initialState, activeCall: makeCall() };
      const next = reducer(state, wsCallUpdated({ ...call, status: 'answered' }));
      expect(next.activeCall?.status).toBe('answered');
    });

    it('actualiza el historial si la llamada está en él', () => {
      const call = makeCall();
      const state = { ...initialState, callHistory: [call] };
      const next = reducer(state, wsCallUpdated({ ...call, status: 'answered' }));
      expect(next.callHistory[0].status).toBe('answered');
    });

    it('no toca activeCall si el id no coincide', () => {
      const state = { ...initialState, activeCall: makeCall({ id: 'call-1' }) };
      const next = reducer(state, wsCallUpdated(makeCall({ id: 'call-2', status: 'ringing' })));
      expect(next.activeCall?.id).toBe('call-1');
    });
  });

  describe('wsCallEnded', () => {
    it('mueve activeCall a pendingWrapUp cuando termina', () => {
      const call = makeCall({ status: 'completed' });
      const state = { ...initialState, activeCall: makeCall() };
      const next = reducer(state, wsCallEnded(call));
      expect(next.activeCall).toBeNull();
      expect(next.pendingWrapUp?.id).toBe('call-1');
    });

    it('no cambia estado si la llamada que termina no es la activa', () => {
      const state = { ...initialState, activeCall: makeCall({ id: 'call-1' }) };
      const next = reducer(state, wsCallEnded(makeCall({ id: 'call-2', status: 'completed' })));
      expect(next.activeCall?.id).toBe('call-1');
      expect(next.pendingWrapUp).toBeNull();
    });
  });

  describe('clearWrapUp', () => {
    it('limpia pendingWrapUp', () => {
      const state = { ...initialState, pendingWrapUp: makeCall() };
      expect(reducer(state, clearWrapUp()).pendingWrapUp).toBeNull();
    });
  });

  describe('optimisticMute / optimisticHold', () => {
    it('togglea muted en activeCall', () => {
      const state = { ...initialState, activeCall: makeCall({ muted: false }) };
      expect(reducer(state, optimisticMute()).activeCall?.muted).toBe(true);
      const state2 = { ...initialState, activeCall: makeCall({ muted: true }) };
      expect(reducer(state2, optimisticMute()).activeCall?.muted).toBe(false);
    });

    it('togglea onHold en activeCall', () => {
      const state = { ...initialState, activeCall: makeCall({ onHold: false }) };
      expect(reducer(state, optimisticHold()).activeCall?.onHold).toBe(true);
    });

    it('no falla si no hay activeCall', () => {
      expect(() => reducer(initialState, optimisticMute())).not.toThrow();
    });
  });

  describe('dialer', () => {
    it('openDialer / closeDialer', () => {
      expect(reducer(initialState, openDialer()).dialerOpen).toBe(true);
      expect(reducer({ ...initialState, dialerOpen: true }, closeDialer()).dialerOpen).toBe(false);
    });
  });

  describe('WebSocket connection', () => {
    it('setWsConnected actualiza wsConnected', () => {
      expect(reducer(initialState, setWsConnected(true)).wsConnected).toBe(true);
      expect(reducer({ ...initialState, wsConnected: true }, setWsConnected(false)).wsConnected).toBe(false);
    });
  });

  describe('clearError', () => {
    it('limpia el error', () => {
      const state = { ...initialState, error: 'fallo' };
      expect(reducer(state, clearError()).error).toBeNull();
    });
  });

  describe('incoming call', () => {
    it('wsIncomingCall guarda la notificación', () => {
      const notification = { callId: 'c1', from: '+34600000001', to: '+34900000000', agentId: 'a1' };
      const next = reducer(initialState, wsIncomingCall(notification));
      expect(next.incomingCall).toEqual(notification);
    });

    it('dismissIncomingCall la borra', () => {
      const state = { ...initialState, incomingCall: { callId: 'c1', from: '', to: '', agentId: '' } };
      expect(reducer(state, dismissIncomingCall()).incomingCall).toBeNull();
    });
  });

  describe('cola de llamadas', () => {
    it('wsQueueChanged añade entrada nueva', () => {
      const entry = { callId: 'c1', fromPhone: '+34600000001', position: 1 };
      const next = reducer(initialState, wsQueueChanged(entry));
      expect(next.queueEntries).toHaveLength(1);
      expect(next.queueEntries[0].callId).toBe('c1');
    });

    it('wsQueueChanged actualiza entrada existente', () => {
      const state = { ...initialState, queueEntries: [{ callId: 'c1', fromPhone: '+34600000001', position: 1 }] };
      const next = reducer(state, wsQueueChanged({ callId: 'c1', fromPhone: '+34600000001', position: 2 }));
      expect(next.queueEntries).toHaveLength(1);
      expect(next.queueEntries[0].position).toBe(2);
    });
  });

  describe('predictive stats', () => {
    it('wsPredictiveStats guarda las estadísticas', () => {
      const stats = {
        listId: 'list-1', running: true, dialed: 10, answered: 8,
        dropped: 0, amdDetected: 2, inFlight: 1, dropRate: 0,
        answerRate: 80, availAgents: 2, multiplier: 2,
      };
      const next = reducer(initialState, wsPredictiveStats(stats));
      expect(next.predictiveStats).toEqual(stats);
    });
  });

  describe('reminders', () => {
    it('wsReminderReceived añade al array', () => {
      const r = { id: 'r1', entry: {} as any, receivedAt: new Date().toISOString() };
      const next = reducer(initialState, wsReminderReceived(r));
      expect(next.reminders).toHaveLength(1);
    });

    it('dismissReminder elimina por id', () => {
      const state = {
        ...initialState,
        reminders: [{ id: 'r1', entry: {} as any, receivedAt: '' }],
      };
      expect(reducer(state, dismissReminder('r1')).reminders).toHaveLength(0);
    });
  });
});
