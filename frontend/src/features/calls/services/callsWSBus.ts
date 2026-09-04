// Shared message bus for the calls WebSocket connection.
// Decouples the WS hook from monitor hooks without prop-drilling.

type MessageHandler = (msg: Record<string, unknown>) => void;

const listeners = new Set<MessageHandler>();
let _send: ((msg: unknown) => void) | null = null;

export const callsWSBus = {
  emit(msg: Record<string, unknown>): void {
    listeners.forEach((fn) => fn(msg));
  },
  subscribe(fn: MessageHandler): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

export function registerWSSend(fn: (msg: unknown) => void): void {
  _send = fn;
}

export function wsSend(msg: unknown): void {
  _send?.(msg);
}

export function getIceConfig(): RTCConfiguration {
  return {
    iceServers: [
      { urls: (import.meta.env.VITE_STUN_URL as string | undefined) ?? 'stun:stun.l.google.com:19302' },
      ...(import.meta.env.VITE_TURN_URL
        ? [{
            urls:       import.meta.env.VITE_TURN_URL as string,
            username:   import.meta.env.VITE_TURN_USERNAME as string,
            credential: import.meta.env.VITE_TURN_CREDENTIAL as string,
          }]
        : []),
    ],
  };
}
