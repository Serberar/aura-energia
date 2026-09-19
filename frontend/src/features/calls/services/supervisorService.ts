import callsApi from './callsApi';
import type { AgentSession, PauseLog } from '../types';

export interface SupervisorStats {
  today: {
    total:       number;
    answered:    number;
    answerRate:  number;
    avgDuration: number;
    activeCalls: number;
  };
  agents: {
    total:     number;
    online:    number;
    available: number;
    busy:      number;
    paused:    number;
    offline:   number;
  };
}

export interface ActiveCallInfo {
  id:                 string;
  agentId:            string;
  agentName?:         string | null;
  clientPhone:        string;
  status:             string;
  direction:          string;
  startedAt:          string | null;
  answeredAt:         string | null;
  agentCurrentStatus: string;
  monitorCount?:      number;
}

export interface HourlyBucket   { hour: number; total: number; answered: number; }
export interface DailyBucket    { date: string; total: number; answered: number; }
export interface DispositionBucket { label: string; color: string; count: number; }
export interface AgentRankEntry { agentId: string; total: number; answered: number; avgDuration: number; }

export interface HistoricalStats {
  period:               { from: string; to: string };
  total:                number;
  answered:             number;
  answerRate:           number;
  avgDuration:          number;
  hourlyDistribution:   HourlyBucket[];
  dispositionBreakdown: DispositionBucket[];
  agentRanking:         AgentRankEntry[];
  dailyTrend:           DailyBucket[];
}

export const getSupervisorStats    = (): Promise<SupervisorStats> =>
  callsApi.get<SupervisorStats>('/supervisor/stats').then((r) => r.data);

export const getActiveCalls        = (): Promise<ActiveCallInfo[]> =>
  callsApi.get<ActiveCallInfo[]>('/supervisor/active-calls').then((r) => r.data);

export const getSupervisorAgents   = (): Promise<AgentSession[]> =>
  callsApi.get<AgentSession[]>('/supervisor/agents').then((r) => r.data);

export interface AgentCallDetail {
  id:               string;
  agentId:          string;
  clientPhone:      string;
  status:           string;
  direction:        string;
  duration:         number | null;
  agentNotes:       string | null;
  wrapUpStartedAt:  string | null;
  wrapUpEndedAt:    string | null;
  recordingUrl:     string | null;
  agentRecordingUrl: string | null;
  createdAt:        string;
  dispositionCode?: { label: string; color: string } | null;
}

export const getAgentCalls = (
  agentId: string,
  params: { page?: number; pageSize?: number; from?: string; to?: string },
): Promise<{ data: AgentCallDetail[]; total: number }> =>
  callsApi
    .get<{ data: AgentCallDetail[]; total: number }>(`/supervisor/agents/${agentId}/calls`, { params })
    .then((r) => r.data);

export const getAgentPauseLogs = (agentId: string): Promise<PauseLog[]> =>
  callsApi.get<PauseLog[]>(`/agents/${agentId}/pauses`).then((r) => r.data);

export const getHistoricalStats = (
  from: string,
  to: string,
  agentId?: string,
): Promise<HistoricalStats> =>
  callsApi
    .get<HistoricalStats>('/supervisor/stats/historical', {
      params: { from, to, ...(agentId ? { agentId } : {}) },
    })
    .then((r) => r.data);
