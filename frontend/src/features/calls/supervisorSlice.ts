import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getSupervisorStats,
  getActiveCalls,
  getSupervisorAgents,
  getHistoricalStats,
  type SupervisorStats,
  type ActiveCallInfo,
  type HistoricalStats,
} from './services/supervisorService';
import type { AgentSession } from './types';

interface SupervisorState {
  stats:           SupervisorStats | null;
  activeCalls:     ActiveCallInfo[];
  agents:          AgentSession[];
  loading:         boolean;
  error:           string | null;
  lastRefresh:     number | null;
  historical:      HistoricalStats | null;
  historicalLoading: boolean;
  historicalError:   string | null;
}

const initialState: SupervisorState = {
  stats:             null,
  activeCalls:       [],
  agents:            [],
  loading:           false,
  error:             null,
  lastRefresh:       null,
  historical:        null,
  historicalLoading: false,
  historicalError:   null,
};

export const fetchSupervisorData = createAsyncThunk(
  'supervisor/fetchAll',
  async () => {
    const [stats, activeCalls, agents] = await Promise.all([
      getSupervisorStats(),
      getActiveCalls(),
      getSupervisorAgents(),
    ]);
    return { stats, activeCalls, agents };
  },
);

export const fetchHistoricalStats = createAsyncThunk(
  'supervisor/fetchHistorical',
  async ({ from, to, agentId }: { from: string; to: string; agentId?: string }) =>
    getHistoricalStats(from, to, agentId),
);

const supervisorSlice = createSlice({
  name: 'supervisor',
  initialState,
  reducers: {
    wsAgentStatusChanged(state, action: { payload: { agentId: string; status: string; agentName?: string } }) {
      const { agentId, status, agentName } = action.payload;
      const agent = state.agents.find((a) => a.agentId === agentId);
      if (agent) {
        agent.status = status as AgentSession['status'];
        if (agentName) agent.agentName = agentName;
      } else {
        state.agents.push({
          agentId,
          agentName: agentName ?? null,
          status: status as AgentSession['status'],
          updatedAt: new Date().toISOString(),
        });
      }
      state.activeCalls.forEach((c) => {
        if (c.agentId === agentId) c.agentCurrentStatus = status;
      });
      if (state.stats) {
        const counts = { available: 0, busy: 0, paused: 0, offline: 0 };
        state.agents.forEach((a) => {
          if (a.status in counts) counts[a.status as keyof typeof counts]++;
        });
        state.stats.agents = {
          total:     state.agents.length,
          online:    counts.available + counts.busy + counts.paused,
          available: counts.available,
          busy:      counts.busy,
          paused:    counts.paused,
          offline:   counts.offline,
        };
      }
    },
    wsCallUpdatedSupervisor(state, action: { payload: ActiveCallInfo }) {
      const call = action.payload;
      const idx = state.activeCalls.findIndex((c) => c.id === call.id);
      if (['initiated', 'ringing', 'answered'].includes(call.status)) {
        if (idx >= 0) state.activeCalls[idx] = call;
        else state.activeCalls.push(call);
      } else {
        if (idx >= 0) state.activeCalls.splice(idx, 1);
        if (state.stats) {
          state.stats.today.activeCalls = Math.max(0, state.stats.today.activeCalls - 1);
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSupervisorData.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(fetchSupervisorData.fulfilled, (state, action) => {
        state.loading     = false;
        state.stats       = action.payload.stats;
        state.activeCalls = action.payload.activeCalls;
        state.agents      = action.payload.agents;
        state.lastRefresh = Date.now();
      })
      .addCase(fetchSupervisorData.rejected,  (state, action) => {
        state.loading = false;
        state.error   = action.error.message ?? 'Error cargando datos de supervisor';
      })
      .addCase(fetchHistoricalStats.pending,   (state) => { state.historicalLoading = true; state.historicalError = null; })
      .addCase(fetchHistoricalStats.fulfilled, (state, action) => {
        state.historicalLoading = false;
        state.historical        = action.payload;
      })
      .addCase(fetchHistoricalStats.rejected,  (state, action) => {
        state.historicalLoading = false;
        state.historicalError   = action.error.message ?? 'Error cargando histórico';
      });
  },
});

export const { wsAgentStatusChanged, wsCallUpdatedSupervisor } = supervisorSlice.actions;
export default supervisorSlice.reducer;
