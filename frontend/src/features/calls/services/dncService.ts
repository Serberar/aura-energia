import callsApi from './callsApi';

export interface DncEntry {
  id: string;
  phone: string;
  addedById: string;
  reason?: string | null;
  expiresAt?: string | null;
  createdAt: string;
}

export async function listDnc(): Promise<DncEntry[]> {
  const { data } = await callsApi.get<DncEntry[]>('/dnc');
  return data;
}

export async function checkDnc(phone: string): Promise<{ blocked: boolean; entry: DncEntry | null }> {
  const { data } = await callsApi.get('/dnc/check', { params: { phone } });
  return data;
}

export async function addDnc(payload: { phone: string; reason?: string; expiresAt?: string }): Promise<DncEntry> {
  const { data } = await callsApi.post<DncEntry>('/dnc', payload);
  return data;
}

export async function removeDnc(id: string): Promise<void> {
  await callsApi.delete(`/dnc/${id}`);
}
