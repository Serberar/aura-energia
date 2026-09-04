export type CallStatus = 'initiated' | 'ringing' | 'answered' | 'completed' | 'no_answer' | 'busy' | 'failed';
export type CallDirection = 'outbound' | 'inbound';

export interface Call {
  id:             string;
  agentId:        string;
  clientId?:      string | null;
  saleId?:        string | null;
  clientPhone:    string;
  providerCallId?: string | null;
  status:         CallStatus;
  direction:      CallDirection;
  duration?:      number | null;
  recordingUrl?:  string | null;
  disposition?:   string | null;
  muted:          boolean;
  onHold:         boolean;
  notes?:         string | null;
  dispositionCodeId?: string | null;
  agentNotes?:    string | null;
  wrapUpStartedAt?: Date | null;
  wrapUpEndedAt?:   Date | null;
  agendaEntryId?: string | null;
  startedAt?:     Date | null;
  answeredAt?:    Date | null;
  endedAt?:       Date | null;
  createdAt:      Date;
}

export const TERMINAL_STATUSES: CallStatus[] = ['completed', 'no_answer', 'busy', 'failed'];

export function isTerminal(status: CallStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}
