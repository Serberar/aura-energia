import callsApi from './callsApi';

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';

export interface CrmFilter {
  saleStatusIds?: string[];
  productIds?: string[];
  maxResults?: number;
}

export interface Campaign {
  id:            string;
  name:          string;
  description:   string | null;
  status:        CampaignStatus;
  crmFilter:     CrmFilter | null;
  scriptId:      string | null;
  script:        { id: string; name: string } | null;
  maxAttempts:   number;
  dialListId:    string | null;
  createdBy:     string;
  totalImported: number;
  createdAt:     string;
  updatedAt:     string;
  stats:         Record<string, number> | null;
  dialerRunning: boolean;
  dialerStats:   PredictiveStats | null;
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

export interface CreateCampaignPayload {
  name:          string;
  description?:  string;
  crmFilter?:    CrmFilter;
  scriptId?:     string;
  maxAttempts?:  number;
}

export async function listCampaigns(): Promise<Campaign[]> {
  const { data } = await callsApi.get<Campaign[]>('/campaigns');
  return data;
}

export async function createCampaign(payload: CreateCampaignPayload): Promise<Campaign> {
  const { data } = await callsApi.post<Campaign>('/campaigns', payload);
  return data;
}

export async function getCampaign(id: string): Promise<Campaign> {
  const { data } = await callsApi.get<Campaign>(`/campaigns/${id}`);
  return data;
}

export async function updateCampaign(
  id: string,
  payload: Partial<CreateCampaignPayload>,
): Promise<Campaign> {
  const { data } = await callsApi.patch<Campaign>(`/campaigns/${id}`, payload);
  return data;
}

export async function reimportCampaign(
  id: string,
): Promise<{ imported: number; skipped: number; total: number }> {
  const { data } = await callsApi.post(`/campaigns/${id}/reimport`);
  return data;
}

export async function startCampaign(id: string): Promise<void> {
  await callsApi.post(`/campaigns/${id}/start`);
}

export async function stopCampaign(id: string): Promise<void> {
  await callsApi.post(`/campaigns/${id}/stop`);
}

export async function resetCampaign(id: string): Promise<void> {
  await callsApi.post(`/campaigns/${id}/reset`);
}

export async function getCampaignStatus(id: string): Promise<Campaign> {
  const { data } = await callsApi.get<Campaign>(`/campaigns/${id}/status`);
  return data;
}
