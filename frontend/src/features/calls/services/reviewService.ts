import callsApi from './callsApi';
import type { Call } from '../types';

export interface ReviewSummaryItem {
  id:    string | null;
  label: string;
  color: string;
  count: number;
}

export async function getReviewSummary(): Promise<ReviewSummaryItem[]> {
  const { data } = await callsApi.get<ReviewSummaryItem[]>('/calls/review/summary');
  return data;
}

export async function getCallsByDisposition(
  dispositionCodeId: string | null,
  page = 1,
  pageSize = 50,
): Promise<{ data: Call[]; total: number }> {
  const { data } = await callsApi.get('/calls', {
    params: { dispositionCodeId: dispositionCodeId ?? 'null', page, pageSize },
  });
  return data;
}

export async function bulkAddDnc(phones: string[], reason?: string): Promise<{ added: number }> {
  const { data } = await callsApi.post('/dnc/bulk', { phones, reason });
  return data;
}
