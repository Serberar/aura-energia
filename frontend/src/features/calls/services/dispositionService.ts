import callsApi from './callsApi';

export interface DispositionCode {
  id:        string;
  label:     string;
  color:     string;
  isDefault: boolean;
  marksSaleClosed: boolean;
  order:     number;
  active:    boolean;
}

export async function listDispositionCodes(): Promise<DispositionCode[]> {
  const { data } = await callsApi.get<DispositionCode[]>('/disposition-codes');
  return data;
}

export async function createDispositionCode(payload: { label: string; color?: string; isDefault?: boolean; marksSaleClosed?: boolean }): Promise<DispositionCode> {
  const { data } = await callsApi.post<DispositionCode>('/disposition-codes', payload);
  return data;
}

export async function deleteDispositionCode(id: string): Promise<void> {
  await callsApi.delete(`/disposition-codes/${id}`);
}

export interface WrapUpPayload {
  dispositionCodeId?: string;
  agentNotes?: string;
  wrapUpStartedAt?: string;
}

export async function submitWrapUp(callId: string, payload: WrapUpPayload): Promise<unknown> {
  const { data } = await callsApi.patch(`/calls/${callId}/wrapup`, payload);
  return data;
}
