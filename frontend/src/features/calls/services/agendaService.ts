import callsApi from './callsApi';
import { AGENDA_ENDPOINTS } from './api';
import type { AgendaEntry, AgendaStatus, Priority } from '../types';

export interface CreateAgendaPayload {
  clientPhone: string;
  clientId?: string;
  saleId?: string;
  clientName?: string;
  scheduledAt: string;
  reminderAt?: string;
  notes?: string;
  priority?: Priority;
}

export interface UpdateAgendaPayload {
  scheduledAt?: string;
  reminderAt?: string | null;
  notes?: string;
  status?: AgendaStatus;
  priority?: Priority;
}

export async function listAgenda(params?: { status?: AgendaStatus }): Promise<AgendaEntry[]> {
  const { data } = await callsApi.get<AgendaEntry[]>(AGENDA_ENDPOINTS.LIST, { params });
  return data;
}

export async function createAgendaEntry(payload: CreateAgendaPayload): Promise<AgendaEntry> {
  const { data } = await callsApi.post<AgendaEntry>(AGENDA_ENDPOINTS.CREATE, payload);
  return data;
}

export async function updateAgendaEntry(id: string, payload: UpdateAgendaPayload): Promise<AgendaEntry> {
  const { data } = await callsApi.patch<AgendaEntry>(AGENDA_ENDPOINTS.UPDATE(id), payload);
  return data;
}

export async function deleteAgendaEntry(id: string): Promise<void> {
  await callsApi.delete(AGENDA_ENDPOINTS.DELETE(id));
}
