import type { AgendaEntry, AgendaStatus, Priority } from '../entities/AgendaEntry';

export interface CreateAgendaInput {
  agentId:     string;
  clientId?:   string;
  saleId?:     string;
  clientPhone: string;
  clientName?: string;
  scheduledAt: Date;
  reminderAt?: Date;
  notes?:      string;
  priority?:   Priority;
}

export interface UpdateAgendaInput {
  scheduledAt?: Date;
  reminderAt?:  Date | null;
  notes?:       string;
  status?:      AgendaStatus;
  priority?:    Priority;
}

export interface IAgendaRepository {
  create(input: CreateAgendaInput): Promise<AgendaEntry>;
  findById(id: string): Promise<AgendaEntry | null>;
  update(id: string, input: UpdateAgendaInput): Promise<AgendaEntry>;
  delete(id: string): Promise<void>;
  listByAgent(agentId: string, filter?: { status?: AgendaStatus }): Promise<AgendaEntry[]>;
  findDueReminders(now: Date): Promise<AgendaEntry[]>;
  clearReminder(id: string): Promise<void>;
}
