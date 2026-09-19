import { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { fetchCallHistory, updateAgentStatus, openDialer } from '@/features/calls/callsSlice';
import { buildExportUrl, getMyPauseLogs } from '@/features/calls/services/callService';
import type { AgentStatus, CallStatus, PauseLog } from '@/features/calls/types';
import AgendaPanel from '@/features/calls/components/AgendaPanel';
import styles from './CallsPage.module.scss';

const STATUS_LABEL: Record<CallStatus, string> = {
  initiated:  'Conectando',
  ringing:    'Llamando',
  answered:   'Contestada',
  completed:  'Completada',
  no_answer:  'Sin respuesta',
  busy:       'Ocupado',
  failed:     'Fallida',
};

const BADGE_CLASS: Record<CallStatus, string> = {
  initiated:  styles.badgeInitiated  ?? '',
  ringing:    styles.badgeRinging    ?? '',
  answered:   styles.badgeAnswered   ?? '',
  completed:  styles.badgeCompleted  ?? '',
  no_answer:  styles.badgeNoAnswer   ?? '',
  busy:       styles.badgeBusy       ?? '',
  failed:     styles.badgeFailed     ?? '',
};

function formatDuration(seconds?: number | null): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatWrapUp(startedAt?: string | null, endedAt?: string | null): string {
  if (!startedAt || !endedAt) return '—';
  const secs = Math.round(
    (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000,
  );
  if (secs <= 0) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const AGENT_STATUS_OPTIONS: { value: AgentStatus; label: string }[] = [
  { value: 'available', label: '🟢 Disponible' },
  { value: 'paused',    label: '🟡 Pausa'       },
  { value: 'busy',      label: '🔴 Ocupado'     },
  { value: 'offline',   label: '⚫ Offline'      },
];

const PAUSE_REASONS: { value: string; label: string }[] = [
  { value: 'break',    label: 'Descanso' },
  { value: 'lunch',    label: 'Almuerzo' },
  { value: 'admin',    label: 'Gestión administrativa' },
  { value: 'training', label: 'Formación' },
  { value: 'personal', label: 'Personal' },
];

const PAGE_SIZE = 20;
type Tab = 'history' | 'agenda' | 'pauses';

const PAUSE_REASON_LABELS: Record<string, string> = {
  break: 'Descanso', lunch: 'Almuerzo', admin: 'Gestión administrativa',
  training: 'Formación', personal: 'Personal',
};

function fmtPauseSecs(secs: number | null): string {
  if (secs == null) return 'en curso';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function CallsPage() {
  const dispatch    = useAppDispatch();
  const calls       = useAppSelector((s) => s.calls.callHistory);
  const total       = useAppSelector((s) => s.calls.total);
  const loading     = useAppSelector((s) => s.calls.loading);
  const agentStatus = useAppSelector((s) => s.calls.agentStatus);
  const wsConnected = useAppSelector((s) => s.calls.wsConnected);
  const [tab, setTab]             = useState<Tab>('history');
  const [pauseModal, setPauseModal] = useState(false);
  const [myPauses, setMyPauses]   = useState<PauseLog[]>([]);
  const [page, setPage]     = useState(1);
  const [from, setFrom]     = useState('');
  const [to, setTo]         = useState('');
  const [phone, setPhone]   = useState('');
  const [status, setStatus] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = useCallback(() => {
    dispatch(fetchCallHistory({
      page,
      pageSize: PAGE_SIZE,
      ...(from   && { from }),
      ...(to     && { to }),
      ...(phone  && { clientPhone: phone }),
      ...(status && { status }),
    }));
  }, [dispatch, page, from, to, phone, status]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (tab === 'pauses') getMyPauseLogs().then(setMyPauses).catch(() => setMyPauses([]));
  }, [tab]);

  const handleApply = () => { setPage(1); load(); };
  const handleClear = () => { setFrom(''); setTo(''); setPhone(''); setStatus(''); setPage(1); };

  const exportUrl = buildExportUrl({
    ...(from   && { from }),
    ...(to     && { to }),
    ...(phone  && { clientPhone: phone }),
    ...(status && { status }),
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Panel de Llamadas</h1>
        <div className={styles.statusBar}>
          <span className={styles.statusLabel}>
            <span className={wsConnected ? styles.wsOk : styles.wsErr} />
            {wsConnected ? 'Conectado' : 'Sin conexión'}
          </span>
          <select
            className={styles.statusSelect}
            value={agentStatus}
            onChange={(e) => {
              const s = e.target.value as AgentStatus;
              if (s === 'paused') { setPauseModal(true); return; }
              dispatch(updateAgentStatus(s));
            }}
          >
            {AGENT_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button className={styles.callBtn} onClick={() => dispatch(openDialer())}>
            📞 Nueva llamada
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {(['history', 'agenda', 'pauses'] as Tab[]).map((t) => (
          <button key={t} className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`} onClick={() => setTab(t)}>
            {t === 'history' ? '📋 Historial' : t === 'agenda' ? '📅 Agenda' : '⏸ Mis pausas'}
          </button>
        ))}
      </div>

      {tab === 'agenda' && (
        <div className={styles.card}>
          <div className={styles.cardTitle}>Agenda de llamadas</div>
          <div style={{ padding: '16px 20px' }}>
            <AgendaPanel />
          </div>
        </div>
      )}

      {tab === 'pauses' && (
        <div className={styles.card}>
          <div className={styles.cardTitle}>
            Mis pausas de hoy
            {myPauses.length > 0 && (
              <span className={styles.totalBadge}>
                {fmtPauseSecs(myPauses.reduce((acc, p) => acc + (p.duration ?? 0), 0))} total
              </span>
            )}
          </div>
          <div style={{ padding: '16px 20px' }}>
            {myPauses.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: 14 }}>Aún no has hecho ninguna pausa hoy.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr><th>Motivo</th><th>Inicio</th><th>Duración</th></tr>
                </thead>
                <tbody>
                  {myPauses.map((p) => (
                    <tr key={p.id}>
                      <td>{PAUSE_REASON_LABELS[p.reason] ?? p.reason}</td>
                      <td>{new Date(p.startedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td>{fmtPauseSecs(p.duration)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className={styles.card}>
          {/* Filters bar */}
          <div className={styles.filtersBar}>
            <span className={styles.cardTitle} style={{ margin: 0 }}>
              Historial <span className={styles.totalBadge}>{total}</span>
            </span>
            <div className={styles.filterActions}>
              <button className={styles.filterToggle} onClick={() => setFiltersOpen((v) => !v)}>
                {filtersOpen ? '▲ Ocultar filtros' : '▼ Filtros'}
              </button>
              <a href={exportUrl} download className={styles.exportBtn}>
                ⬇ Exportar CSV
              </a>
            </div>
          </div>

          {filtersOpen && (
            <div className={styles.filtersPanel}>
              <div className={styles.filterRow}>
                <label>Desde
                  <input type="date" className={styles.filterInput} value={from} onChange={(e) => setFrom(e.target.value)} />
                </label>
                <label>Hasta
                  <input type="date" className={styles.filterInput} value={to} onChange={(e) => setTo(e.target.value)} />
                </label>
                <label>Teléfono
                  <input type="text" className={styles.filterInput} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="600 000 000" />
                </label>
                <label>Estado
                  <select className={styles.filterInput} value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="">Todos</option>
                    {(Object.keys(STATUS_LABEL) as CallStatus[]).map((s) => (
                      <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className={styles.filterBtns}>
                <button className={styles.clearBtn}  onClick={handleClear}>Limpiar</button>
                <button className={styles.applyBtn}  onClick={handleApply}>Aplicar</button>
              </div>
            </div>
          )}

          {loading ? (
            <div className={styles.empty}>Cargando…</div>
          ) : calls.length === 0 ? (
            <div className={styles.empty}>No hay llamadas con estos filtros</div>
          ) : (
            <>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Teléfono</th>
                      <th>Estado</th>
                      <th>Duración</th>
                      <th>Codificación</th>
                      <th>Disposición</th>
                      <th>Notas</th>
                      <th>Grabación</th>
                      <th>DNC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calls.map((call) => (
                      <tr key={call.id}>
                        <td>{formatDate(call.createdAt)}</td>
                        <td>{call.clientPhone}</td>
                        <td>
                          <span className={`${styles.statusBadge} ${BADGE_CLASS[call.status] ?? ''}`}>
                            {STATUS_LABEL[call.status]}
                          </span>
                        </td>
                        <td>{formatDuration(call.duration)}</td>
                        <td>{formatWrapUp(call.wrapUpStartedAt, call.wrapUpEndedAt)}</td>
                        <td>{(call as any).dispositionCode?.label ?? '—'}</td>
                        <td className={styles.notesCell}>
                          {call.agentNotes
                            ? <span title={call.agentNotes}>
                                {call.agentNotes.length > 30 ? call.agentNotes.slice(0, 30) + '…' : call.agentNotes}
                              </span>
                            : '—'}
                        </td>
                        <td>
                          {call.recordingUrl ? (
                            <audio controls src={call.recordingUrl} style={{ height: 28 }} title="Grabación completa (proveedor)" />
                          ) : call.agentRecordingUrl ? (
                            <span title="Solo se capturó el audio del agente, no el del cliente">
                              <audio controls src={call.agentRecordingUrl} style={{ height: 28 }} /> ⚠️ solo agente
                            </span>
                          ) : '—'}
                        </td>
                        <td>
                          <button
                            className={styles.dncBtn}
                            title="Añadir a lista DNC"
                            onClick={() => {
                              import('@/features/calls/services/dncService').then(({ addDnc }) => {
                                addDnc({ phone: call.clientPhone }).catch(() => {});
                              });
                            }}
                          >
                            🚫
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className={styles.pagination}>
                <button className={styles.pageBtn} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  ← Anterior
                </button>
                <span className={styles.pageInfo}>
                  Página {page} de {totalPages}
                </span>
                <button className={styles.pageBtn} disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Siguiente →
                </button>
              </div>
            </>
          )}
        </div>
      )}
      {/* Pause reason modal */}
      {pauseModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Motivo de pausa</h2>
            <div className={styles.pauseReasons}>
              {PAUSE_REASONS.map((pr) => (
                <button
                  key={pr.value}
                  className={styles.pauseReasonBtn}
                  onClick={() => {
                    dispatch(updateAgentStatus({ status: 'paused', pauseReason: pr.value }));
                    setPauseModal(false);
                  }}
                >
                  {pr.label}
                </button>
              ))}
            </div>
            <button className={styles.modalCancel} onClick={() => setPauseModal(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
