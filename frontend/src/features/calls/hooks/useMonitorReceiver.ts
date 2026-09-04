import { useEffect, useRef, useState, useCallback } from 'react';
import { callsWSBus, wsSend, getIceConfig } from '../services/callsWSBus';

export type MonitorStatus = 'connecting' | 'connected' | 'error';

interface ActiveMonitor {
  pc:            RTCPeerConnection;
  audio:         HTMLAudioElement;
  mode:          'silent' | 'whisper';
  whisperStream: MediaStream | null;
}

// Supervisor-side hook: sends monitor requests to agents and receives their audio
// via WebRTC. Supports silent listening and whisper mode (supervisor speaks to agent).
export function useMonitorReceiver() {
  const monitorsRef = useRef<Map<string, ActiveMonitor>>(new Map());
  const [statuses, setStatuses] = useState<Record<string, MonitorStatus>>({});

  useEffect(() => {
    const unsub = callsWSBus.subscribe(async (msg) => {

      // ── Agent sends WebRTC offer ────────────────────────────────────────
      if (msg.type === 'monitor:offer') {
        const { callId, sdp } = msg as { callId: string; sdp: RTCSessionDescriptionInit };
        const monitor = monitorsRef.current.get(callId);
        if (!monitor) return;

        await monitor.pc.setRemoteDescription(new RTCSessionDescription(sdp));

        // In whisper mode: add supervisor's mic track before answering
        if (monitor.mode === 'whisper') {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            monitor.whisperStream = stream;
            for (const track of stream.getTracks()) {
              monitor.pc.addTrack(track, stream);
            }
          } catch (err) {
            console.warn('[useMonitorReceiver] Cannot access mic for whisper:', err);
          }
        }

        const answer = await monitor.pc.createAnswer();
        await monitor.pc.setLocalDescription(answer);
        wsSend({ type: 'monitor:answer', callId, sdp: answer });
      }

      // ── ICE candidate from agent (no supervisorId field) ───────────────
      if (msg.type === 'monitor:ice' && !msg.supervisorId) {
        const { callId, candidate } = msg as { callId: string; candidate: RTCIceCandidateInit };
        const monitor = monitorsRef.current.get(callId);
        if (monitor && candidate) {
          await monitor.pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      }

      // ── Agent accepted ──────────────────────────────────────────────────
      if (msg.type === 'monitor:accepted') {
        const { callId } = msg as { callId: string };
        setStatuses((prev) => ({ ...prev, [callId]: 'connected' }));
      }

      // ── Agent rejected ──────────────────────────────────────────────────
      if (msg.type === 'monitor:rejected') {
        const { callId } = msg as { callId: string };
        cleanup(callId);
        setStatuses((prev) => {
          const next = { ...prev };
          delete next[callId];
          return next;
        });
      }

      // ── Call ended or agent terminated monitoring ───────────────────────
      if (msg.type === 'monitor:end' && !msg.supervisorId) {
        const { callId } = msg as { callId: string };
        cleanup(callId);
        setStatuses((prev) => {
          const next = { ...prev };
          delete next[callId];
          return next;
        });
      }
    });

    return unsub;
  }, []);

  const startListening = useCallback((
    callId:  string,
    agentId: string,
    mode:    'silent' | 'whisper' = 'silent',
  ) => {
    if (monitorsRef.current.has(callId)) return;

    const pc    = new RTCPeerConnection(getIceConfig());
    const audio = new Audio();
    audio.autoplay = true;

    // Receive agent's audio stream
    pc.ontrack = (event) => {
      audio.srcObject = event.streams[0] ?? null;
    };

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        wsSend({ type: 'monitor:ice', callId, candidate: candidate.toJSON(), target: 'agent' });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') {
        cleanup(callId);
        setStatuses((prev) => {
          const next = { ...prev };
          delete next[callId];
          return next;
        });
      }
    };

    monitorsRef.current.set(callId, { pc, audio, mode, whisperStream: null });
    setStatuses((prev) => ({ ...prev, [callId]: 'connecting' }));
    wsSend({ type: 'monitor:request', callId, agentId, mode });
  }, []);

  const stopListening = useCallback((callId: string) => {
    wsSend({ type: 'monitor:end', callId });
    cleanup(callId);
    setStatuses((prev) => {
      const next = { ...prev };
      delete next[callId];
      return next;
    });
  }, []);

  function cleanup(callId: string) {
    const monitor = monitorsRef.current.get(callId);
    if (!monitor) return;
    monitor.pc.close();
    monitor.audio.srcObject = null;
    monitor.whisperStream?.getTracks().forEach((t) => t.stop());
    monitorsRef.current.delete(callId);
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      for (const callId of Array.from(monitorsRef.current.keys())) cleanup(callId);
    };
  }, []);

  return { statuses, startListening, stopListening };
}
