import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { demoSetActiveCall, demoEnd, wsCallUpdated, wsCallEnded, clearWrapUp, updateAgentStatus } from '../callsSlice';
import type { Call, PauseReason } from '../types';
import callsApi from '../services/callsApi';
import { getDialListEntries, markCalled } from '../services/dialerService';
import type { DialListEntry } from '../services/dialerService';
import styles from './DemoSimulator.module.scss';

const DEMO_LIST_ID = '00000000-0000-0000-0000-000000000001';
const willAnswer = (i: number) => i % 2 === 0;
const DURATION = [48, 0, 95, 0, 62];

const PAUSE_REASONS: { value: PauseReason; label: string; emoji: string }[] = [
  { value: 'break',    label: 'Descanso',               emoji: '☕' },
  { value: 'lunch',    label: 'Almuerzo',                emoji: '🍽️' },
  { value: 'admin',    label: 'Gestión administrativa',  emoji: '📋' },
  { value: 'training', label: 'Formación',               emoji: '📚' },
  { value: 'personal', label: 'Personal',                emoji: '🚶' },
];

const PAUSE_LABEL: Record<PauseReason, string> = {
  break: 'Descanso', lunch: 'Almuerzo', admin: 'Gestión administrativa',
  training: 'Formación', personal: 'Personal',
};

type Phase = 'idle' | 'loading' | 'preview' | 'dialing' | 'answered' | 'wrapup' | 'no_answer' | 'error';

interface SessionResult {
  entry: DialListEntry;
  answered: boolean;
  coded: boolean;
  callId?: string;
}

interface LocalPause {
  reason: PauseReason;
  startedAt: number;
  endedAt?: number;
}

function fmtSeconds(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function DemoSimulator() {
  const dispatch = useAppDispatch();
  const pendingWrapUp = useAppSelector((s) => s.calls.pendingWrapUp);

  const [phase, setPhase]         = useState<Phase>('idle');
  const [entries, setEntries]     = useState<DialListEntry[]>([]);
  const [idx, setIdx]             = useState(0);
  const [round, setRound]         = useState(1);
  const [countdown, setCd]        = useState(3);
  const [results, setResults]     = useState<SessionResult[]>([]);
  const [errMsg, setErrMsg]       = useState<string | null>(null);

  // Pause state
  const [paused, setPaused]       = useState(false);
  const [showReasons, setShowReasons] = useState(false);
  const [pauseTick, setPauseTick] = useState(0);
  const [pauses, setPauses]       = useState<LocalPause[]>([]);

  const timers         = useRef<ReturnType<typeof setTimeout>[]>([]);
  const cdTimer        = useRef<ReturnType<typeof setInterval> | null>(null);
  const pauseTimer     = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef       = useRef<Phase>('idle');
  const currentCallId  = useRef<string | null>(null);
  const waitingWrapUp  = useRef(false);
  const pausedAtPhase  = useRef<Phase>('idle');

  phaseRef.current = phase;

  const clearAll = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (cdTimer.current) { clearInterval(cdTimer.current); cdTimer.current = null; }
  }, []);

  const at = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };

  // ── Pause / Resume ─────────────────────────────────────────────────────────
  const startPause = useCallback((reason: PauseReason) => {
    clearAll();
    setShowReasons(false);
    setPaused(true);
    setPauseTick(0);
    setPauses((prev) => [...prev, { reason, startedAt: Date.now() }]);
    dispatch(updateAgentStatus({ status: 'paused', pauseReason: reason }));

    pauseTimer.current = setInterval(() => {
      setPauseTick((t) => t + 1);
    }, 1000);
  }, [clearAll, dispatch]);

  const resumeFromPause = useCallback(() => {
    if (pauseTimer.current) { clearInterval(pauseTimer.current); pauseTimer.current = null; }
    setPauses((prev) => {
      const copy = [...prev];
      const last = copy[copy.length - 1];
      if (last && !last.endedAt) {
        copy[copy.length - 1] = { ...last, endedAt: Date.now() };
      }
      return copy;
    });
    setPaused(false);
    setPauseTick(0);
    dispatch(updateAgentStatus('available' as any));
    // Resume from the phase we paused at
    const resumePhase = pausedAtPhase.current;
    if (resumePhase === 'preview') {
      setPhase('preview');
      setCd(3);
    } else {
      // If paused during call/wrapup, just go back to preview for next
      setPhase('preview');
      setCd(3);
    }
  }, [dispatch]);

  const handlePauseClick = useCallback(() => {
    pausedAtPhase.current = phaseRef.current;
    setShowReasons(true);
  }, []);

  // ── Advance to next entry ─────────────────────────────────────────────────
  const advance = useCallback((i: number, answered: boolean, coded: boolean, callId?: string) => {
    const entry = entries[i];
    if (entry) setResults((prev) => [...prev, { entry, answered, coded, callId }]);

    const next = i + 1;
    if (next >= entries.length) {
      // Loop: reload entries and start over
      setRound((r) => r + 1);
      setIdx(0);
      setCd(3);
      setPhase('preview');
      return;
    }
    setIdx(next);
    setCd(3);
    setPhase('preview');
  }, [entries]);

  const dial = useCallback(async (entry: DialListEntry, i: number) => {
    clearAll();
    setPhase('dialing');

    let callId: string;
    try {
      const { data } = await callsApi.post<Call>('/calls/demo/create', {
        clientPhone: entry.phone,
        clientName:  entry.clientName ?? undefined,
      });
      callId = data.id;
      currentCallId.current = callId;
    } catch {
      setErrMsg('No se pudo crear la llamada. ¿Está arrancado calls-service en :3003?');
      setPhase('error');
      return;
    }

    const now = new Date().toISOString();
    const base: Call = {
      id: callId, agentId: 'demo',
      clientPhone: entry.phone, status: 'initiated',
      direction: 'outbound', muted: false, onHold: false,
      startedAt: now, createdAt: now,
    };

    dispatch(demoSetActiveCall(base));
    at(() => dispatch(wsCallUpdated({ ...base, status: 'ringing' })), 800);

    if (!willAnswer(i % 5)) {
      at(() => {
        dispatch(wsCallEnded({ ...base, status: 'no_answer', endedAt: new Date().toISOString(), duration: 0 }));
        dispatch(clearWrapUp());
        setPhase('no_answer');
        at(() => advance(i, false, false, callId), 2500);
      }, 3500);
      return;
    }

    const duration = DURATION[i % DURATION.length] ?? 60;
    at(() => {
      const answeredAt = new Date().toISOString();
      dispatch(wsCallUpdated({ ...base, status: 'answered', answeredAt }));
      setPhase('answered');
      at(() => {
        dispatch(wsCallEnded({ ...base, status: 'completed', answeredAt, endedAt: new Date().toISOString(), duration }));
        setPhase('wrapup');
      }, duration * 1000);
    }, 2800);
  }, [dispatch, clearAll, advance]);

  // ── Detect wrap-up completion ─────────────────────────────────────────────
  useEffect(() => {
    if (phaseRef.current === 'wrapup') waitingWrapUp.current = true;
    if (waitingWrapUp.current && pendingWrapUp === null && phaseRef.current === 'wrapup') {
      waitingWrapUp.current = false;
      const callId = currentCallId.current ?? undefined;
      currentCallId.current = null;
      if (callId && entries[idx]) {
        markCalled(DEMO_LIST_ID, entries[idx].id, { callId }).catch(() => {});
      }
      advance(idx, true, true, callId);
    }
  }, [pendingWrapUp, advance, idx, entries]);

  // ── Countdown in preview phase ────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'preview' || paused) return;
    setCd(3);
    cdTimer.current = setInterval(() => {
      setCd((c) => {
        if (c <= 1) {
          clearInterval(cdTimer.current!);
          cdTimer.current = null;
          if (entries[idx]) dial(entries[idx], idx);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => { if (cdTimer.current) clearInterval(cdTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, idx, paused]);

  // Cleanup on unmount
  useEffect(() => () => {
    clearAll();
    if (pauseTimer.current) clearInterval(pauseTimer.current);
  }, [clearAll]);

  const stop = () => {
    clearAll();
    if (pauseTimer.current) { clearInterval(pauseTimer.current); pauseTimer.current = null; }
    dispatch(clearWrapUp());
    dispatch(demoEnd());
    if (paused) dispatch(updateAgentStatus('available' as any));
    setPhase('idle');
    setIdx(0);
    setRound(1);
    setResults([]);
    setPauses([]);
    setPaused(false);
    setShowReasons(false);
    setErrMsg(null);
    currentCallId.current = null;
    waitingWrapUp.current = false;
  };

  const start = async () => {
    setPhase('loading');
    setErrMsg(null);
    try {
      const all = await getDialListEntries(DEMO_LIST_ID);
      if (all.length === 0) {
        setErrMsg('Lista demo vacía. Ejecuta: cd calls-service && npx prisma db seed');
        setPhase('error');
        return;
      }
      setEntries(all);
      setResults([]);
      setPauses([]);
      setIdx(0);
      setRound(1);
      setCd(3);
      setPhase('preview');
      dispatch(updateAgentStatus('available' as any));
    } catch {
      setErrMsg('No se pudo conectar con calls-service. ¿Está arrancado en :3003?');
      setPhase('error');
    }
  };

  const skipCountdown = () => {
    clearAll();
    if (entries[idx]) dial(entries[idx], idx);
  };

  // ── Pause total stats ─────────────────────────────────────────────────────
  const totalPauseSecs = pauses.reduce((acc, p) => {
    const end = p.endedAt ?? (paused ? Date.now() : p.startedAt);
    return acc + Math.round((end - p.startedAt) / 1000);
  }, 0);

  const entry = entries[idx];

  // ── Reason picker overlay ─────────────────────────────────────────────────
  const reasonPicker = showReasons && (
    <div className={styles.pauseOverlay}>
      <div className={styles.pauseModal}>
        <div className={styles.pauseTitle}>Motivo de pausa</div>
        <div className={styles.pauseReasonList}>
          {PAUSE_REASONS.map((pr) => (
            <button key={pr.value} className={styles.pauseReasonBtn} onClick={() => startPause(pr.value)}>
              <span className={styles.pauseEmoji}>{pr.emoji}</span>
              <span>{pr.label}</span>
            </button>
          ))}
        </div>
        <button className={styles.btnCancel} onClick={() => setShowReasons(false)}>Cancelar</button>
      </div>
    </div>
  );

  // ── Paused overlay ────────────────────────────────────────────────────────
  const pausedOverlay = paused && !showReasons && (
    <div className={styles.pauseOverlay}>
      <div className={styles.pauseModal}>
        <div className={styles.pauseEmoji2}>
          {PAUSE_REASONS.find((r) => r.value === pauses[pauses.length - 1]?.reason)?.emoji ?? '⏸'}
        </div>
        <div className={styles.pauseTitle}>
          {PAUSE_LABEL[pauses[pauses.length - 1]?.reason as PauseReason] ?? 'Pausa'}
        </div>
        <div className={styles.pauseTimer}>{fmtSeconds(pauseTick)}</div>
        <button className={styles.btnResume} onClick={resumeFromPause}>▶ Reanudar</button>
      </div>
    </div>
  );

  // ── Idle / loading / error ────────────────────────────────────────────────
  if (phase === 'idle' || phase === 'loading' || phase === 'error') {
    return (
      <div className={styles.card}>
        <p className={styles.hint}>
          Simula una sesión de call center completa usando la base de datos real.
          Las llamadas se crean en BD, la codificación se guarda igual que en producción,
          y el marcado continúa de forma automática e indefinida.
        </p>
        {errMsg && <p className={styles.errMsg}>{errMsg}</p>}
        <button className={styles.btnStart} onClick={start} disabled={phase === 'loading'}>
          {phase === 'loading' ? 'Cargando...' : '▶ Iniciar sesión demo'}
        </button>
      </div>
    );
  }

  // ── Session in progress ───────────────────────────────────────────────────
  const answered  = results.filter((r) => r.answered).length;
  const noAnswer  = results.filter((r) => !r.answered).length;
  const coded     = results.filter((r) => r.coded).length;

  return (
    <div className={styles.card} style={{ position: 'relative' }}>
      {reasonPicker}
      {pausedOverlay}

      {/* Mini stats bar */}
      <div className={styles.statsBar}>
        <span className={styles.roundBadge}>Vuelta {round}</span>
        <span className={styles.statItem}><span className={styles.statGreen}>{answered}</span> contestadas</span>
        <span className={styles.statItem}><span className={styles.statRed}>{noAnswer}</span> sin resp.</span>
        <span className={styles.statItem}><span className={styles.statBlue}>{coded}</span> cod.</span>
        {totalPauseSecs > 0 && (
          <span className={styles.statItem}>⏸ {fmtSeconds(totalPauseSecs)}</span>
        )}
      </div>

      {/* Progress bar */}
      <div className={styles.progressBar}>
        {entries.map((e, i) => (
          <div
            key={e.id}
            className={`${styles.progressChunk} ${
              i < idx ? styles.chunkDone :
              i === idx ? styles.chunkActive : ''
            }`}
          />
        ))}
      </div>
      <div className={styles.progressLabel}>
        Contacto {idx + 1} de {entries.length}
      </div>

      {entry && (
        <div className={styles.contactCard}>
          <div className={styles.contactPhone}>{entry.phone}</div>
          {entry.clientName && <div className={styles.contactName}>{entry.clientName}</div>}
          {entry.notes && <div className={styles.contactNotes}>📋 {entry.notes}</div>}

          {phase === 'preview' && (
            <div className={styles.previewRow}>
              <span className={styles.cdText}>Marcando en <strong>{countdown}s</strong>…</span>
              <button className={styles.btnNow} onClick={skipCountdown}>Marcar ahora</button>
            </div>
          )}
          {phase === 'dialing'   && <div className={styles.phaseTag}>📞 Llamando…</div>}
          {phase === 'answered'  && <div className={`${styles.phaseTag} ${styles.phaseAnswered}`}>✅ En llamada</div>}
          {phase === 'no_answer' && <div className={`${styles.phaseTag} ${styles.phaseNoAnswer}`}>❌ Sin respuesta</div>}
          {phase === 'wrapup'    && (
            <div className={`${styles.phaseTag} ${styles.phaseWrapup}`}>
              ✏️ Codifica la llamada en el panel lateral para continuar
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className={styles.actionRow}>
        <button className={styles.btnPause} onClick={handlePauseClick} title="Pausa">
          ⏸ Pausa
        </button>
        <button className={styles.btnStop} onClick={stop}>⏹ Parar sesión</button>
      </div>

      {/* Pause log */}
      {pauses.length > 0 && (
        <div className={styles.pauseLog}>
          <div className={styles.pauseLogTitle}>Pausas de esta sesión</div>
          {pauses.map((p, i) => {
            const dur = p.endedAt
              ? Math.round((p.endedAt - p.startedAt) / 1000)
              : paused ? pauseTick : null;
            return (
              <div key={i} className={styles.pauseLogRow}>
                <span>{PAUSE_REASONS.find((r) => r.value === p.reason)?.emoji} {PAUSE_LABEL[p.reason]}</span>
                <span className={styles.pauseLogDur}>{dur != null ? fmtSeconds(dur) : '…'}</span>
              </div>
            );
          })}
          <div className={styles.pauseLogTotal}>
            Total pausa: <strong>{fmtSeconds(totalPauseSecs)}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
