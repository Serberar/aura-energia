import callsApi from './callsApi';

export type DialListStatus = 'draft' | 'active' | 'paused' | 'completed';
export type DialEntryStatus = 'pending' | 'calling' | 'called' | 'skipped' | 'dnc';

export interface DialList {
  id: string;
  name: string;
  status: DialListStatus;
  createdAt: string;
  updatedAt: string;
  _count?: { entries: number };
}

export interface DialListEntry {
  id: string;
  listId: string;
  phone: string;
  clientId?: string | null;
  saleId?: string | null;
  clientName?: string | null;
  notes?: string | null;
  status: DialEntryStatus;
  attempts: number;
  lastCallId?: string | null;
  lastAttemptAt?: string | null;
  nextAttemptAt?: string | null;
  createdAt: string;
}

export interface OrphanList {
  id:           string;
  name:         string;
  status:       DialListStatus;
  stats:        Record<string, number> | null;
  dialerRunning: boolean;
  dialerStats:  PredictiveStats | null;
  createdAt:    string;
  updatedAt:    string;
}

export async function getOrphanDialLists(): Promise<OrphanList[]> {
  const { data } = await callsApi.get<OrphanList[]>('/dial-lists/orphan');
  return data;
}

export async function listDialLists(): Promise<DialList[]> {
  const { data } = await callsApi.get<DialList[]>('/dial-lists');
  return data;
}

export async function createDialList(name: string): Promise<DialList> {
  const { data } = await callsApi.post<DialList>('/dial-lists', { name });
  return data;
}

export async function updateDialList(id: string, payload: { name?: string; status?: DialListStatus }): Promise<DialList> {
  const { data } = await callsApi.patch<DialList>(`/dial-lists/${id}`, payload);
  return data;
}

export async function deleteDialList(id: string): Promise<void> {
  await callsApi.delete(`/dial-lists/${id}`);
}

export async function getDialListEntries(listId: string, status?: DialEntryStatus): Promise<DialListEntry[]> {
  const { data } = await callsApi.get<DialListEntry[]>(`/dial-lists/${listId}/entries`, { params: status ? { status } : {} });
  return data;
}

export async function addDialListEntries(listId: string, entries: { phone: string; clientName?: string; notes?: string }[]): Promise<{ created: number }> {
  const { data } = await callsApi.post(`/dial-lists/${listId}/entries`, { entries });
  return data;
}

export async function getNextEntry(listId: string): Promise<DialListEntry | null> {
  const { data } = await callsApi.get<DialListEntry | null>(`/dial-lists/${listId}/next`);
  return data;
}

export async function skipEntry(listId: string, entryId: string): Promise<DialListEntry> {
  const { data } = await callsApi.post<DialListEntry>(`/dial-lists/${listId}/entries/${entryId}/skip`);
  return data;
}

export async function markCalled(listId: string, entryId: string, payload: { callId?: string; nextAttemptAt?: string }): Promise<DialListEntry> {
  const { data } = await callsApi.post<DialListEntry>(`/dial-lists/${listId}/entries/${entryId}/called`, payload);
  return data;
}

export async function getDialListStats(listId: string): Promise<Record<string, number>> {
  const { data } = await callsApi.get<Record<string, number>>(`/dial-lists/${listId}/stats`);
  return data;
}

export interface PredictiveStats {
  listId:      string;
  running:     boolean;
  dialed:      number;
  answered:    number;
  dropped:     number;
  amdDetected: number;
  inFlight:    number;
  dropRate:    number;
  answerRate:  number;
  availAgents: number;
  multiplier:  number;
}

export async function startPredictive(listId: string): Promise<PredictiveStats> {
  const { data } = await callsApi.post<PredictiveStats>(`/dial-lists/${listId}/predictive/start`);
  return data;
}

export async function stopPredictive(listId: string): Promise<void> {
  await callsApi.post(`/dial-lists/${listId}/predictive/stop`);
}

export async function getPredictiveStatus(listId: string): Promise<PredictiveStats> {
  const { data } = await callsApi.get<PredictiveStats>(`/dial-lists/${listId}/predictive/status`);
  return data;
}
