export const CALLS_ENDPOINTS = {
  INITIATE:  '/calls/initiate',
  HANGUP:    (callId: string) => `/calls/${callId}/hangup`,
  MUTE:      (callId: string) => `/calls/${callId}/mute`,
  HOLD:      (callId: string) => `/calls/${callId}/hold`,
  DTMF:      (callId: string) => `/calls/${callId}/dtmf`,
  NOTES:     (callId: string) => `/calls/${callId}/notes`,
  WRAPUP:    (callId: string) => `/calls/${callId}/wrapup`,
  LIST:      '/calls',
  BY_ID:     (callId: string) => `/calls/${callId}`,
  AGENT_ME:     '/agents/me',
  AGENT_STATUS: '/agents/me/status',
} as const;

export const AGENDA_ENDPOINTS = {
  LIST:   '/agenda',
  CREATE: '/agenda',
  UPDATE: (id: string) => `/agenda/${id}`,
  DELETE: (id: string) => `/agenda/${id}`,
} as const;
