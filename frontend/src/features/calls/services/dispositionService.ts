import callsApi from './callsApi';

export interface DispositionCode {
  id:        string;
  label:     string;
  color:     string;
  isDefault: boolean;
  order:     number;
  active:    boolean;
}

export async function listDispositionCodes(): Promise<DispositionCode[]> {
  const { data } = await callsApi.get<DispositionCode[]>('/disposition-codes');
  return data;
}

export async function createDispositionCode(payload: { label: string; color?: string }): Promise<DispositionCode> {
  const { data } = await callsApi.post<DispositionCode>('/disposition-codes', payload);
  return data;
}

export async function deleteDispositionCode(id: string): Promise<void> {
  await callsApi.delete(`/disposition-codes/${id}`);
}
