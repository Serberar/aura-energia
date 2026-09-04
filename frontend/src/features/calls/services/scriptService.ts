import callsApi from './callsApi';

export interface CallScript {
  id: string;
  name: string;
  content: string;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function listScripts(): Promise<CallScript[]> {
  const { data } = await callsApi.get<CallScript[]>('/scripts');
  return data;
}

export async function createScript(payload: { name: string; content: string; order?: number }): Promise<CallScript> {
  const { data } = await callsApi.post<CallScript>('/scripts', payload);
  return data;
}

export async function updateScript(id: string, payload: Partial<{ name: string; content: string; order: number; active: boolean }>): Promise<CallScript> {
  const { data } = await callsApi.put<CallScript>(`/scripts/${id}`, payload);
  return data;
}

export async function deleteScript(id: string): Promise<void> {
  await callsApi.delete(`/scripts/${id}`);
}
