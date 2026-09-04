import callsApi from './callsApi';
import { CALLS_ENDPOINTS } from './api';
import type { Call, AgentStatus, PauseLog } from '../types';

export interface InitiateCallPayload {
  clientPhone: string;
  clientId?: string;
  saleId?: string;
  record?: boolean;
}

export interface CallListResult {
  data: Call[];
  total: number;
  page: number;
  pageSize: number;
}

export async function initiateCall(payload: InitiateCallPayload): Promise<Call> {
  const { data } = await callsApi.post<Call>(CALLS_ENDPOINTS.INITIATE, payload);
  return data;
}

export async function hangUpCall(callId: string): Promise<void> {
  await callsApi.post(CALLS_ENDPOINTS.HANGUP(callId));
}

export interface CallsFilter {
  page?:        number;
  pageSize?:    number;
  saleId?:      string;
  clientId?:    string;
  clientPhone?: string;
  status?:      string;
  from?:        string;
  to?:          string;
}

export async function listCalls(params?: CallsFilter): Promise<CallListResult> {
  const { data } = await callsApi.get<CallListResult>(CALLS_ENDPOINTS.LIST, { params });
  return data;
}

export function buildExportUrl(params: CallsFilter): string {
  const base = (callsApi.defaults.baseURL ?? '') + '/calls/export';
  const q    = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null) as [string, string][]);
  return q.toString() ? `${base}?${q}` : base;
}

export async function setAgentStatus(status: AgentStatus, pauseReason?: string): Promise<void> {
  await callsApi.patch(CALLS_ENDPOINTS.AGENT_STATUS, { status, ...(pauseReason ? { pauseReason } : {}) });
}

export async function getMyPauseLogs(): Promise<PauseLog[]> {
  const { data } = await callsApi.get<PauseLog[]>('/agents/me/pauses');
  return data;
}

export async function muteCall(callId: string): Promise<Call> {
  const { data } = await callsApi.post<Call>(CALLS_ENDPOINTS.MUTE(callId));
  return data;
}

export async function holdCall(callId: string): Promise<Call> {
  const { data } = await callsApi.post<Call>(CALLS_ENDPOINTS.HOLD(callId));
  return data;
}

export async function sendDtmf(callId: string, digit: string): Promise<void> {
  await callsApi.post(CALLS_ENDPOINTS.DTMF(callId), { digit });
}

export async function saveCallNotes(callId: string, text: string): Promise<Call> {
  const { data } = await callsApi.post<Call>(CALLS_ENDPOINTS.NOTES(callId), { text });
  return data;
}
