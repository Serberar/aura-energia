export type AgentStatus = 'offline' | 'available' | 'busy' | 'paused';

export interface AgentSession {
  agentId:      string;
  agentName?:   string | null;
  status:       AgentStatus;
  extension?:   string | null;
  activeCallId?: string | null;
  updatedAt:    Date;
}
