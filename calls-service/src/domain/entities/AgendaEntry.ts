export type AgendaStatus = 'pending' | 'called' | 'cancelled' | 'rescheduled';
export type Priority = 'low' | 'normal' | 'high';

export interface AgendaEntry {
  id:          string;
  agentId:     string;
  clientId?:   string | null;
  saleId?:     string | null;
  clientPhone: string;
  clientName?: string | null;
  scheduledAt: Date;
  reminderAt?: Date | null;
  notes?:      string | null;
  status:      AgendaStatus;
  priority:    Priority;
  createdAt:   Date;
  updatedAt:   Date;
}
