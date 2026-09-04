import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getHistoricalStats } from '@/features/calls/services/reportsService';
import type { HistoricalStats, HourlyBucket, DailyBucket, DispositionBucket, AgentRankEntry } from '@/features/calls/services/reportsService';
import s from './ReportsPage.module.scss';

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtDuration(secs: number): string {
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const remaining = secs % 60;
  return remaining > 0 ? `${m}m ${remaining}s` : `${m}m`;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function presetRange(preset: string): { from: string; to: string } {
  const now = new Date();
  const today = isoDate(now);
  if (preset === 'today') return { from: today, to: today };
  if (preset === 'week') {
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    return { from: isoDate(start), to: today };
  }
  if (preset === 'month') {
    const start = new Date(now);
    start.setDate(now.getDate() - 29);
    return { from: isoDate(start), to: today };
  }
  return { from: today, to: today };
}

// ── SVG Chart helpers ─────────────────────────────────────────────────────────

const W = 560;
const H = 180;
const PAD = { top: 12, right: 16, bottom: 36, left: 40 };

function BarChart({ data, xKey, yKey, color = '#2563eb', label }: {
  data: Record<string, number>[];
  xKey: string;
  yKey: string;
  color?: string;
  label?: string;
}) {
  const vals = data.map((d) => d[yKey] as number);
  const max = Math.max(...vals, 1);
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const barW = Math.max(4, plotW / data.length - 2);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={s.chart} aria-label={label}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const y = PAD.top + plotH * (1 - t);
        return (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="currentColor" strokeOpacity={0.08} />
            <text x={PAD.left - 4} y={y + 4} textAnchor="end" fontSize={9} fill="currentColor" fillOpacity={0.45}>
              {Math.round(max * t)}
            </text>
          </g>
        );
      })}
      {/* Bars */}
      {data.map((d, i) => {
        const val = d[yKey] as number;
        const bh = (val / max) * plotH;
        const x = PAD.left + (i / data.length) * plotW + (plotW / data.length - barW) / 2;
        const y = PAD.top + plotH - bh;
        const xLabel = String(d[xKey]);
        const showLabel = data.length <= 32 ? true : i % Math.ceil(data.length / 16) === 0;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bh} rx={2} fill={color} fillOpacity={0.85} />
            {showLabel && (
              <text x={x + barW / 2} y={H - PAD.bottom + 12} textAnchor="middle" fontSize={9} fill="currentColor" fillOpacity={0.55}>
                {xLabel}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function LineAreaChart({ data, label }: { data: DailyBucket[]; label?: string }) {
  const totals = data.map((d) => d.total);
  const answers = data.map((d) => d.answered);
  const max = Math.max(...totals, 1);
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const pts = (vals: number[]) =>
    vals.map((v, i) => {
      const x = PAD.left + (i / Math.max(data.length - 1, 1)) * plotW;
      const y = PAD.top + plotH * (1 - v / max);
      return `${x},${y}`;
    });

  const area = (vals: number[]) => {
    if (vals.length === 0) return '';
    const ps = pts(vals);
    const first = ps[0].split(',');
    const last = ps[ps.length - 1].split(',');
    return `M${first[0]},${PAD.top + plotH} L${ps.join(' L')} L${last[0]},${PAD.top + plotH} Z`;
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={s.chart} aria-label={label}>
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const y = PAD.top + plotH * (1 - t);
        return (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="currentColor" strokeOpacity={0.08} />
            <text x={PAD.left - 4} y={y + 4} textAnchor="end" fontSize={9} fill="currentColor" fillOpacity={0.45}>
              {Math.round(max * t)}
            </text>
          </g>
        );
      })}
      <path d={area(totals)} fill="#2563eb" fillOpacity={0.12} />
      <path d={area(answers)} fill="#16a34a" fillOpacity={0.15} />
      <polyline points={pts(totals).join(' ')} fill="none" stroke="#2563eb" strokeWidth={2} strokeLinejoin="round" />
      <polyline points={pts(answers).join(' ')} fill="none" stroke="#16a34a" strokeWidth={2} strokeLinejoin="round" />
      {data.map((d, i) => {
        const x = PAD.left + (i / Math.max(data.length - 1, 1)) * plotW;
        const showLabel = data.length <= 14 || i % Math.ceil(data.length / 10) === 0;
        return showLabel ? (
          <text key={i} x={x} y={H - PAD.bottom + 12} textAnchor="middle" fontSize={8} fill="currentColor" fillOpacity={0.5}>
            {d.date.slice(5)}
          </text>
        ) : null;
      })}
    </svg>
  );
}

const PIE_R = 70;
const PIE_CX = 90;
const PIE_CY = 90;

function PieChart({ data }: { data: DispositionBucket[] }) {
  const total = data.reduce((s, d) => s + d.count, 0) || 1;
  const slices: { path: string; color: string; label: string; pct: number }[] = [];
  let angle = -Math.PI / 2;

  for (const d of data) {
    const pct = d.count / total;
    const sweep = pct * 2 * Math.PI;
    const x1 = PIE_CX + PIE_R * Math.cos(angle);
    const y1 = PIE_CY + PIE_R * Math.sin(angle);
    angle += sweep;
    const x2 = PIE_CX + PIE_R * Math.cos(angle);
    const y2 = PIE_CY + PIE_R * Math.sin(angle);
    const large = sweep > Math.PI ? 1 : 0;
    const path = `M${PIE_CX},${PIE_CY} L${x1},${y1} A${PIE_R},${PIE_R} 0 ${large},1 ${x2},${y2} Z`;
    slices.push({ path, color: d.color, label: d.label, pct: Math.round(pct * 100) });
  }

  return (
    <div className={s.pieWrap}>
      <svg viewBox="0 0 180 180" className={s.pieSvg}>
        {slices.map((sl, i) => (
          <path key={i} d={sl.path} fill={sl.color} stroke="#fff" strokeWidth={1} />
        ))}
        {data.length === 0 && <circle cx={PIE_CX} cy={PIE_CY} r={PIE_R} fill="#e5e7eb" />}
      </svg>
      <ul className={s.pieLegend}>
        {slices.map((sl, i) => (
          <li key={i} className={s.pieLegendItem}>
            <span className={s.pieDot} style={{ background: sl.color }} />
            <span className={s.pieLabel}>{sl.label}</span>
            <span className={s.piePct}>{sl.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HBarChart({ data }: { data: AgentRankEntry[] }) {
  const shown = data.slice(0, 10);
  const max = Math.max(...shown.map((d) => d.total), 1);
  const rowH = 28;
  const labelW = 100;
  const barAreaW = 300;
  const totalH = shown.length * rowH + 8;

  return (
    <svg viewBox={`0 0 ${labelW + barAreaW + 60} ${totalH}`} className={s.hbarChart}>
      {shown.map((d, i) => {
        const y = i * rowH + 4;
        const bw = (d.total / max) * barAreaW;
        const aw = (d.answered / max) * barAreaW;
        const name = d.agentId.slice(0, 12);
        return (
          <g key={d.agentId}>
            <text x={labelW - 6} y={y + 16} textAnchor="end" fontSize={10} fill="currentColor" fillOpacity={0.7}>{name}</text>
            <rect x={labelW} y={y + 6} width={bw} height={14} rx={2} fill="#2563eb" fillOpacity={0.25} />
            <rect x={labelW} y={y + 6} width={aw} height={14} rx={2} fill="#2563eb" fillOpacity={0.75} />
            <text x={labelW + bw + 4} y={y + 16} fontSize={10} fill="currentColor" fillOpacity={0.6}>{d.total}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type Preset = 'today' | 'week' | 'month' | 'custom';

export default function ReportsPage() {
  const [preset, setPreset]     = useState<Preset>('month');
  const [customFrom, setFrom]   = useState('');
  const [customTo, setTo]       = useState('');
  const [stats, setStats]       = useState<HistoricalStats | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const printRef                = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    let from: string;
    let to: string;
    if (preset === 'custom') {
      if (!customFrom || !customTo) return;
      from = customFrom;
      to   = customTo;
    } else {
      ({ from, to } = presetRange(preset));
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getHistoricalStats({ from, to });
      setStats(data);
    } catch {
      setError('Error al cargar métricas');
    } finally {
      setLoading(false);
    }
  }, [preset, customFrom, customTo]);

  useEffect(() => {
    if (preset !== 'custom') load();
  }, [preset, load]);

  const hourlyData = (stats?.hourlyDistribution ?? []).map((b: HourlyBucket) => ({
    hour: `${b.hour}h`,
    total: b.total,
    answered: b.answered,
  }));

  return (
    <div className={s.page} ref={printRef}>
      <div className={s.header}>
        <h1 className={s.title}>Reportes de llamadas</h1>
        <button className={s.printBtn} onClick={() => window.print()}>Exportar PDF</button>
      </div>

      {/* Preset selector */}
      <div className={s.toolbar}>
        <div className={s.presets}>
          {(['today', 'week', 'month', 'custom'] as Preset[]).map((p) => (
            <button
              key={p}
              className={`${s.presetBtn} ${preset === p ? s.presetActive : ''}`}
              onClick={() => setPreset(p)}
            >
              {p === 'today' ? 'Hoy' : p === 'week' ? 'Esta semana' : p === 'month' ? 'Último mes' : 'Personalizado'}
            </button>
          ))}
        </div>
        {preset === 'custom' && (
          <div className={s.customRange}>
            <input type="date" className={s.dateInput} value={customFrom} onChange={(e) => setFrom(e.target.value)} />
            <span className={s.rangeSep}>–</span>
            <input type="date" className={s.dateInput} value={customTo} onChange={(e) => setTo(e.target.value)} />
            <button className={s.applyBtn} onClick={load}>Aplicar</button>
          </div>
        )}
      </div>

      {error && <div className={s.error}>{error}</div>}
      {loading && <div className={s.loading}>Cargando métricas…</div>}

      {stats && !loading && (
        <>
          {/* KPI tiles */}
          <div className={s.kpiGrid}>
            <div className={s.kpiCard}>
              <span className={s.kpiLabel}>Total llamadas</span>
              <span className={s.kpiValue}>{stats.total.toLocaleString()}</span>
            </div>
            <div className={s.kpiCard}>
              <span className={s.kpiLabel}>Contestadas</span>
              <span className={`${s.kpiValue} ${s.kpiGreen}`}>{stats.answered.toLocaleString()}</span>
            </div>
            <div className={s.kpiCard}>
              <span className={s.kpiLabel}>Tasa de contacto</span>
              <span className={`${s.kpiValue} ${stats.answerRate >= 50 ? s.kpiGreen : s.kpiAmber}`}>
                {stats.answerRate}%
              </span>
            </div>
            <div className={s.kpiCard}>
              <span className={s.kpiLabel}>Duración media</span>
              <span className={s.kpiValue}>{fmtDuration(stats.avgDuration)}</span>
            </div>
          </div>

          {/* Charts row 1 */}
          <div className={s.chartsRow}>
            <div className={s.chartCard}>
              <div className={s.chartTitle}>Tendencia diaria</div>
              <LineAreaChart data={stats.dailyTrend} label="Tendencia diaria" />
              <div className={s.chartLegend}>
                <span className={s.legendDot} style={{ background: '#2563eb' }} /> Total
                <span className={s.legendDot} style={{ background: '#16a34a' }} /> Contestadas
              </div>
            </div>
            <div className={s.chartCard}>
              <div className={s.chartTitle}>Distribución horaria</div>
              <BarChart
                data={hourlyData}
                xKey="hour"
                yKey="total"
                color="#6366f1"
                label="Distribución horaria"
              />
            </div>
          </div>

          {/* Charts row 2 */}
          <div className={s.chartsRow}>
            <div className={s.chartCard}>
              <div className={s.chartTitle}>Disposición de llamadas</div>
              <PieChart data={stats.dispositionBreakdown} />
            </div>
            <div className={s.chartCard}>
              <div className={s.chartTitle}>Ranking de agentes</div>
              {stats.agentRanking.length === 0 ? (
                <p className={s.empty}>Sin datos</p>
              ) : (
                <>
                  <HBarChart data={stats.agentRanking} />
                  <div className={s.chartLegend}>
                    <span className={s.legendDot} style={{ background: '#2563ebaa' }} /> Total
                    <span className={s.legendDot} style={{ background: '#2563eb' }} /> Contestadas
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Agent table */}
          {stats.agentRanking.length > 0 && (
            <div className={s.tableCard}>
              <div className={s.tableTitle}>Detalle por agente</div>
              <div className={s.tableWrap}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Agente</th>
                      <th>Total</th>
                      <th>Contestadas</th>
                      <th>Tasa</th>
                      <th>Duración media</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.agentRanking.map((ag: AgentRankEntry, idx: number) => {
                      const rate = ag.total > 0 ? Math.round((ag.answered / ag.total) * 100) : 0;
                      return (
                        <tr key={ag.agentId}>
                          <td className={s.rankNum}>{idx + 1}</td>
                          <td className={s.agentId}>{ag.agentId}</td>
                          <td>{ag.total}</td>
                          <td>{ag.answered}</td>
                          <td>
                            <span className={`${s.ratePill} ${rate >= 50 ? s.rateGood : s.rateBad}`}>
                              {rate}%
                            </span>
                          </td>
                          <td>{fmtDuration(ag.avgDuration)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {!stats && !loading && !error && (
        <div className={s.empty}>Selecciona un rango de fechas para ver los reportes.</div>
      )}
    </div>
  );
}
