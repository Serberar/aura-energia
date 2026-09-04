import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { dismissIncomingCall, demoSetActiveCall } from '../callsSlice';
import callsApi from '../services/callsApi';
import styles from './IncomingCallToast.module.scss';

export default function IncomingCallToast() {
  const dispatch = useAppDispatch();
  const incoming = useAppSelector((s) => s.calls.incomingCall);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!incoming) return;
    // Auto-dismiss after 30s if not answered
    timerRef.current = setTimeout(() => dispatch(dismissIncomingCall()), 30_000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [incoming, dispatch]);

  if (!incoming) return null;

  const handleAnswer = async () => {
    if (incoming.callId.startsWith('demo-')) {
      dispatch(demoSetActiveCall({
        id: incoming.callId, agentId: incoming.agentId,
        clientPhone: incoming.from, status: 'answered',
        direction: 'inbound', muted: false, onHold: false,
        startedAt: new Date().toISOString(),
        answeredAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      }));
      dispatch(dismissIncomingCall());
      return;
    }
    try {
      await callsApi.post(`/calls/${incoming.callId}/answer`);
    } catch {
      // optimistically dismiss; WS will update state
    }
    dispatch(dismissIncomingCall());
  };

  const handleReject = async () => {
    try {
      await callsApi.post(`/calls/${incoming.callId}/reject`);
    } catch {}
    dispatch(dismissIncomingCall());
  };

  return (
    <div className={styles.toast}>
      <div className={styles.header}>📲 Llamada entrante</div>
      <div className={styles.phone}>{incoming.from}</div>
      <div className={styles.actions}>
        <button className={styles.answerBtn} onClick={handleAnswer}>
          Contestar
        </button>
        <button className={styles.rejectBtn} onClick={handleReject}>
          Rechazar
        </button>
      </div>
    </div>
  );
}
