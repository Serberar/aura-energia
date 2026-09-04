import { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import {
  initiateCall, hangUpCall, openDialer, closeDialer,
  optimisticMute, optimisticHold, muteCall, holdCall, saveCallNotes,
} from '../callsSlice';
import * as callService from '../services/callService';
import { listScripts } from '../services/scriptService';
import type { CallScript } from '../services/scriptService';
import type { CallStatus } from '../types';
import styles from './CallWidget.module.scss';
import { useCallAudio } from '../hooks/useCallAudio';
import { useMonitorPeer } from '../hooks/useMonitorPeer';
import { useCallRecording } from '../hooks/useCallRecording';
import { searchClient } from '@/features/clientes/services/clientService';
import type { Client } from '@/types/sales';

const STATUS_LABEL: Record<CallStatus, string> = {
  initiated:  'Conectando…',
  ringing:    'Llamando…',
  answered:   'En llamada',
  completed:  'Finalizada',
  no_answer:  'Sin respuesta',
  busy:       'Ocupado',
  failed:     'Fallida',
};

const HEADER_CLASS: Record<CallStatus, string> = {
  initiated:  styles.statusInitiated ?? '',
  ringing:    styles.statusRinging   ?? '',
  answered:   styles.statusAnswered  ?? '',
  completed:  '',
  no_answer:  '',
  busy:       '',
  failed:     '',
};

const DIAL_KEYS = ['1','2','3','4','5','6','7','8','9','*','0','#'];

function useCallTimer(answeredAt?: string | null): string {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!answeredAt) { setElapsed(0); return; }
    const start = new Date(answeredAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [answeredAt]);

  if (!answeredAt) return '';
  const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const s = (elapsed % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function CallWidget() {
  const dispatch     = useAppDispatch();
  const activeCall   = useAppSelector((s) => s.calls.activeCall);
  const dialerOpen   = useAppSelector((s) => s.calls.dialerOpen);
  const wsConnected  = useAppSelector((s) => s.calls.wsConnected);
  const loading      = useAppSelector((s) => s.calls.loading);
  const [phone, setPhone]       = useState('');
  const [notes, setNotes]       = useState('');
  const [notesSaved, setNotesSaved] = useState(false);
  const [showDtmf, setShowDtmf]     = useState(false);
  const [showNotes, setShowNotes]   = useState(false);
  const [showScript, setShowScript] = useState(false);
  const [scripts, setScripts]       = useState<CallScript[]>([]);
  const [scriptIdx, setScriptIdx]   = useState(0);
  const [clientInfo, setClientInfo] = useState<Client | null>(null);
  const inputRef       = useRef<HTMLInputElement>(null);
  const notesSavedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timer = useCallTimer(activeCall?.answeredAt);

  // Buscar ficha del cliente cuando empieza la llamada
  useEffect(() => {
    if (!activeCall?.clientPhone) { setClientInfo(null); return; }
    const ctrl = new AbortController();
    searchClient(activeCall.clientPhone, ctrl.signal)
      .then((result) => {
        const c = Array.isArray(result) ? result[0] : result;
        setClientInfo(c ?? null);
      })
      .catch(() => setClientInfo(null));
    return () => ctrl.abort();
  }, [activeCall?.id, activeCall?.clientPhone]);

  // Capture microphone when answered; share with supervisor if monitored; record locally
  const { streamRef } = useCallAudio(activeCall?.status);
  useMonitorPeer(activeCall?.id ?? null, streamRef);
  const { recordingState } = useCallRecording(activeCall?.id ?? null, activeCall?.status, streamRef);

  // Cleanup notes timer on unmount
  useEffect(() => {
    return () => { if (notesSavedTimer.current) clearTimeout(notesSavedTimer.current); };
  }, []);

  // Sync notes field when call changes
  useEffect(() => {
    setNotes(activeCall?.notes ?? '');
    setNotesSaved(false);
  }, [activeCall?.id, activeCall?.notes]);

  // Load scripts when call becomes answered
  useEffect(() => {
    if (activeCall?.status === 'answered' && scripts.length === 0) {
      listScripts().then(setScripts).catch(() => {});
    }
  }, [activeCall?.status, scripts.length]);

  const handleDial    = (key: string) => setPhone((p) => p + key);
  const handleDtmfKey = (key: string) => {
    if (activeCall) callService.sendDtmf(activeCall.id, key).catch(() => {});
  };

  const handleCall = () => {
    if (!phone.trim()) return;
    dispatch(initiateCall({ clientPhone: phone.trim() }));
    setPhone('');
  };

  const handleHangUp = () => {
    if (activeCall) dispatch(hangUpCall(activeCall.id));
  };

  const handleMute = () => {
    if (!activeCall) return;
    // Optimistic UI + mute local track immediately
    dispatch(optimisticMute());
    const enabled = activeCall.muted; // after toggle it will be !muted
    streamRef.current?.getTracks().forEach((t) => { t.enabled = enabled; });
    dispatch(muteCall(activeCall.id));
  };

  const handleHold = () => {
    if (!activeCall) return;
    dispatch(optimisticHold());
    dispatch(holdCall(activeCall.id));
  };

  const handleSaveNotes = () => {
    if (!activeCall) return;
    dispatch(saveCallNotes({ callId: activeCall.id, text: notes }));
    setNotesSaved(true);
    if (notesSavedTimer.current) clearTimeout(notesSavedTimer.current);
    notesSavedTimer.current = setTimeout(() => setNotesSaved(false), 2000);
  };

  const handleOpenDialer = () => {
    dispatch(openDialer());
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  if (activeCall) {
    const isAnswered = activeCall.status === 'answered';
    const isMuted    = activeCall.muted;
    const isOnHold   = activeCall.onHold;
    const headerClass = `${styles.cardHeader} ${HEADER_CLASS[activeCall.status] ?? ''} ${isOnHold ? styles.statusHold : ''}`;

    return (
      <div className={styles.activeCard}>
        <div className={headerClass}>
          <span>{isOnHold ? '⏸ En espera' : STATUS_LABEL[activeCall.status]}</span>
          <span style={{ fontSize: 11, opacity: 0.8 }}>
            {isMuted && !isOnHold ? '🔇 Silenciado' : 'Llamada activa'}
          </span>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.phone}>{activeCall.clientPhone}</div>
          {clientInfo && (
            <div className={styles.clientInfo}>
              <span className={styles.clientName}>
                {clientInfo.firstName} {clientInfo.lastName}
              </span>
              {clientInfo.addresses?.[0]?.address && (
                <span className={styles.clientAddr}>{clientInfo.addresses[0].address}</span>
              )}
            </div>
          )}
          <div className={styles.recRow}>
            {timer && <span className={styles.timer}>{timer}</span>}
            {recordingState === 'recording'  && <span className={styles.recDot} title="Grabando">● REC</span>}
            {recordingState === 'uploading'  && <span className={styles.recUpload} title="Subiendo grabación">↑ Subiendo…</span>}
            {recordingState === 'done'       && <span className={styles.recDone}  title="Grabación guardada">✓ Grabado</span>}
            {recordingState === 'error'      && <span className={styles.recError} title="Error en grabación">⚠ Sin grabación</span>}
          </div>

          {/* Main controls */}
          {isAnswered && (
            <div className={styles.controls}>
              <button
                className={`${styles.ctrlBtn} ${isMuted ? styles.ctrlActive : ''}`}
                onClick={handleMute}
                title={isMuted ? 'Activar micrófono' : 'Silenciar micrófono'}
              >
                {isMuted ? '🔇' : '🎤'}
              </button>
              <button
                className={`${styles.ctrlBtn} ${isOnHold ? styles.ctrlActive : ''}`}
                onClick={handleHold}
                title={isOnHold ? 'Reanudar' : 'Poner en espera'}
              >
                {isOnHold ? '▶' : '⏸'}
              </button>
              <button
                className={`${styles.ctrlBtn} ${showDtmf ? styles.ctrlActive : ''}`}
                onClick={() => { setShowDtmf((v) => !v); setShowNotes(false); }}
                title="Teclado DTMF"
              >
                🔢
              </button>
              <button
                className={`${styles.ctrlBtn} ${showNotes ? styles.ctrlActive : ''}`}
                onClick={() => { setShowNotes((v) => !v); setShowDtmf(false); setShowScript(false); }}
                title="Notas en caliente"
              >
                📝
              </button>
              {scripts.length > 0 && (
                <button
                  className={`${styles.ctrlBtn} ${showScript ? styles.ctrlActive : ''}`}
                  onClick={() => { setShowScript((v) => !v); setShowDtmf(false); setShowNotes(false); }}
                  title="Guión del agente"
                >
                  📋
                </button>
              )}
            </div>
          )}

          {/* DTMF pad (inline) */}
          {showDtmf && isAnswered && (
            <div className={styles.dtmfGrid}>
              {DIAL_KEYS.map((k) => (
                <button key={k} className={styles.dtmfKey} onClick={() => handleDtmfKey(k)}>
                  {k}
                </button>
              ))}
            </div>
          )}

          {/* Script panel */}
          {showScript && scripts.length > 0 && (
            <div className={styles.scriptPanel}>
              {scripts.length > 1 && (
                <div className={styles.scriptTabs}>
                  {scripts.map((sc, i) => (
                    <button
                      key={sc.id}
                      className={`${styles.scriptTab} ${i === scriptIdx ? styles.scriptTabActive : ''}`}
                      onClick={() => setScriptIdx(i)}
                    >
                      {sc.name}
                    </button>
                  ))}
                </div>
              )}
              <pre className={styles.scriptContent}>{scripts[scriptIdx]?.content}</pre>
            </div>
          )}

          {/* Notes panel */}
          {showNotes && (
            <div className={styles.notesPanel}>
              <textarea
                className={styles.notesArea}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas de la llamada…"
                rows={3}
              />
              <button
                className={`${styles.saveNotesBtn} ${notesSaved ? styles.saved : ''}`}
                onClick={handleSaveNotes}
              >
                {notesSaved ? '✓ Guardado' : 'Guardar'}
              </button>
            </div>
          )}

          {/* Hang up */}
          <div className={styles.actions}>
            <button className={styles.hangupBtn} onClick={handleHangUp} title="Colgar">
              📵
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`${styles.wsIndicator} ${wsConnected ? styles.connected : ''}`} title={wsConnected ? 'WS conectado' : 'WS desconectado'} />

      {dialerOpen && (
        <div className={styles.dialer}>
          <div className={styles.dialerTitle}>Nueva llamada</div>
          <input
            ref={inputRef}
            className={styles.dialerInput}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCall()}
            placeholder="+34 600 000 000"
            type="tel"
          />
          <div className={styles.dialGrid}>
            {DIAL_KEYS.map((k) => (
              <button key={k} className={styles.dialKey} onClick={() => handleDial(k)}>
                {k}
              </button>
            ))}
          </div>
          <button
            className={styles.callBtn}
            onClick={handleCall}
            disabled={!phone.trim() || loading}
          >
            📞 {loading ? 'Llamando…' : 'Llamar'}
          </button>
          <button className={styles.closeDialer} onClick={() => dispatch(closeDialer())}>
            Cerrar
          </button>
        </div>
      )}

      <button
        className={styles.fab}
        onClick={handleOpenDialer}
        disabled={loading}
        title="Abrir marcador"
      >
        📞
      </button>
    </>
  );
}
