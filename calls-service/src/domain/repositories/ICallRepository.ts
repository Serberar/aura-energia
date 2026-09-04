import type { Call, CallStatus } from '../entities/Call';

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

export interface SupervisorStats {
  today: {
    total:        number;
    answered:     number;
    answerRate:   number;
    avgDuration:  number;
    activeCalls:  number;
  };
  agents: {
    total:     number;
    online:    number;
    available: number;
    busy:      number;
    paused:    number;
    offline:   number;
  };
}

export interface ActiveCallInfo extends Call {
  agentCurrentStatus?: string;
}

export interface CreateCallInput {
  id:            string;
  agentId:       string;
  clientId?:     string;
  saleId?:       string;
  clientPhone:   string;
  agendaEntryId?: string;
}

export interface UpdateCallInput {
  providerCallId?:    string;
  status?:            CallStatus;
  duration?:          number;
  recordingUrl?:      string;
  disposition?:       string;
  muted?:             boolean;
  onHold?:            boolean;
  notes?:             string;
  dispositionCodeId?: string | null;
  agentNotes?:        string;
  wrapUpStartedAt?:   Date;
  wrapUpEndedAt?:     Date;
  startedAt?:         Date;
  answeredAt?:        Date;
  endedAt?:           Date;
}

export interface ListCallsFilter {
  agentId?:           string;
  saleId?:            string;
  clientId?:          string;
  clientPhone?:       string;
  status?:            CallStatus;
  dispositionCodeId?: string | null;
  from?:              Date;
  to?:                Date;
  page?:              number;
  pageSize?:          number;
}

export interface ReviewSummaryItem {
  id:    string | null;
  label: string;
  color: string;
  count: number;
}

export interface ICallRepository {
  create(input: CreateCallInput): Promise<Call>;
  findById(id: string): Promise<Call | null>;
  findByProviderCallId(providerCallId: string): Promise<Call | null>;
  update(id: string, input: UpdateCallInput): Promise<Call>;
  list(filter: ListCallsFilter): Promise<{ data: Call[]; total: number }>;
  reviewSummary(): Promise<ReviewSummaryItem[]>;
  addEvent(callId: string, event: string, payload?: unknown): Promise<void>;
  setAgentActiveCall(agentId: string, callId: string | null): Promise<void>;
  getTodayStats(): Promise<SupervisorStats>;
  getHistoricalStats(from: Date, to: Date, agentId?: string): Promise<HistoricalStats>;
  getActiveCalls(): Promise<ActiveCallInfo[]>;
}
