import { WebSocketServer as WsServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import jwt from 'jsonwebtoken';
import { config } from '../../config';

interface AuthenticatedClient {
  ws:      WebSocket;
  agentId: string;
  role:    string;
}

interface JwtPayload {
  id:   string;
  role: string;
}

// Tracks active monitoring: callId → { agentId, supervisors }
interface MonitorSession {
  agentId:     string;
  supervisors: Map<string, WebSocket>; // supervisorId → ws
  mode:        string;
}

const SUPERVISOR_ROLES = new Set(['administrador', 'coordinador']);

const HEARTBEAT_INTERVAL_MS = 30_000;
const AUTH_TIMEOUT_MS       = 10_000;
const DISCONNECT_GRACE_MS   = 10_000;

export class WebSocketServer {
  private wss:          WsServer;
  private clients     = new Map<string, Set<AuthenticatedClient>>();
  private monitorSessions = new Map<string, MonitorSession>(); // callId → MonitorSession
  private disconnectHandler?: (agentId: string) => void;

  // Called once from server.ts (after agentStatusUC exists) so that when an
  // agent's last tab closes and doesn't reconnect within the grace period,
  // their status is forced to 'offline' instead of staying stuck forever.
  onAgentFullyDisconnected(fn: (agentId: string) => void): void {
    this.disconnectHandler = fn;
  }

  constructor() {
    this.wss = new WsServer({ noServer: true });
    this.wss.on('connection', (ws, req) => this.onConnection(ws, req));
    this.startHeartbeat();
  }

  private startHeartbeat(): void {
    // Track per-socket liveness via a WeakMap so we don't hold strong refs
    const aliveMap = new WeakMap<WebSocket, boolean>();

    this.wss.on('connection', (ws) => {
      aliveMap.set(ws, true);
      ws.on('pong', () => aliveMap.set(ws, true));
    });

    setInterval(() => {
      for (const set of this.clients.values()) {
        for (const { ws } of set) {
          if (ws.readyState !== WebSocket.OPEN) continue;
          if (aliveMap.get(ws) === false) {
            ws.terminate();
            continue;
          }
          aliveMap.set(ws, false);
          ws.ping();
        }
      }
    }, HEARTBEAT_INTERVAL_MS);
  }

  get server(): WsServer {
    return this.wss;
  }

  // Returns number of supervisors currently monitoring a call
  getMonitorCount(callId: string): number {
    return this.monitorSessions.get(callId)?.supervisors.size ?? 0;
  }

  private onConnection(ws: WebSocket, _req: IncomingMessage): void {
    let agentId: string | null = null;
    let role:    string        = 'agent';
    // Close connection if not authenticated within AUTH_TIMEOUT_MS
    const authTimeout = setTimeout(() => {
      if (!agentId) ws.terminate();
    }, AUTH_TIMEOUT_MS);

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString()) as Record<string, unknown>;

        // ── Authentication ──────────────────────────────────────────────────
        if (msg.type === 'auth' && typeof msg.token === 'string' && !agentId) {
          const decoded = jwt.verify(msg.token, config.jwtSecret) as JwtPayload;
          agentId = decoded.id;
          role    = decoded.role ?? 'agent';
          clearTimeout(authTimeout);

          if (!this.clients.has(agentId)) {
            this.clients.set(agentId, new Set());
          }
          this.clients.get(agentId)!.add({ ws, agentId, role });
          ws.send(JSON.stringify({ type: 'auth:ok', agentId }));
          return;
        }

        if (!agentId) return; // drop unauthenticated messages

        if (msg.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
          return;
        }

        // ── Monitor signaling ────────────────────────────────────────────────

        // Supervisor → agent: request to start monitoring
        if (msg.type === 'monitor:request') {
          if (!SUPERVISOR_ROLES.has(role)) return; // only supervisors/admins
          const { callId, agentId: targetAgentId, mode = 'silent' } = msg as {
            callId: string; agentId: string; mode?: string;
          };

          if (!this.monitorSessions.has(callId)) {
            this.monitorSessions.set(callId, {
              agentId: targetAgentId,
              supervisors: new Map(),
              mode: mode as string,
            });
          }
          const session = this.monitorSessions.get(callId)!;
          session.supervisors.set(agentId, ws);

          this.sendToAgent(targetAgentId, {
            type:         'monitor:request',
            callId,
            supervisorId: agentId,
            mode,
          });
          return;
        }

        // Agent → specific supervisor: WebRTC offer
        if (msg.type === 'monitor:offer') {
          const { callId, supervisorId, sdp } = msg as {
            callId: string; supervisorId: string; sdp: unknown;
          };
          this.sendToAgent(supervisorId, { type: 'monitor:offer', callId, sdp });
          return;
        }

        // Supervisor → agent: WebRTC answer
        if (msg.type === 'monitor:answer') {
          const { callId, sdp } = msg as { callId: string; sdp: unknown };
          const session = this.monitorSessions.get(callId);
          if (session) {
            this.sendToAgent(session.agentId, {
              type:         'monitor:answer',
              callId,
              supervisorId: agentId,
              sdp,
            });
          }
          return;
        }

        // ICE candidates — bidirectional
        if (msg.type === 'monitor:ice') {
          const { callId, candidate, target, supervisorId } = msg as {
            callId: string; candidate: unknown; target: 'agent' | 'supervisor'; supervisorId?: string;
          };
          if (target === 'agent') {
            const session = this.monitorSessions.get(callId);
            if (session) {
              this.sendToAgent(session.agentId, {
                type:         'monitor:ice',
                callId,
                candidate,
                supervisorId: agentId,
              });
            }
          } else if (supervisorId) {
            this.sendToAgent(supervisorId, { type: 'monitor:ice', callId, candidate });
          }
          return;
        }

        // Agent → supervisor: monitoring accepted
        if (msg.type === 'monitor:accepted') {
          const { callId, supervisorId } = msg as { callId: string; supervisorId: string };
          this.sendToAgent(supervisorId, { type: 'monitor:accepted', callId });
          return;
        }

        // Agent → supervisor: monitoring rejected
        if (msg.type === 'monitor:rejected') {
          const { callId, supervisorId, reason } = msg as {
            callId: string; supervisorId: string; reason?: string;
          };
          this.sendToAgent(supervisorId, { type: 'monitor:rejected', callId, reason });
          const session = this.monitorSessions.get(callId);
          session?.supervisors.delete(supervisorId);
          return;
        }

        // Either side ends monitoring
        if (msg.type === 'monitor:end') {
          const { callId, supervisorId } = msg as { callId: string; supervisorId?: string };
          const session = this.monitorSessions.get(callId);
          if (!session) return;

          if (SUPERVISOR_ROLES.has(role)) {
            // Supervisor stopped listening → notify agent
            this.sendToAgent(session.agentId, {
              type:         'monitor:end',
              callId,
              supervisorId: agentId,
            });
            session.supervisors.delete(agentId);
            if (session.supervisors.size === 0) this.monitorSessions.delete(callId);
          } else {
            // Agent ended call → notify all supervisors monitoring this call
            for (const [supId] of session.supervisors) {
              this.sendToAgent(supId, { type: 'monitor:end', callId });
            }
            this.monitorSessions.delete(callId);
          }
          return;
        }

      } catch {
        // Mensaje malformado — ignorar
      }
    });

    ws.on('close', () => {
      clearTimeout(authTimeout);
      if (!agentId) return;
      const disconnectedAgentId = agentId;

      const set = this.clients.get(disconnectedAgentId);
      if (set) {
        for (const c of set) {
          if (c.ws === ws) { set.delete(c); break; }
        }
        if (set.size === 0) {
          this.clients.delete(disconnectedAgentId);
          // Grace period: a page refresh or brief network blip closes and
          // reopens the socket within a second or two. Only declare the agent
          // offline if no tab has reconnected by the time this fires.
          setTimeout(() => {
            if (!this.clients.has(disconnectedAgentId)) {
              this.disconnectHandler?.(disconnectedAgentId);
            }
          }, DISCONNECT_GRACE_MS);
        }
      }

      // Clean up any monitor sessions this supervisor was in
      if (SUPERVISOR_ROLES.has(role)) {
        for (const [callId, session] of this.monitorSessions) {
          if (session.supervisors.has(agentId)) {
            session.supervisors.delete(agentId);
            this.sendToAgent(session.agentId, {
              type: 'monitor:end', callId, supervisorId: agentId,
            });
            if (session.supervisors.size === 0) this.monitorSessions.delete(callId);
          }
        }
      }
    });
  }

  sendToAgent(agentId: string, payload: unknown): void {
    const set = this.clients.get(agentId);
    if (!set) return;
    const msg = JSON.stringify(payload);
    for (const { ws } of set) {
      if (ws.readyState === WebSocket.OPEN) ws.send(msg);
    }
  }

  broadcast(payload: unknown): void {
    const msg = JSON.stringify(payload);
    for (const set of this.clients.values()) {
      for (const { ws } of set) {
        if (ws.readyState === WebSocket.OPEN) ws.send(msg);
      }
    }
  }
}
