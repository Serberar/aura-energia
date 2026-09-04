import callsApi from './callsApi';

export interface HourlyBucket {
  hour: number;
  total: number;
  answered: number;
}

export interface DispositionBucket {
  label: string;
  color: string;
  count: number;
}

export interface AgentRankEntry {
  agentId: string;
  total: number;
  answered: number;
  avgDuration: number;
}

export interface DailyBucket {
  date: string;
  total: number;
  answered: number;
}

export interface HistoricalStats {
  period: { from: string; to: string };
  total: number;
  answered: number;
  answerRate: number;
  avgDuration: number;
  hourlyDistribution: HourlyBucket[];
  dispositionBreakdown: DispositionBucket[];
  agentRanking: AgentRankEntry[];
  dailyTrend: DailyBucket[];
}

export interface ReportFilter {
  from?: string;
  to?: string;
  agentId?: string;
}

export async function getHistoricalStats(params?: ReportFilter): Promise<HistoricalStats> {
  const { data } = await callsApi.get<HistoricalStats>('/supervisor/stats/historical', { params });
  return data;
}
