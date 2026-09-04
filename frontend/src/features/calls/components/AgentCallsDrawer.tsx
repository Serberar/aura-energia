import { useEffect, useState, useCallback } from 'react';
import { getAgentCalls } from '../services/supervisorService';
import type { AgentCallDetail } from '../services/supervisorService';
import styles from './AgentCallsDrawer.module.scss';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function fmtDuration(secs: number | null | undefined) {
  if (!secs) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function fmtWrapUp(startedAt: string | null, endedAt: string | null) {
  if (!startedAt || !endedAt) return '—';
  const secs = Math.round(
    (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000,
  );
  if (secs <= 0) return '—';
  return fmtDuration(secs);
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

type Preset = 'today' | 'week' | 'month';

function rangeOf(preset: Preset): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now);
  if (preset === 'week')  from.setDate(from.getDate() - 6);
  if (preset === 'month') from.setDate(from.getDate() - 29);
  return { from: isoDate(from), to: isoDate(now) };
}

const PAGE_SIZE = 20;

const STATUS_LABELS: Record<string, string> = {
  initiated: 'Conectando',
  ringing:   'Llamando',
  answered:  'Contestada',
  completed: 'Completada',
  no_answer: 'Sin resp.',
  busy:      'Ocupado',
  failed:    'Fallida',
};

const STATUS_COLORS: Record<string, string> = {
  completed: '#16a34a',
  answered:  '#16a34a',
  no_answer: '#d97706',
  busy:      '#d97706',
  failed:    '#dc2626',
};

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  agentId:   string | null;
  agentName: string;
  onClose:   () => void;
}

export default function AgentCallsDrawer({ agentId, agentName, onClose }: Props) {
  const [calls,   setCalls]   = useState<AgentCallDetail[]>([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [page,    setPage]    = useState(1);
  const [preset,  setPreset]  = useState<Preset>('today');

  const load = useCallback(async () => {
    if (!agentId) return;
    setLoading(true);
    setError(null);
    try {
      const { from, to } = rangeOf(preset);
      const res = await getAgentCalls(agentId, { page, pageSize: PAGE_SIZE, from, to });
      setCalls(res.data);
      setTotal(res.total);
    } catch {
      setError('Error al cargar las llamadas');
    } finally {
      setLoading(false);
    }
  }, [agentId, page, preset]);

  useEffect(() => {
    if (agentId) { setPage(1); }
  }, [agentId, preset]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (!agentId) return null;

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <aside className={styles.drawer}>
        {/* Header */}
        <div className={styles.drawerHeader}>
          <div>
            <h2 className={styles.drawerTitle}>{agentName}</h2>
            <span className={styles.drawerSub}>
              {total} llamada{total !== 1 ? 's' : ''} encontrada{total !== 1 ? 's' : ''}
            </span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        {/* Preset selector */}
        <div className={styles.toolbar}>
          {(['today', 'week', 'month'] as Preset[]).map((p) => (
            <button
              key={p}
              className={`${styles.presetBtn} ${preset === p ? styles.presetActive : ''}`}
              onClick={() => { setPreset(p); setPage(1); }}
            >
              {p === 'today' ? 'Hoy' : p === 'week' ? '7 días' : '30 días'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className={styles.drawerBody}>
          {loading && <p className={styles.loadingMsg}>Cargando…</p>}
          {error   && <p className={styles.errorMsg}>{error}</p>}

          {!loading && !error && calls.length === 0 && (
            <p className={styles.emptyMsg}>Sin llamadas en este período</p>
          )}

          {!loading && calls.length > 0 && (
            <>
              {/* Summary row */}
              <div className={styles.summaryRow}>
                <span className={styles.summaryItem}>
                  <strong>{calls.filter(c => ['answered','completed'].includes(c.status)).length}</strong>
                  {' '}contestadas
                </span>
                <span className={styles.summaryItem}>
                  <strong>
                    {fmtDuration(
                      Math.round(
                        calls
                          .filter(c => c.duration)
                          .reduce((acc, c) => acc + (c.duration ?? 0), 0) /
                        Math.max(calls.filter(c => c.duration).length, 1)
                      )
                    )}
                  </strong>
                  {' '}dur. media
                </span>
                <span className={styles.summaryItem}>
                  <strong>
                    {fmtDuration(
                      Math.round(
                        calls
                          .filter(c => c.wrapUpStartedAt && c.wrapUpEndedAt)
                          .reduce((acc, c) => {
                            const s = Math.round(
                              (new Date(c.wrapUpEndedAt!).getTime() -
                               new Date(c.wrapUpStartedAt!).getTime()) / 1000
                            );
                            return acc + s;
                          }, 0) /
                        Math.max(calls.filter(c => c.wrapUpStartedAt && c.wrapUpEndedAt).length, 1)
                      )
                    )}
                  </strong>
                  {' '}codif. media
                </span>
              </div>

              {/* Table */}
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Teléfono</th>
                      <th>Estado</th>
                      <th>Habla</th>
                      <th>Codif.</th>
                      <th>Disposición</th>
                      <th>Notas</th>
                      <th>Audio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calls.map((call) => {
                      const wrapSecs = (call.wrapUpStartedAt && call.wrapUpEndedAt)
                        ? Math.round(
                            (new Date(call.wrapUpEndedAt).getTime() -
                             new Date(call.wrapUpStartedAt).getTime()) / 1000
                          )
                        : null;

                      return (
                        <tr key={call.id}>
                          <td className={styles.tdDate}>{fmtDate(call.createdAt)}</td>
                          <td className={styles.tdPhone}>{call.clientPhone}</td>
                          <td>
                            <span
                              className={styles.statusPill}
                              style={{ color: STATUS_COLORS[call.status] ?? '#6b7280' }}
                            >
                              {STATUS_LABELS[call.status] ?? call.status}
                            </span>
                          </td>
                          <td className={styles.tdNum}>{fmtDuration(call.duration)}</td>
                          <td className={styles.tdNum}>
                            {wrapSecs != null && wrapSecs > 0
                              ? <span className={wrapSecs > 90 ? styles.wrapLong : ''}>{fmtDuration(wrapSecs)}</span>
                              : '—'}
                          </td>
                          <td>
                            {call.dispositionCode ? (
                              <span
                                className={styles.dispPill}
                                style={{ background: call.dispositionCode.color + '22', color: call.dispositionCode.color }}
                              >
                                {call.dispositionCode.label}
                              </span>
                            ) : '—'}
                          </td>
                          <td className={styles.tdNotes} title={call.agentNotes ?? undefined}>
                            {call.agentNotes
                              ? (call.agentNotes.length > 35
                                ? call.agentNotes.slice(0, 35) + '…'
                                : call.agentNotes)
                              : '—'}
                          </td>
                          <td>
                            {call.recordingUrl
                              ? <audio controls src={call.recordingUrl} style={{ height: 26, width: 120 }} />
                              : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button className={styles.pageBtn} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Ant.</button>
                  <span className={styles.pageInfo}>{page} / {totalPages}</span>
                  <button className={styles.pageBtn} disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Sig. →</button>
                </div>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
}
