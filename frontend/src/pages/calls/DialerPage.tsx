import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { initiateCall } from '@/features/calls/callsSlice';
import {
  listDialLists, createDialList, updateDialList, deleteDialList,
  getNextEntry, skipEntry, markCalled, getDialListStats,
  addDialListEntries, startPredictive, stopPredictive,
} from '@/features/calls/services/dialerService';
import type { DialList, DialListEntry } from '@/features/calls/services/dialerService';
import { parseDialerExcel } from '@/utils/parseDialerExcel';
import s from './DialerPage.module.scss';

type View = 'lists' | 'active' | 'predictive';

const STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador', active: 'Activa', paused: 'Pausada', completed: 'Completada',
};

const STATUS_CLASS: Record<string, string> = {
  draft: '', active: 'active', paused: 'paused', completed: 'completed',
};

function StatsBar({ stats }: { stats: Record<string, number> }) {
  const total = Object.values(stats).reduce((a, b) => a + b, 0) || 1;
  const done = (stats.called ?? 0) + (stats.skipped ?? 0) + (stats.dnc ?? 0);
  const pct = Math.round((done / total) * 100);
  return (
    <div className={s.statsBar}>
      <div className={s.statsProgress}>
        <div className={s.statsProgressFill} style={{ width: `${pct}%` }} />
      </div>
      <div className={s.statsLabels}>
        <span className={s.statChip}>{stats.pending ?? 0} pendientes</span>
        <span className={`${s.statChip} ${s.chipGreen}`}>{stats.called ?? 0} llamadas</span>
        <span className={`${s.statChip} ${s.chipGray}`}>{stats.skipped ?? 0} omitidos</span>
        <span>{pct}% completado</span>
      </div>
    </div>
  );
}

function DropRateBar({ rate }: { rate: number }) {
  const color = rate <= 1 ? '#16a34a' : rate <= 3 ? '#d97706' : '#dc2626';
  return (
    <div className={s.dropBarWrap}>
      <div className={s.dropBar}>
        <div className={s.dropBarFill} style={{ width: `${Math.min(rate * 10, 100)}%`, background: color }} />
        <div className={s.dropBarLimit} title="Límite legal 3%" />
      </div>
      <span className={s.dropBarLabel} style={{ color }}>{rate.toFixed(1)}%</span>
    </div>
  );
}

export default function DialerPage() {
  const dispatch                   = useAppDispatch();
  const predictiveStats            = useAppSelector((s) => s.calls.predictiveStats);
  const [view, setView]            = useState<View>('lists');
  const [lists, setLists]         = useState<DialList[]>([]);
  const [activeList, setActiveList] = useState<DialList | null>(null);
  const [nextEntry, setNextEntry] = useState<DialListEntry | null>(null);
  const [stats, setStats]         = useState<Record<string, number>>({});
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [newName, setNewName]     = useState('');
  const [showNew, setShowNew]     = useState(false);
  const [bulkText, setBulkText]   = useState('');
  const [showBulk, setShowBulk]   = useState(false);
  const [calling, setCalling]     = useState(false);
  const [excelMsg, setExcelMsg]   = useState<string | null>(null);
  const excelInputRef             = useRef<HTMLInputElement>(null);

  const loadLists = useCallback(async () => {
    setLoading(true);
    try { setLists(await listDialLists()); }
    catch { setError('Error al cargar listas'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadLists(); }, [loadLists]);

  const loadNext = useCallback(async (list: DialList) => {
    const [entry, st] = await Promise.all([
      getNextEntry(list.id),
      getDialListStats(list.id),
    ]);
    setNextEntry(entry);
    setStats(st);
  }, []);

  const openList = async (list: DialList) => {
    setActiveList(list);
    setView('active');
    await loadNext(list);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const list = await createDialList(newName.trim());
    setLists((prev) => [list, ...prev]);
    setNewName('');
    setShowNew(false);
  };

  const handleDelete = async (id: string) => {
    await deleteDialList(id);
    setLists((prev) => prev.filter((l) => l.id !== id));
  };

  const handleStatusChange = async (list: DialList, status: string) => {
    const updated = await updateDialList(list.id, { status: status as any });
    setLists((prev) => prev.map((l) => l.id === updated.id ? updated : l));
    if (activeList?.id === list.id) setActiveList(updated);
  };

  const handleCall = async () => {
    if (!nextEntry || !activeList) return;
    setCalling(true);
    try {
      const result = await dispatch(initiateCall({ clientPhone: nextEntry.phone, clientId: nextEntry.clientId ?? undefined, saleId: nextEntry.saleId ?? undefined })) as any;
      const callId = result.payload?.id;
      await markCalled(activeList.id, nextEntry.id, { callId });
      await loadNext(activeList);
    } catch {
      setError('Error al iniciar llamada');
    } finally {
      setCalling(false);
    }
  };

  const handleSkip = async () => {
    if (!nextEntry || !activeList) return;
    await skipEntry(activeList.id, nextEntry.id);
    await loadNext(activeList);
  };

  const handleExcelFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeList) return;
    e.target.value = '';
    setExcelMsg('Procesando Excel…');
    try {
      const { entries, skipped, total, truncated } = await parseDialerExcel(file);
      if (entries.length === 0) {
        setExcelMsg(`Sin teléfonos válidos (${total} filas leídas, ${skipped} sin teléfono)`);
        return;
      }
      await addDialListEntries(activeList.id, entries);
      await loadNext(activeList);
      const msg = `✓ ${entries.length} entradas añadidas${skipped > 0 ? ` · ${skipped} filas sin teléfono omitidas` : ''}${truncated ? ' · truncado a 5000 filas' : ''}`;
      setExcelMsg(msg);
    } catch (err: unknown) {
      setExcelMsg(`✕ ${err instanceof Error ? err.message : 'Error al procesar el Excel'}`);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkText.trim() || !activeList) return;
    const lines = bulkText.split('\n').map((l) => l.trim()).filter(Boolean);
    const entries = lines.map((line) => {
      const [phone, clientName] = line.split(',').map((p) => p.trim());
      return { phone, clientName };
    });
    await addDialListEntries(activeList.id, entries);
    setBulkText('');
    setShowBulk(false);
    await loadNext(activeList);
  };

  const handleStartPredictive = async () => {
    if (!activeList) return;
    await startPredictive(activeList.id);
    setView('predictive');
  };

  const handleStopPredictive = async () => {
    if (!activeList) return;
    await stopPredictive(activeList.id);
    setView('active');
  };

  if (view === 'predictive' && activeList) {
    const ps = predictiveStats?.listId === activeList.id ? predictiveStats : null;
    return (
      <div className={s.page}>
        <div className={s.header}>
          <button className={s.backBtn} onClick={() => setView('active')}>← Preview</button>
          <h1 className={s.title}>Marcador Predictivo — {activeList.name}</h1>
          <span className={s.mockBadge}>MOCK</span>
        </div>

        <div className={s.predictiveGrid}>
          {/* KPIs */}
          <div className={s.kpiCard}>
            <span className={s.kpiLabel}>Marcadas</span>
            <span className={s.kpiVal}>{ps?.dialed ?? 0}</span>
          </div>
          <div className={s.kpiCard}>
            <span className={s.kpiLabel}>Contestadas</span>
            <span className={`${s.kpiVal} ${s.kpiGreen}`}>{ps?.answered ?? 0}</span>
          </div>
          <div className={s.kpiCard}>
            <span className={s.kpiLabel}>Abandonadas</span>
            <span className={`${s.kpiVal} ${(ps?.dropped ?? 0) > 0 ? s.kpiRed : ''}`}>{ps?.dropped ?? 0}</span>
          </div>
          <div className={s.kpiCard}>
            <span className={s.kpiLabel}>AMD detectado</span>
            <span className={s.kpiVal}>{ps?.amdDetected ?? 0}</span>
          </div>
          <div className={s.kpiCard}>
            <span className={s.kpiLabel}>En vuelo</span>
            <span className={`${s.kpiVal} ${s.kpiBlue}`}>{ps?.inFlight ?? 0}</span>
          </div>
          <div className={s.kpiCard}>
            <span className={s.kpiLabel}>Agentes libres</span>
            <span className={s.kpiVal}>{ps?.availAgents ?? 0}</span>
          </div>
          <div className={s.kpiCard}>
            <span className={s.kpiLabel}>Tasa contacto</span>
            <span className={s.kpiVal}>{ps?.answerRate ?? 0}%</span>
          </div>
          <div className={s.kpiCard}>
            <span className={s.kpiLabel}>Multiplicador</span>
            <span className={s.kpiVal}>×{ps?.multiplier ?? 1}</span>
          </div>
        </div>

        {/* Drop rate */}
        <div className={s.dropSection}>
          <div className={s.dropTitle}>
            Tasa de abandono
            <span className={s.dropLimit}>Límite legal España: 3%</span>
          </div>
          <DropRateBar rate={ps?.dropRate ?? 0} />
        </div>

        {/* Algorithm explanation */}
        <div className={s.algoCard}>
          <div className={s.algoTitle}>Cómo funciona el algoritmo mock</div>
          <ul className={s.algoList}>
            <li>Cada 4 segundos cuenta agentes con estado <strong>available</strong></li>
            <li>Calcula: <code>llamadas a marcar = agentes × (1 / tasa_contestación)</code></li>
            <li>El MockProvider simula ~80% de tasa de respuesta con delays aleatorios</li>
            <li>25% de las llamadas contestadas se simulan como buzón (AMD) y se cuelgan</li>
            <li>Si una llamada contesta pero no hay agente libre → abandono (+drop rate)</li>
            <li>El multiplicador se limita a ×3 para no superar el 3% de drop rate legal</li>
          </ul>
        </div>

        <button
          className={s.stopPredBtn}
          onClick={handleStopPredictive}
        >
          ⏹ Parar marcador predictivo
        </button>
      </div>
    );
  }

  if (view === 'active' && activeList) {
    return (
      <div className={s.page}>
        <div className={s.header}>
          <button className={s.backBtn} onClick={() => setView('lists')}>← Listas</button>
          <h1 className={s.title}>{activeList.name}</h1>
          <select
            className={s.statusSelect}
            value={activeList.status}
            onChange={(e) => handleStatusChange(activeList, e.target.value)}
          >
            {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>

        {error && <div className={s.error}>{error}</div>}

        <StatsBar stats={stats} />

        {activeList.status === 'active' ? (
          nextEntry ? (
            <div className={s.contactCard}>
              <div className={s.contactHeader}>Próximo contacto</div>
              <div className={s.contactPhone}>{nextEntry.phone}</div>
              {nextEntry.clientName && <div className={s.contactName}>{nextEntry.clientName}</div>}
              {nextEntry.notes && <div className={s.contactNotes}>{nextEntry.notes}</div>}
              {nextEntry.attempts > 0 && (
                <div className={s.contactMeta}>Intentos anteriores: {nextEntry.attempts}</div>
              )}
              <div className={s.contactActions}>
                <button className={s.callBtn} onClick={handleCall} disabled={calling}>
                  {calling ? 'Llamando…' : '📞 Llamar'}
                </button>
                <button className={s.skipBtn} onClick={handleSkip} disabled={calling}>
                  Omitir →
                </button>
              </div>
            </div>
          ) : (
            <div className={s.doneCard}>
              🎉 Lista completada — no quedan contactos pendientes
            </div>
          )
        ) : (
          <div className={s.pausedCard}>
            La lista está {STATUS_LABEL[activeList.status].toLowerCase()}.
            {activeList.status !== 'completed' && (
              <button className={s.resumeBtn} onClick={() => handleStatusChange(activeList, 'active')}>
                Activar
              </button>
            )}
          </div>
        )}

        {/* Predictive mode button */}
        {activeList.status === 'active' && (
          <button className={s.predictiveBtn} onClick={handleStartPredictive}>
            ⚡ Activar marcador predictivo (mock)
          </button>
        )}

        {/* Bulk import */}
        <div className={s.bulkSection}>
          {/* Excel import */}
          <input
            ref={excelInputRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            onChange={handleExcelFile}
          />
          <button className={s.excelBtn} onClick={() => excelInputRef.current?.click()}>
            ↑ Importar Excel (plantilla CRM)
          </button>
          {excelMsg && (
            <div className={`${s.excelMsg} ${excelMsg.startsWith('✓') ? s.excelMsgOk : excelMsg.startsWith('✕') ? s.excelMsgErr : ''}`}>
              {excelMsg}
            </div>
          )}

          <button className={s.bulkBtn} onClick={() => setShowBulk((v) => !v)}>
            {showBulk ? 'Cerrar importación manual' : '+ Importar contactos (texto)'}
          </button>
          {showBulk && (
            <div className={s.bulkForm}>
              <p className={s.bulkHint}>Un contacto por línea: <code>número[, nombre]</code></p>
              <textarea
                className={s.bulkArea}
                rows={6}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="+34600000001, Ana García&#10;+34600000002"
              />
              <button className={s.bulkSave} onClick={handleBulkImport} disabled={!bulkText.trim()}>
                Importar
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>Preview Dialer</h1>
        <button className={s.newBtn} onClick={() => setShowNew((v) => !v)}>+ Nueva lista</button>
      </div>

      {error && <div className={s.error}>{error}</div>}

      {showNew && (
        <div className={s.newForm}>
          <input
            className={s.input}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nombre de la lista"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <button className={s.createBtn} onClick={handleCreate} disabled={!newName.trim()}>
            Crear
          </button>
        </div>
      )}

      {loading ? (
        <div className={s.empty}>Cargando listas…</div>
      ) : lists.length === 0 ? (
        <div className={s.empty}>No hay listas de marcado. Crea la primera.</div>
      ) : (
        <div className={s.listsGrid}>
          {lists.map((list) => (
            <div key={list.id} className={s.listCard}>
              <div className={s.listHeader}>
                <span className={s.listName}>{list.name}</span>
                <span className={`${s.listStatus} ${s[STATUS_CLASS[list.status]]}`}>
                  {STATUS_LABEL[list.status]}
                </span>
              </div>
              <div className={s.listMeta}>
                {list._count?.entries ?? 0} contactos
              </div>
              <div className={s.listActions}>
                <button className={s.openBtn} onClick={() => openList(list)}>
                  Abrir
                </button>
                <button className={s.deleteListBtn} onClick={() => handleDelete(list.id)}>
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
