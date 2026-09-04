import { useEffect, useRef } from 'react';
import { callsWSBus, wsSend, getIceConfig } from '../services/callsWSBus';

interface MonitorPeer {
  pc:           RTCPeerConnection;
  whisperAudio: HTMLAudioElement | null;
}

// Agent-side hook: handles incoming monitor:request from supervisors,
// creates a WebRTC peer connection that shares the agent's audio.
// For whisper mode the supervisor's voice plays back to the agent via ontrack.
export function useMonitorPeer(
  activeCallId:  string | null,
  audioStreamRef: React.RefObject<MediaStream | null>,
) {
  // supervisorId → MonitorPeer
  const peersRef = useRef<Map<string, MonitorPeer>>(new Map());

  useEffect(() => {
    const unsub = callsWSBus.subscribe(async (msg) => {
      if (!activeCallId) return;

      // ── Supervisor requests monitoring ──────────────────────────────────
      if (msg.type === 'monitor:request') {
        const { callId, supervisorId, mode } = msg as {
          callId: string; supervisorId: string; mode: string;
        };
        if (callId !== activeCallId || peersRef.current.has(supervisorId)) return;

        const pc = new RTCPeerConnection(getIceConfig());

        // Share agent's microphone with the supervisor
        const stream = audioStreamRef.current;
        if (stream) {
          for (const track of stream.getTracks()) {
            pc.addTrack(track, stream);
          }
        }

        // For whisper: play supervisor's voice in agent's headphones
        let whisperAudio: HTMLAudioElement | null = null;
        if (mode === 'whisper') {
          pc.ontrack = (event) => {
            if (!whisperAudio) {
              whisperAudio = new Audio();
              whisperAudio.autoplay = true;
            }
            whisperAudio.srcObject = event.streams[0] ?? null;
            const peer = peersRef.current.get(supervisorId);
            if (peer) peer.whisperAudio = whisperAudio;
          };
        }

        pc.onicecandidate = ({ candidate }) => {
          if (candidate) {
            wsSend({
              type:         'monitor:ice',
              callId,
              candidate:    candidate.toJSON(),
              target:       'supervisor',
              supervisorId,
            });
          }
        };

        peersRef.current.set(supervisorId, { pc, whisperAudio: null });

        // offerToReceiveAudio lets the supervisor send whisper audio back
        const offer = await pc.createOffer({ offerToReceiveAudio: mode === 'whisper' });
        await pc.setLocalDescription(offer);
        wsSend({ type: 'monitor:offer',    callId, supervisorId, sdp: offer });
        wsSend({ type: 'monitor:accepted', callId, supervisorId });
      }

      // ── Supervisor's WebRTC answer ──────────────────────────────────────
      if (msg.type === 'monitor:answer') {
        const { callId, supervisorId, sdp } = msg as {
          callId: string; supervisorId: string; sdp: RTCSessionDescriptionInit;
        };
        if (callId !== activeCallId) return;
        const peer = peersRef.current.get(supervisorId);
        if (peer) await peer.pc.setRemoteDescription(new RTCSessionDescription(sdp));
      }

      // ── ICE candidate from supervisor (has supervisorId field) ──────────
      if (msg.type === 'monitor:ice' && typeof msg.supervisorId === 'string') {
        const { callId, candidate, supervisorId } = msg as {
          callId: string; candidate: RTCIceCandidateInit; supervisorId: string;
        };
        if (callId !== activeCallId) return;
        const peer = peersRef.current.get(supervisorId);
        if (peer && candidate) {
          await peer.pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      }

      // ── Supervisor stopped monitoring ───────────────────────────────────
      if (msg.type === 'monitor:end' && typeof msg.supervisorId === 'string') {
        const { callId, supervisorId } = msg as { callId: string; supervisorId: string };
        if (callId !== activeCallId) return;
        closePeer(supervisorId);
      }
    });

    return unsub;
  // audioStreamRef is a ref — intentionally omitted from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCallId]);

  // Clean up all peers when call ends
  useEffect(() => {
    if (!activeCallId) {
      for (const supervisorId of Array.from(peersRef.current.keys())) {
        closePeer(supervisorId);
      }
    }
  }, [activeCallId]);

  function closePeer(supervisorId: string) {
    const peer = peersRef.current.get(supervisorId);
    if (!peer) return;
    peer.pc.close();
    if (peer.whisperAudio) {
      peer.whisperAudio.srcObject = null;
    }
    peersRef.current.delete(supervisorId);
  }
}
