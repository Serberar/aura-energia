import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { submitWrapUp, clearWrapUp, clearError } from '../callsSlice';
import { listDispositionCodes } from '../services/dispositionService';
import { searchClient } from '@/features/clientes/services/clientService';
import crmApi from '@/api/crmApi';
import type { DispositionCode } from '../types';
import styles from './WrapUpPanel.module.scss';

const WRAP_UP_TIMEOUT_SECS = 120;
const MAX_EXTEND_SECS = 300;

function formatDuration(secs: number | null | undefined): string {
  if (!secs) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function WrapUpPanel() {
  const dispatch    = useAppDispatch();
  const navigate    = useNavigate();
  const call        = useAppSelector((s) => s.calls.pendingWrapUp);
  const error       = useAppSelector((s) => s.calls.error);
  const [codes, setCodes]             = useState<DispositionCode[]>([]);
  const [selectedId, setSelectedId]   = useState<string>('');
  const [notes, setNotes]             = useState('');
  const [remaining, setRemaining]     = useState(WRAP_UP_TIMEOUT_SECS);
  const startedAtRef = useRef(new Date().toISOString());
  const loading      = useAppSelector((s) => s.calls.loading);

  useEffect(() => {
    if (!call) return;
    startedAtRef.current = new Date().toISOString();
    setRemaining(WRAP_UP_TIMEOUT_SECS);
    setSelectedId('');
    setNotes('');
    dispatch(clearError());

    listDispositionCodes()
      .then((list) => {
        setCodes(list);
        const def = list.find((c) => c.isDefault);
        if (def) setSelectedId(def.id);
      })
      .catch(() => {});
  }, [call?.id]);

  // Countdown timer — auto-save when it hits 0
  useEffect(() => {
    if (!call) return;
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call?.id]);

  if (!call) return null;

  const duration = call.duration ?? (
    call.answeredAt && call.endedAt
      ? Math.round((new Date(call.endedAt).getTime() - new Date(call.answeredAt).getTime()) / 1000)
      : null
  );

  function handleSubmit(auto = false) {
    if (!call) return;
    const selectedCode = codes.find((c) => c.id === selectedId);
    const dispLabel = selectedCode?.label ?? '';
    const clientPhone = call.clientPhone;
    const marksSaleClosed = selectedCode?.marksSaleClosed ?? false;

    dispatch(submitWrapUp({
      callId:            call.id,
      dispositionCodeId: selectedId || undefined,
      agentNotes:        notes || undefined,
      wrapUpStartedAt:   startedAtRef.current,
    }))
      .unwrap()
      .then(() => {
        // La codificación marca la venta como cerrada: llevamos al agente
        // directamente a registrarla en el CRM en vez de dejar que se pierda.
        if (marksSaleClosed) {
          navigate(`/sales/create?phone=${encodeURIComponent(clientPhone)}`);
        }
      })
      .catch(() => {});

    if (auto) dispatch(clearWrapUp());

    // Push comment to CRM (fire-and-forget) ─ won't block the UI
    pushCallCommentToCrm(call.clientPhone, call.clientId ?? null, dispLabel, notes, duration);
  }

  function handleExtend() {
    setRemaining((prev) => Math.min(prev + 30, MAX_EXTEND_SECS));
  }

  // Resolves the CRM client and appends a call summary comment
  async function pushCallCommentToCrm(
    phone: string,
    clientId: string | null,
    dispLabel: string,
    agentNotes: string,
    dur: number | null,
  ) {
    const date    = new Date().toLocaleDateString('es-ES');
    const durStr  = dur != null ? formatDuration(dur) : '—';
    const comment = `${date} · Llamada ${durStr}${dispLabel ? ` · ${dispLabel}` : ''}${agentNotes ? ` — ${agentNotes}` : ''}`;
    try {
      let id = clientId;
      if (!id) {
        const result = await searchClient(phone);
        const c = Array.isArray(result) ? result[0] : result;
        id = c?.id ?? null;
      }
      if (id) await crmApi.post(`/clients/${id}/push`, { comments: [comment] });
    } catch { /* silent */ }
  }

  const timerPct = (remaining / WRAP_UP_TIMEOUT_SECS) * 100;
  const timerColor = remaining < 20 ? '#ef4444' : remaining < 45 ? '#f59e0b' : '#16a34a';

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.title}>Cierre de llamada</span>
          <span className={styles.countdownGroup}>
            <span className={styles.countdown} style={{ color: timerColor }}>
              {remaining}s
            </span>
            {remaining < MAX_EXTEND_SECS && (
              <button className={styles.extendBtn} onClick={handleExtend} title="Añadir 30 segundos">
                +30s
              </button>
            )}
          </span>
        </div>

        {/* Timer bar */}
        <div className={styles.timerBar}>
          <div
            className={styles.timerFill}
            style={{ width: `${timerPct}%`, background: timerColor }}
          />
        </div>

        {/* Call summary */}
        <div className={styles.summary}>
          <span className={styles.phone}>{call.clientPhone}</span>
          <span className={styles.dur}>{formatDuration(duration)}</span>
          <span className={`${styles.status} ${styles[`s_${call.status}`]}`}>
            {call.status}
          </span>
        </div>

        {/* Disposition chips */}
        <div className={styles.section}>
          <label className={styles.label}>Resultado de la llamada</label>
          <div className={styles.chips}>
            {codes.map((code) => (
              <button
                key={code.id}
                className={`${styles.chip} ${selectedId === code.id ? styles.chipSelected : ''}`}
                style={selectedId === code.id ? { background: code.color, borderColor: code.color } : {}}
                onClick={() => setSelectedId(code.id)}
              >
                {code.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className={styles.section}>
          <label className={styles.label}>Notas de seguimiento</label>
          <textarea
            className={styles.textarea}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Resumen, próximos pasos…"
            rows={3}
          />
        </div>

        {error && <div className={styles.errorMsg}>{error}</div>}

        {/* Actions */}
        <div className={styles.actions}>
          <button
            className={styles.skipBtn}
            onClick={() => dispatch(clearWrapUp())}
          >
            Omitir
          </button>
          <button
            className={styles.saveBtn}
            onClick={() => handleSubmit(false)}
            disabled={loading}
          >
            {loading ? 'Guardando…' : 'Guardar y cerrar'}
          </button>
        </div>
      </div>
    </div>
  );
}
