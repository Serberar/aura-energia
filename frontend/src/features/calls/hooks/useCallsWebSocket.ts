import { useEffect, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { wsCallUpdated, wsCallEnded, setWsConnected, wsReminderReceived, wsIncomingCall, wsQueueChanged, wsQueueRemoved, wsPredictiveStats } from '../callsSlice';
import { wsAgentStatusChanged, wsCallUpdatedSupervisor } from '../supervisorSlice';
import type { Call, CallStatus, AgendaEntry } from '../types';
import type { ActiveCallInfo } from '../services/supervisorService';
import { callsWSBus, registerWSSend } from '../services/callsWSBus';

const TERMINAL: CallStatus[] = ['completed', 'no_answer', 'busy', 'failed'];

function isTerminal(status: CallStatus): boolean {
  return TERMINAL.includes(status);
}

export function useCallsWebSocket() {
  const dispatch  = useAppDispatch();
  const token     = useAppSelector((s) => s.auth.accessToken);
  const wsRef     = useRef<WebSocket | null>(null);
  const reconnect = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (!token) return;
    const wsUrl = import.meta.env.VITE_CALLS_WS_URL ?? 'ws://localhost:3003/ws';
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'auth', token }));
      registerWSSend((msg) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(msg));
        }
      });
    };

    ws.onmessage = (event: MessageEvent<string>) => {
      try {
        const msg = JSON.parse(event.data) as {
          type:     string;
          call?:    Call;
          entry?:   Partial<AgendaEntry>;
          agentId?: string;
          status?:  string;
          agentName?: string | null;
          pauseReason?: string | null;
          updatedAt?: string;
        };

        // Route all messages through the bus so monitor hooks can react
        callsWSBus.emit(msg as Record<string, unknown>);

        if (msg.type === 'auth:ok') {
          dispatch(setWsConnected(true));
          return;
        }

        if (msg.call && msg.type.startsWith('call:')) {
          const call = msg.call;
          if (isTerminal(call.status)) {
            dispatch(wsCallEnded(call));
          } else {
            dispatch(wsCallUpdated(call));
          }
          dispatch(wsCallUpdatedSupervisor(call as unknown as ActiveCallInfo));
          return;
        }

        if (msg.type === 'agent:status-changed' && msg.agentId && msg.status) {
          dispatch(wsAgentStatusChanged({
            agentId: msg.agentId,
            status: msg.status,
            agentName: msg.agentName ?? undefined,
            pauseReason: msg.pauseReason ?? null,
            updatedAt: msg.updatedAt,
          }));
          return;
        }

        if (msg.type === 'agenda:reminder' && msg.entry) {
          dispatch(wsReminderReceived({
            id:         msg.entry.id ?? crypto.randomUUID(),
            entry:      msg.entry as never,
            receivedAt: new Date().toISOString(),
          }));
        }

        if (msg.type === 'call:incoming') {
          dispatch(wsIncomingCall(msg as any));
        }

        if (msg.type === 'queue:call-added') {
          dispatch(wsQueueChanged(msg as any));
        }

        if (msg.type === 'queue:call-removed' || msg.type === 'call:answered' || msg.type === 'call:rejected') {
          const callId = (msg as any).callId as string | undefined;
          if (callId) dispatch(wsQueueRemoved(callId));
        }

        if (msg.type === 'predictive:stats') {
          dispatch(wsPredictiveStats(msg as any));
        }
      } catch {
        // ignore malformed frames
      }
    };

    ws.onclose = () => {
      dispatch(setWsConnected(false));
      reconnect.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [token, dispatch]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnect.current) clearTimeout(reconnect.current);
      wsRef.current?.close();
    };
  }, [connect]);
}
