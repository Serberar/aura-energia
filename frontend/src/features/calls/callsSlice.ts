import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { CallsState, Call, AgentStatus, AgendaEntry, ReminderNotification, IncomingCallNotification, QueueEntry, PredictiveStats } from './types';
import * as callService from './services/callService';
import * as agendaService from './services/agendaService';
import * as dispositionService from './services/dispositionService';

const initialState: CallsState = {
  activeCall:    null,
  pendingWrapUp: null,
  incomingCall:    null,
  queueEntries:    [],
  predictiveStats: null,
  callHistory:   [],
  total:         0,
  agendaEntries: [],
  reminders:     [],
  loading:       false,
  error:         null,
  wsConnected:   false,
  agentStatus:   'offline',
  dialerOpen:    false,
  demoActive:    false,
};

export const initiateCall = createAsyncThunk(
  'calls/initiate',
  async (payload: callService.InitiateCallPayload, { rejectWithValue }) => {
    try {
      return await callService.initiateCall(payload);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error ?? 'Error al iniciar llamada');
    }
  },
);

export const hangUpCall = createAsyncThunk(
  'calls/hangUp',
  async (callId: string, { rejectWithValue, getState }) => {
    // Captura la llamada antes de colgar para poder abrir el panel de codificación
    const state = getState() as { calls: CallsState };
    const snapshot = state.calls.activeCall?.id === callId ? state.calls.activeCall : null;
    try {
      await callService.hangUpCall(callId);
      return { callId, snapshot };
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error ?? 'Error al colgar');
    }
  },
);

export const fetchCallHistory = createAsyncThunk(
  'calls/fetchHistory',
  async (params: callService.CallsFilter | undefined, { rejectWithValue }) => {
    try {
      return await callService.listCalls(params);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error ?? 'Error al obtener llamadas');
    }
  },
);

export const updateAgentStatus = createAsyncThunk(
  'calls/updateAgentStatus',
  async (payload: AgentStatus | { status: AgentStatus; pauseReason?: string }, { rejectWithValue }) => {
    try {
      const status  = typeof payload === 'string' ? payload : payload.status;
      const reason  = typeof payload === 'string' ? undefined : payload.pauseReason;
      await callService.setAgentStatus(status, reason);
      return status;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error ?? 'Error al actualizar estado');
    }
  },
);

export const muteCall = createAsyncThunk(
  'calls/mute',
  async (callId: string, { rejectWithValue }) => {
    try { return await callService.muteCall(callId); }
    catch { return rejectWithValue('Error al mutear llamada'); }
  },
);

export const holdCall = createAsyncThunk(
  'calls/hold',
  async (callId: string, { rejectWithValue }) => {
    try { return await callService.holdCall(callId); }
    catch { return rejectWithValue('Error al poner en espera'); }
  },
);

export const saveCallNotes = createAsyncThunk(
  'calls/saveNotes',
  async ({ callId, text }: { callId: string; text: string }, { rejectWithValue }) => {
    try { return await callService.saveCallNotes(callId, text); }
    catch { return rejectWithValue('Error al guardar notas'); }
  },
);

export const submitWrapUp = createAsyncThunk(
  'calls/submitWrapUp',
  async (
    payload: { callId: string; dispositionCodeId?: string; agentNotes?: string; wrapUpStartedAt?: string },
    { rejectWithValue },
  ) => {
    try {
      const { callId, ...rest } = payload;
      return await dispositionService.submitWrapUp(callId, rest);
    } catch {
      return rejectWithValue('Error al guardar la disposición');
    }
  },
);

export const fetchAgenda = createAsyncThunk(
  'calls/fetchAgenda',
  async (params: { status?: agendaService.UpdateAgendaPayload['status'] } | undefined, { rejectWithValue }) => {
    try {
      return await agendaService.listAgenda(params);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error ?? 'Error al obtener agenda');
    }
  },
);

export const createAgendaEntry = createAsyncThunk(
  'calls/createAgendaEntry',
  async (payload: agendaService.CreateAgendaPayload, { rejectWithValue }) => {
    try {
      return await agendaService.createAgendaEntry(payload);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error ?? 'Error al crear entrada');
    }
  },
);

export const updateAgendaEntry = createAsyncThunk(
  'calls/updateAgendaEntry',
  async ({ id, payload }: { id: string; payload: agendaService.UpdateAgendaPayload }, { rejectWithValue }) => {
    try {
      return await agendaService.updateAgendaEntry(id, payload);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error ?? 'Error al actualizar entrada');
    }
  },
);

export const deleteAgendaEntry = createAsyncThunk(
  'calls/deleteAgendaEntry',
  async (id: string, { rejectWithValue }) => {
    try {
      await agendaService.deleteAgendaEntry(id);
      return id;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error ?? 'Error al eliminar entrada');
    }
  },
);

const callsSlice = createSlice({
  name: 'calls',
  initialState,
  reducers: {
    // Demo mode — inyecta una llamada activa sin pasar por la API
    demoSetActiveCall(state, action: PayloadAction<Call>) {
      state.activeCall  = action.payload;
      state.demoActive  = true;
    },
    demoEnd(state) {
      state.demoActive = false;
    },
    // WebSocket-driven updates
    wsCallUpdated(state, action: PayloadAction<Call>) {
      const call = action.payload;
      if (state.activeCall?.id === call.id) {
        state.activeCall = call;
      }
      const idx = state.callHistory.findIndex((c) => c.id === call.id);
      if (idx !== -1) state.callHistory[idx] = call;
    },
    // Optimistic toggles (confirmed by WS call:control event)
    optimisticMute(state) {
      if (state.activeCall) state.activeCall.muted = !state.activeCall.muted;
    },
    optimisticHold(state) {
      if (state.activeCall) state.activeCall.onHold = !state.activeCall.onHold;
    },
    wsCallEnded(state, action: PayloadAction<Call>) {
      if (state.activeCall?.id === action.payload.id) {
        state.pendingWrapUp = action.payload;
        state.activeCall = null;
      }
    },
    clearWrapUp(state) {
      state.pendingWrapUp = null;
    },
    setWsConnected(state, action: PayloadAction<boolean>) {
      state.wsConnected = action.payload;
    },
    openDialer(state) {
      state.dialerOpen = true;
    },
    closeDialer(state) {
      state.dialerOpen = false;
    },
    clearError(state) {
      state.error = null;
    },
    wsReminderReceived(state, action: PayloadAction<ReminderNotification>) {
      state.reminders.unshift(action.payload);
    },
    dismissReminder(state, action: PayloadAction<string>) {
      state.reminders = state.reminders.filter((r) => r.id !== action.payload);
    },
    wsIncomingCall(state, action: PayloadAction<IncomingCallNotification>) {
      state.incomingCall = action.payload;
    },
    dismissIncomingCall(state) {
      state.incomingCall = null;
    },
    wsQueueChanged(state, action: PayloadAction<QueueEntry>) {
      const entry = action.payload;
      const idx = state.queueEntries.findIndex((q) => q.callId === entry.callId);
      if (idx === -1) {
        state.queueEntries.push(entry);
      } else {
        state.queueEntries[idx] = entry;
      }
    },
    wsQueueRemoved(state, action: PayloadAction<string>) {
      state.queueEntries = state.queueEntries.filter((q) => q.callId !== action.payload);
    },
    wsPredictiveStats(state, action: PayloadAction<PredictiveStats>) {
      state.predictiveStats = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initiateCall.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(initiateCall.fulfilled, (state, action) => {
        state.loading    = false;
        state.activeCall = action.payload;
        state.dialerOpen = false;
      })
      .addCase(initiateCall.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload as string;
      })
      .addCase(hangUpCall.fulfilled, (state, action) => {
        state.activeCall = null;
        // Abre el panel de codificación inmediatamente (sin esperar el evento WS)
        if (action.payload.snapshot && !state.pendingWrapUp) {
          state.pendingWrapUp = {
            ...action.payload.snapshot,
            status:  'completed',
            endedAt: new Date().toISOString(),
          };
        }
      })
      .addCase(fetchCallHistory.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCallHistory.fulfilled, (state, action) => {
        state.loading     = false;
        state.callHistory = action.payload.data;
        state.total       = action.payload.total;
      })
      .addCase(fetchCallHistory.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload as string;
      })
      .addCase(updateAgentStatus.fulfilled, (state, action) => {
        state.agentStatus = action.payload;
      })
      .addCase(fetchAgenda.fulfilled, (state, action) => {
        state.agendaEntries = action.payload;
      })
      .addCase(createAgendaEntry.fulfilled, (state, action) => {
        state.agendaEntries.unshift(action.payload);
      })
      .addCase(updateAgendaEntry.fulfilled, (state, action) => {
        const idx = state.agendaEntries.findIndex((e) => e.id === action.payload.id);
        if (idx !== -1) state.agendaEntries[idx] = action.payload;
      })
      .addCase(deleteAgendaEntry.fulfilled, (state, action) => {
        state.agendaEntries = state.agendaEntries.filter((e) => e.id !== action.payload);
      })
      .addCase(submitWrapUp.fulfilled, (state) => {
        state.pendingWrapUp = null;
      });
  },
});

export const {
  wsCallUpdated, wsCallEnded,
  setWsConnected, openDialer, closeDialer, clearError,
  wsReminderReceived, dismissReminder,
  optimisticMute, optimisticHold, clearWrapUp,
  wsIncomingCall, dismissIncomingCall, wsQueueChanged, wsQueueRemoved, wsPredictiveStats,
  demoSetActiveCall, demoEnd,
} = callsSlice.actions;

export default callsSlice.reducer;
