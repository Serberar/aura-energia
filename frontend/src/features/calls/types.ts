export type CallStatus =
  | 'initiated' | 'ringing' | 'answered'
  | 'completed' | 'no_answer' | 'busy' | 'failed';

export type AgentStatus = 'offline' | 'available' | 'busy' | 'paused';
export type PauseReason = 'break' | 'lunch' | 'admin' | 'training' | 'personal';

export interface PauseLog {
  id: string;
  agentId: string;
  reason: PauseReason;
  startedAt: string;
  endedAt: string | null;
  duration: number | null;
}

export interface DispositionCode {
  id:        string;
  label:     string;
  color:     string;
  isDefault: boolean;
  order:     number;
  active:    boolean;
}

export interface Call {
  id: string;
  agentId: string;
  clientPhone: string;
  clientId?: string | null;
  saleId?: string | null;
  status: CallStatus;
  direction: 'outbound' | 'inbound';
  duration?: number | null;
  recordingUrl?: string | null;
  muted: boolean;
  onHold: boolean;
  notes?: string | null;
  dispositionCodeId?: string | null;
  agentNotes?: string | null;
  wrapUpStartedAt?: string | null;
  wrapUpEndedAt?: string | null;
  startedAt: string;
  answeredAt?: string | null;
  endedAt?: string | null;
  createdAt: string;
}

export interface AgentSession {
  agentId:   string;
  agentName?: string | null;
  status:    AgentStatus;
  updatedAt: string;
}

export type AgendaStatus = 'pending' | 'called' | 'cancelled' | 'rescheduled';
export type Priority = 'low' | 'normal' | 'high';

export interface AgendaEntry {
  id:          string;
  agentId:     string;
  clientId?:   string | null;
  saleId?:     string | null;
  clientPhone: string;
  clientName?: string | null;
  scheduledAt: string;
  reminderAt?: string | null;
  notes?:      string | null;
  status:      AgendaStatus;
  priority:    Priority;
  createdAt:   string;
  updatedAt:   string;
}

export interface ReminderNotification {
  id: string;
  entry: Omit<AgendaEntry, 'agentId' | 'status' | 'createdAt' | 'updatedAt'>;
  receivedAt: string;
}

export interface IncomingCallNotification {
  callId: string;
  from: string;
  to: string;
  agentId: string;
}

export interface QueueEntry {
  callId: string;
  fromPhone: string;
  position: number;
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

export interface CallsState {
  activeCall: Call | null;
  pendingWrapUp: Call | null;
  incomingCall: IncomingCallNotification | null;
  queueEntries: QueueEntry[];
  predictiveStats: PredictiveStats | null;
  callHistory: Call[];
  total: number;
  agendaEntries: AgendaEntry[];
  reminders: ReminderNotification[];
  loading: boolean;
  error: string | null;
  wsConnected: boolean;
  agentStatus: AgentStatus;
  dialerOpen: boolean;
  demoActive: boolean;
}
