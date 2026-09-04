import { useEffect, useRef, useState } from 'react';
import callsApi from '../services/callsApi';
import type { CallStatus } from '../types';

export type RecordingState = 'idle' | 'recording' | 'uploading' | 'done' | 'error';

// Records the agent's microphone stream and uploads it when the call ends.
// Receives the MediaStream from useCallAudio (already open) to avoid double getUserMedia.
export function useCallRecording(
  callId:     string | null,
  status:     CallStatus | undefined,
  streamRef:  React.RefObject<MediaStream | null>,
) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<Blob[]>([]);
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');

  // Start recording when answered
  useEffect(() => {
    if (status !== 'answered' || !callId || !streamRef.current) return;
    if (recorderRef.current) return; // already recording

    const stream = streamRef.current;
    const mimeType = getSupportedMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.start(1000); // collect chunks every 1s
    recorderRef.current = recorder;
    setRecordingState('recording');

    return () => {
      // Cleanup if component unmounts mid-call (unusual but safe)
      if (recorder.state !== 'inactive') recorder.stop();
    };
  // streamRef is a ref — intentionally stable
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, callId]);

  // Stop and upload when call reaches terminal status
  useEffect(() => {
    const terminal = status && ['completed','no_answer','busy','failed'].includes(status);
    if (!terminal || !callId || !recorderRef.current) return;

    const recorder = recorderRef.current;
    if (recorder.state === 'inactive') return;

    recorder.onstop = async () => {
      recorderRef.current = null;
      const chunks = chunksRef.current.splice(0);
      if (chunks.length === 0) { setRecordingState('idle'); return; }

      setRecordingState('uploading');
      const blob     = new Blob(chunks, { type: recorder.mimeType });
      const formData = new FormData();
      formData.append('recording', blob, `call-${callId}.webm`);

      try {
        await callsApi.post(`/calls/${callId}/recording`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setRecordingState('done');
      } catch {
        setRecordingState('error');
      }
    };

    recorder.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, callId]);

  // Reset when a new call starts
  useEffect(() => {
    if (!callId) {
      chunksRef.current = [];
      recorderRef.current = null;
      setRecordingState('idle');
    }
  }, [callId]);

  return { recordingState };
}

function getSupportedMimeType(): string | null {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg'];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) ?? null;
}
