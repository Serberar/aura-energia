import { useEffect, useCallback, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { fetchSupervisorData, fetchHistoricalStats } from '@/features/calls/supervisorSlice';
import { setQueueEntries } from '@/features/calls/callsSlice';
import { useMonitorReceiver } from '@/features/calls/hooks/useMonitorReceiver';
import { getInboundQueue } from '@/features/calls/services/callService';
import AgentCallsDrawer from '@/features/calls/components/AgentCallsDrawer';
import styles from './SupervisorPage.module.scss';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  available: 'Disponible',
  busy:      'En llamada',
  paused:    'Pausa',
  offline:   'Desconectado',
};

const STATUS_COLORS: Record<string, string> = {
  available: '#22c55e',
  busy:      '#f59e0b',
  paused:    '#8b5cf6',
  offline:   '#6b7280',
};

const PAUSE_REASON_LABELS: Record<string, string> = {
  break: 'Descanso', lunch: 'Almuerzo', admin: 'Gestión administrativa',
  training: 'Formación', personal: 'Personal',
};

function timeSince(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function useTicker(intervalMs = 1000) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}

function liveDuration(startedAt: string | null): string {
  if (!startedAt) return '—';
  const secs = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function fmtSecs(secs: number): string {
  if (!secs) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function dateRangeFromPreset(preset: string): { from: string; to: string } {
  const to  = new Date();
  const from = new Date();
  if (preset === '7d')  from.setDate(from.getDate() - 6);
  if (preset === '30d') from.setDate(from.getDate() - 29);
  if (preset === '90d') from.setDate(from.getDate() - 89);
  return { from: isoDate(from), to: isoDate(to) };
}

// ─── Mini bar chart (CSS) ─────────────────────────────────────────────────────

function BarChart({
  data,
  labelKey,
  valueKey,
  color = '#3b82f6',
}: {
  data:     Record<string, unknown>[];
  labelKey: string;
  valueKey: string;
  color?:   string;
}) {
  const max = Math.max(...data.map((d) => Number(d[valueKey]) || 0), 1);
  return (
    <div className={styles.barChart}>
      {data.map((d, i) => {
        const val = Number(d[valueKey]) || 0;
        const pct = (val / max) * 100;
        return (
          <div key={i} className={styles.barItem}>
            <div className={styles.barOuter}>
              <div
                className={styles.barFill}
                style={{ height: `${pct}%`, background: color }}
                title={`${d[labelKey]}: ${val}`}
              />
            </div>
            <span className={styles.barLabel}>{String(d[labelKey])}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── SVG sparkline / area chart ───────────────────────────────────────────────

function TrendChart({ data }: { data: { date: string; total: number; answered: number }[] }) {
  const W = 600; const H = 100; const pad = 8;
  if (data.length < 2) return <p className={styles.empty}>Sin datos suficientes para la gráfica</p>;

  const maxVal = Math.max(...data.map((d) => d.total), 1);
  const xStep  = (W - pad * 2) / (data.length - 1);
  const yOf    = (v: number) => H - pad - ((v / maxVal) * (H - pad * 2));

  const pts  = (key: 'total' | 'answered') =>
    data.map((d, i) => `${pad + i * xStep},${yOf(d[key])}`).join(' ');
  const area = (key: 'total' | 'answered') => {
    const first = `${pad},${H - pad}`;
    const last  = `${pad + (data.length - 1) * xStep},${H - pad}`;
    return `${first} ${pts(key)} ${last}`;
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.trendSvg} preserveAspectRatio="none">
      <polygon points={area('total')}    fill="#3b82f6" fillOpacity="0.15" />
      <polyline points={pts('total')}    fill="none" stroke="#3b82f6" strokeWidth="2" />
      <polygon points={area('answered')} fill="#22c55e" fillOpacity="0.15" />
      <polyline points={pts('answered')} fill="none" stroke="#22c55e" strokeWidth="2" />
    </svg>
  );
}

// ─── Stat tile ────────────────────────────────────────────────────────────────

function StatTile({
  label, value, accent, sub,
}: { label: string; value: string | number; accent: string; sub?: string }) {
  return (
    <div className={styles.statTile} style={{ '--accent': accent } as React.CSSProperties}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
      {sub && <span className={styles.statSub}>{sub}</span>}
    </div>
  );
}

// ─── Historical section ───────────────────────────────────────────────────────

function HistoricalSection({ agentNames }: { agentNames: Map<string, string> }) {
  const dispatch  = useAppDispatch();
  const { historical, historicalLoading, historicalError } =
    useAppSelector((s) => s.supervisor);

  const [preset, setPreset] = useState('7d');

  const load = useCallback((p: string) => {
    const { from, to } = dateRangeFromPreset(p);
    dispatch(fetchHistoricalStats({ from, to }));
  }, [dispatch]);

  useEffect(() => { load(preset); }, []);

  const handlePreset = (p: string) => { setPreset(p); load(p); };

  const h = historical;

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Histórico de llamadas</h2>
        <div className={styles.presetBtns}>
          {(['7d', '30d', '90d'] as const).map((p) => (
            <button
              key={p}
              className={`${styles.presetBtn} ${preset === p ? styles.presetBtnActive : ''}`}
              onClick={() => handlePreset(p)}
              disabled={historicalLoading}
            >
              {p === '7d' ? 'Últimos 7 días' : p === '30d' ? '30 días' : '90 días'}
            </button>
          ))}
        </div>
      </div>

      {historicalLoading && <p className={styles.loadingText}>Cargando datos…</p>}
      {historicalError   && <p className={styles.errorText}>{historicalError}</p>}

      {h && !historicalLoading && (
        <>
          {/* KPIs del período */}
          <div className={styles.statsGrid}>
            <StatTile label="Total llamadas"   value={h.total}               accent="#3b82f6" />
            <StatTile label="Contestadas"      value={h.answered}            accent="#22c55e" />
            <StatTile label="Tasa respuesta"   value={`${h.answerRate}%`}    accent="#10b981" />
            <StatTile label="Duración media"   value={fmtSecs(h.avgDuration)} accent="#f59e0b" />
          </div>

          {/* Tendencia diaria */}
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Tendencia diaria</h3>
            <div className={styles.trendLegend}>
              <span><span className={styles.dot} style={{ background: '#3b82f6' }} /> Total</span>
              <span><span className={styles.dot} style={{ background: '#22c55e' }} /> Contestadas</span>
            </div>
            <TrendChart data={h.dailyTrend} />
            <div className={styles.trendDates}>
              <span>{h.dailyTrend[0]?.date ?? ''}</span>
              <span>{h.dailyTrend[h.dailyTrend.length - 1]?.date ?? ''}</span>
            </div>
          </div>

          <div className={styles.chartsRow}>
            {/* Distribución horaria */}
            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle}>Distribución por hora</h3>
              <BarChart
                data={h.hourlyDistribution.map((b) => ({ label: `${b.hour}h`, value: b.total }))}
                labelKey="label"
                valueKey="value"
                color="#6366f1"
              />
            </div>

            {/* Disposiciones */}
            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle}>Disposiciones</h3>
              {h.dispositionBreakdown.length === 0 ? (
                <p className={styles.empty}>Sin datos de disposición</p>
              ) : (
                <div className={styles.dispList}>
                  {h.dispositionBreakdown.slice(0, 8).map((d) => (
                    <div key={d.label} className={styles.dispRow}>
                      <span className={styles.dispLabel}>{d.label}</span>
                      <div className={styles.dispBarWrap}>
                        <div
                          className={styles.dispBar}
                          style={{
                            width: `${(d.count / (h.dispositionBreakdown[0]?.count || 1)) * 100}%`,
                            background: d.color,
                          }}
                        />
                      </div>
                      <span className={styles.dispCount}>{d.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Ranking de agentes */}
          {h.agentRanking.length > 0 && (
            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle}>Ranking de agentes</h3>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Agente</th>
                      <th>Total</th>
                      <th>Contestadas</th>
                      <th>% respuesta</th>
                      <th>Dur. media</th>
                    </tr>
                  </thead>
                  <tbody>
                    {h.agentRanking.map((a, i) => (
                      <tr key={a.agentId}>
                        <td className={styles.rankNum}>{i + 1}</td>
                        <td>
                          <span className={styles.agentName}>
                            {agentNames.get(a.agentId) ?? a.agentId.slice(0, 8) + '…'}
                          </span>
                        </td>
                        <td>{a.total}</td>
                        <td>{a.answered}</td>
                        <td>{a.total > 0 ? `${Math.round((a.answered / a.total) * 100)}%` : '—'}</td>
                        <td>{fmtSecs(a.avgDuration)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function SupervisorPage() {
  const dispatch     = useAppDispatch();
  const { stats, activeCalls, agents, loading, error, lastRefresh } =
    useAppSelector((s) => s.supervisor);
  const wsConnected  = useAppSelector((s) => s.calls.wsConnected);
  const queueEntries = useAppSelector((s) => s.calls.queueEntries);

  const { statuses, startListening, stopListening } = useMonitorReceiver();

  // Drawer de detalle por agente
  const [drawerAgentId,   setDrawerAgentId]   = useState<string | null>(null);
  const [drawerAgentName, setDrawerAgentName] = useState('');

  // Tick cada segundo para duración en vivo
  useTicker(1000);

  const refresh = useCallback(() => { dispatch(fetchSupervisorData()); }, [dispatch]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [refresh]);

  // Carga inicial de la cola de entrantes (las actualizaciones en vivo llegan por WS)
  useEffect(() => {
    getInboundQueue().then((q) => dispatch(setQueueEntries(q))).catch(() => {});
  }, [dispatch]);

  // Mapa agentId → nombre para el ranking histórico
  const agentNames = new Map(
    agents
      .filter((a) => a.agentName)
      .map((a) => [a.agentId, a.agentName!]),
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Panel de Supervisor</h1>
          <div className={styles.headerMeta}>
            {lastRefresh && (
              <span className={styles.refresh}>
                Actualizado {new Date(lastRefresh).toLocaleTimeString('es-ES')}
              </span>
            )}
            <span className={`${styles.wsIndicator} ${wsConnected ? styles.wsOn : styles.wsOff}`}>
              {wsConnected ? '● En vivo' : '○ Sin conexión'}
            </span>
          </div>
        </div>
        <button className={styles.refreshBtn} onClick={refresh} disabled={loading}>
          {loading ? 'Cargando…' : '↻ Actualizar'}
        </button>
      </header>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {/* ── Stats de hoy ── */}
      {stats && (
        <section className={styles.statsGrid}>
          <StatTile label="Llamadas hoy"     value={stats.today.total}        accent="#3b82f6" />
          <StatTile label="Contestadas"      value={stats.today.answered}     accent="#22c55e" />
          <StatTile label="Tasa respuesta"   value={`${stats.today.answerRate}%`} accent="#10b981" />
          <StatTile label="Duración media"   value={fmtSecs(stats.today.avgDuration)} accent="#f59e0b" />
          <StatTile label="Llamadas activas" value={stats.today.activeCalls}  accent="#8b5cf6" />
          <StatTile
            label="Agentes online"
            value={stats.agents.online}
            accent="#6366f1"
            sub={`${stats.agents.available} disp · ${stats.agents.busy} en llamada · ${stats.agents.paused} pausa`}
          />
        </section>
      )}

      {/* ── Cola de llamadas entrantes ── */}
      {queueEntries.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            En cola de espera
            <span className={styles.badge}>{queueEntries.length}</span>
          </h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr><th>Posición</th><th>Número</th></tr>
              </thead>
              <tbody>
                {queueEntries
                  .slice()
                  .sort((a, b) => a.position - b.position)
                  .map((q) => (
                    <tr key={q.callId}>
                      <td>{q.position}</td>
                      <td>{q.fromPhone}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Llamadas activas ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Llamadas activas
          <span className={styles.badge}>{activeCalls.length}</span>
        </h2>
        {activeCalls.length === 0 ? (
          <p className={styles.empty}>Sin llamadas activas en este momento</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Agente</th>
                  <th>Número</th>
                  <th>Estado</th>
                  <th>Dirección</th>
                  <th>Duración</th>
                  <th>Monitor</th>
                </tr>
              </thead>
              <tbody>
                {activeCalls.map((call) => {
                  const monStatus    = statuses[call.id];
                  const isConnecting = monStatus === 'connecting';
                  const isConnected  = monStatus === 'connected';
                  const isMonitoring = isConnecting || isConnected;
                  const agentLabel   = agentNames.get(call.agentId) ??
                    (call.agentName || call.agentId.slice(0, 8) + '…');
                  return (
                    <tr key={call.id}>
                      <td className={styles.agentCell}>
                        <span
                          className={styles.statusDot}
                          style={{ background: STATUS_COLORS[call.agentCurrentStatus] ?? '#6b7280' }}
                        />
                        <span className={styles.agentName}>{agentLabel}</span>
                      </td>
                      <td>{call.clientPhone}</td>
                      <td>
                        <span className={`${styles.callStatus} ${styles[`callStatus_${call.status}`]}`}>
                          {call.status}
                        </span>
                      </td>
                      <td>{call.direction === 'outbound' ? '↑ Saliente' : '↓ Entrante'}</td>
                      <td className={styles.duration}>{liveDuration(call.startedAt)}</td>
                      <td className={styles.monitorCell}>
                        {call.monitorCount ? (
                          <span className={styles.monitorBadge} title="Supervisores escuchando">
                            👁 {call.monitorCount}
                          </span>
                        ) : null}
                        {isMonitoring ? (
                          <button
                            className={styles.stopBtn}
                            onClick={() => stopListening(call.id)}
                            disabled={isConnecting}
                          >
                            {isConnecting ? '…' : '⏹ Parar'}
                          </button>
                        ) : (
                          <>
                            <button
                              className={styles.listenBtn}
                              onClick={() => startListening(call.id, call.agentId, 'silent')}
                            >
                              🎧 Escuchar
                            </button>
                            <button
                              className={styles.whisperBtn}
                              onClick={() => startListening(call.id, call.agentId, 'whisper')}
                            >
                              🎤 Susurrar
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Estado de agentes ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Estado de agentes
          <span className={styles.badge}>{agents.length}</span>
        </h2>
        {agents.length === 0 ? (
          <p className={styles.empty}>No hay sesiones de agente registradas</p>
        ) : (
          <div className={styles.agentsGrid}>
            {agents.map((agent) => {
              const activeCall = activeCalls.find((c) => c.agentId === agent.agentId);
              const label      = agent.agentName ?? agent.agentId.slice(0, 8) + '…';
              return (
                <div
                  key={agent.agentId}
                  className={styles.agentCard}
                  style={{ cursor: 'pointer' }}
                  onClick={() => { setDrawerAgentId(agent.agentId); setDrawerAgentName(label); }}
                  title="Ver llamadas del agente"
                >
                  <div className={styles.agentCardHeader}>
                    <span
                      className={styles.statusDotLarge}
                      style={{ background: STATUS_COLORS[agent.status] ?? '#6b7280' }}
                    />
                    <span className={styles.agentName}>{label}</span>
                    <span
                      className={styles.agentStatusBadge}
                      style={{ color: STATUS_COLORS[agent.status] ?? '#6b7280' }}
                    >
                      {STATUS_LABELS[agent.status] ?? agent.status}
                    </span>
                  </div>
                  <div className={styles.statusSince}>
                    {agent.status === 'paused' && agent.pauseReason
                      ? `${PAUSE_REASON_LABELS[agent.pauseReason] ?? agent.pauseReason} · hace ${timeSince(agent.updatedAt)}`
                      : `Desde hace ${timeSince(agent.updatedAt)}`}
                  </div>
                  {activeCall ? (
                    <div className={styles.activeCallInfo}>
                      <span className={styles.phoneSmall}>{activeCall.clientPhone}</span>
                      <span className={styles.durationSmall}>{liveDuration(activeCall.startedAt)}</span>
                    </div>
                  ) : (
                    <div className={styles.noCall}>Sin llamada activa</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Histórico ── */}
      <HistoricalSection agentNames={agentNames} />

      {/* ── Drawer detalle agente ── */}
      <AgentCallsDrawer
        agentId={drawerAgentId}
        agentName={drawerAgentName}
        onClose={() => setDrawerAgentId(null)}
      />
    </div>
  );
}
