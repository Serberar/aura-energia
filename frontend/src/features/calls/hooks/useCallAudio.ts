import { useEffect, useRef, useState } from 'react';
import type { CallStatus } from '../types';

// Captures the agent's microphone when the call is answered.
// The returned streamRef is used by useMonitorPeer to share audio with supervisors.
export function useCallAudio(status: CallStatus | undefined) {
  const streamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (status !== 'answered') {
      stopCapture();
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      .then((stream) => {
        if (!mountedRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        setReady(true);
      })
      .catch((err) => {
        console.warn('[useCallAudio] Cannot access microphone:', err);
      });

    return stopCapture;
  }, [status]);

  function stopCapture() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (mountedRef.current) setReady(false);
  }

  return { streamRef, ready };
}
