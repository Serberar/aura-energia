import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  listCampaigns,
  createCampaign,
  startCampaign,
  stopCampaign,
  reimportCampaign,
  updateCampaign,
  resetCampaign,
  getCampaignStatus,
  type Campaign,
  type CrmFilter,
} from '@/features/calls/services/campaignService';
import {
  addDialListEntries,
  getOrphanDialLists,
  startPredictive,
  stopPredictive,
  updateDialList,
  type OrphanList,
} from '@/features/calls/services/dialerService';
import { getAllSaleStatuses } from '@/features/saleStatus/services/saleStatusService';
import { getAllProducts } from '@/features/products/services/productService';
import type { SaleStatus, Product } from '@/types/sales';
import { useAppSelector } from '@/hooks/reduxHooks';
import { parseDialerExcel } from '@/utils/parseDialerExcel';
import s from './CampaignsPage.module.scss';

// ── helpers ───────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador', active: 'Activa', paused: 'Pausada',
  completed: 'Completada', cancelled: 'Cancelada',
};

function entryProgress(stats: Record<string, number> | null) {
  if (!stats) return { pct: 0, pending: 0, called: 0, total: 0 };
  const total   = Object.values(stats).reduce((a, b) => a + b, 0);
  const pending = stats.pending ?? 0;
  const called  = (stats.called ?? 0) + (stats.skipped ?? 0) + (stats.dnc ?? 0);
  const pct     = total > 0 ? Math.round((called / total) * 100) : 0;
  return { pct, pending, called, total };
}

// ── Normalized card item ──────────────────────────────────────────────────

interface CardItem {
  kind:          'campaign' | 'orphan';
  id:            string;
  listId:        string;
  name:          string;
  description:   string | null;
  status:        string;
  stats:         Record<string, number> | null;
  dialerRunning: boolean;
  dialerStats:   unknown;
  hasCrmFilter:  boolean;
  totalImported: number;
  maxAttempts:   number;
}

function fromCampaign(c: Campaign): CardItem {
  return {
    kind: 'campaign', id: c.id, listId: c.dialListId ?? '',
    name: c.name, description: c.description, status: c.status,
    stats: c.stats, dialerRunning: c.dialerRunning, dialerStats: c.dialerStats,
    hasCrmFilter: !!c.crmFilter, totalImported: c.totalImported,
    maxAttempts: c.maxAttempts,
  };
}

function fromOrphan(o: OrphanList): CardItem {
  const total = Object.values(o.stats ?? {}).reduce((a, b) => a + b, 0);
  return {
    kind: 'orphan', id: o.id, listId: o.id,
    name: o.name, description: null, status: o.status,
    stats: o.stats, dialerRunning: o.dialerRunning, dialerStats: o.dialerStats,
    hasCrmFilter: false, totalImported: total, maxAttempts: 3,
  };
}

// ── Filter chip helpers shared by both modals ─────────────────────────────

interface FilterChipsProps {
  label:    string;
  hint:     string;
  items:    { id: string; name: string; color?: string | null }[];
  selected: string[];
  onToggle: (id: string) => void;
  empty:    string;
}

function FilterChips({ label, hint, items, selected, onToggle, empty }: FilterChipsProps) {
  return (
    <div className={s.formGroup}>
      <label className={s.label}>
        {label}<span className={s.labelHint}> {hint}</span>
      </label>
      <div className={s.chipGrid}>
        {items.map((it) => (
          <button
            key={it.id} type="button"
            className={`${s.chip} ${selected.includes(it.id) ? s.chipActive : ''}`}
            style={selected.includes(it.id) && it.color ? { backgroundColor: it.color, borderColor: it.color, color: '#fff' } : {}}
            onClick={() => onToggle(it.id)}
          >
            {it.name}
          </button>
        ))}
        {items.length === 0 && <span className={s.emptyHint}>{empty}</span>}
      </div>
    </div>
  );
}

// ── Create modal ──────────────────────────────────────────────────────────

interface CreateModalProps {
  saleStatuses: SaleStatus[];
  products:     Product[];
  onClose:      () => void;
  onCreate:     (campaign: Campaign) => void;
}

function CreateModal({ saleStatuses, products, onClose, onCreate }: CreateModalProps) {
  const [name, setName]               = useState('');
  const [description, setDescription] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [maxResults, setMaxResults]   = useState(1000);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const toggle = (set: React.Dispatch<React.SetStateAction<string[]>>) => (id: string) =>
    set((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleSubmit = async () => {
    if (!name.trim()) { setError('El nombre es obligatorio'); return; }
    setLoading(true); setError(null);
    try {
      const crmFilter: CrmFilter = {
        ...(selectedStatuses.length > 0 && { saleStatusIds: selectedStatuses }),
        ...(selectedProducts.length > 0 && { productIds: selectedProducts }),
        maxResults,
      };
      const campaign = await createCampaign({
        name: name.trim(),
        description: description.trim() || undefined,
        crmFilter,
        maxAttempts,
      });
      onCreate(campaign);
    } catch {
      setError('Error al crear la campaña. Verifica la conexión con el sistema.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.modalBackdrop} onClick={onClose}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        <div className={s.modalHeader}>
          <h2 className={s.modalTitle}>Nueva campaña</h2>
          <button className={s.modalClose} onClick={onClose}>✕</button>
        </div>
        {error && <div className={s.modalError}>{error}</div>}
        <div className={s.formGroup}>
          <label className={s.label}>Nombre *</label>
          <input className={s.input} value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Campaña renovación contratos julio" autoFocus />
        </div>
        <div className={s.formGroup}>
          <label className={s.label}>Descripción</label>
          <textarea className={s.textarea} rows={2} value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Objetivo de la campaña (opcional)" />
        </div>
        <div className={s.formRow}>
          <div className={s.formGroup}>
            <label className={s.label}>Intentos por contacto</label>
            <input className={s.inputSmall} type="number" min={1} max={10}
              value={maxAttempts} onChange={(e) => setMaxAttempts(Number(e.target.value))} />
          </div>
          <div className={s.formGroup}>
            <label className={s.label}>Máximo de contactos</label>
            <input className={s.inputSmall} type="number" min={1} max={5000}
              value={maxResults} onChange={(e) => setMaxResults(Number(e.target.value))} />
          </div>
        </div>
        <FilterChips
          label="Solo clientes con este estado de venta"
          hint="(dejar vacío para todos)"
          items={saleStatuses}
          selected={selectedStatuses}
          onToggle={toggle(setSelectedStatuses)}
          empty="No hay estados configurados"
        />
        <FilterChips
          label="Solo clientes con este producto"
          hint="(dejar vacío para todos)"
          items={products}
          selected={selectedProducts}
          onToggle={toggle(setSelectedProducts)}
          empty="No hay productos configurados"
        />
        <div className={s.filterNote}>
          {selectedStatuses.length === 0 && selectedProducts.length === 0
            ? `Se añadirán todos los clientes que tengan teléfono (máximo ${maxResults})`
            : `Se añadirán clientes con${selectedStatuses.length > 0 ? ' el estado seleccionado' : ''}${selectedProducts.length > 0 ? (selectedStatuses.length > 0 ? ' y' : '') + ' el producto seleccionado' : ''}`}
        </div>
        <div className={s.modalActions}>
          <button className={s.cancelBtn} onClick={onClose} disabled={loading}>Cancelar</button>
          <button className={s.submitBtn} onClick={handleSubmit} disabled={loading || !name.trim()}>
            {loading ? 'Creando e importando…' : 'Crear campaña'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit modal ────────────────────────────────────────────────────────────

interface EditModalProps {
  item:         CardItem;
  saleStatuses: SaleStatus[];
  products:     Product[];
  onClose:      () => void;
  onSave:       (updates: { name: string; description: string; maxAttempts: number }) => Promise<void>;
}

function EditModal({ item, saleStatuses, products, onClose, onSave }: EditModalProps) {
  const [name, setName]               = useState(item.name);
  const [description, setDescription] = useState(item.description ?? '');
  const [maxAttempts, setMaxAttempts] = useState(item.maxAttempts);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  void saleStatuses; void products; // reserved for future filter editing

  const handleSubmit = async () => {
    if (!name.trim()) { setError('El nombre es obligatorio'); return; }
    setLoading(true); setError(null);
    try {
      await onSave({ name: name.trim(), description: description.trim(), maxAttempts });
      onClose();
    } catch {
      setError('No se pudo guardar. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.modalBackdrop} onClick={onClose}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        <div className={s.modalHeader}>
          <h2 className={s.modalTitle}>Editar campaña</h2>
          <button className={s.modalClose} onClick={onClose}>✕</button>
        </div>
        {error && <div className={s.modalError}>{error}</div>}
        <div className={s.formGroup}>
          <label className={s.label}>Nombre *</label>
          <input className={s.input} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        <div className={s.formGroup}>
          <label className={s.label}>Descripción</label>
          <textarea className={s.textarea} rows={2} value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Objetivo de la campaña (opcional)" />
        </div>
        {item.kind === 'campaign' && (
          <div className={s.formGroup}>
            <label className={s.label}>Intentos por contacto</label>
            <input className={s.inputSmall} type="number" min={1} max={10}
              value={maxAttempts} onChange={(e) => setMaxAttempts(Number(e.target.value))} />
          </div>
        )}
        <div className={s.modalActions}>
          <button className={s.cancelBtn} onClick={onClose} disabled={loading}>Cancelar</button>
          <button className={s.submitBtn} onClick={handleSubmit} disabled={loading || !name.trim()}>
            {loading ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Live stats bar ────────────────────────────────────────────────────────

function DropBar({ rate }: { rate: number }) {
  const color = rate <= 1 ? '#16a34a' : rate <= 3 ? '#d97706' : '#dc2626';
  return (
    <span className={s.dropBarInline}>
      <span className={s.dropFill} style={{ width: `${Math.min(rate * 10, 100)}%`, background: color }} />
      <span style={{ color, fontWeight: 600 }}>{rate.toFixed(1)}%</span>
    </span>
  );
}

// ── Campaign card ─────────────────────────────────────────────────────────

interface CardProps {
  item:       CardItem;
  busy:       string | undefined;
  excelMsg:   string | undefined;
  liveStats:  unknown;
  onStart:    () => void;
  onStop:     () => void;
  onReimport: () => void;
  onExcel:    () => void;
  onEdit:     () => void;
  onReset:    () => void;
}

function CampaignCard({ item, busy, excelMsg, liveStats, onStart, onStop, onReimport, onExcel, onEdit, onReset }: CardProps) {
  const { pct, pending, called, total } = entryProgress(item.stats);
  const isFinished = item.status === 'completed' || item.status === 'cancelled';

  return (
    <div className={`${s.card} ${item.dialerRunning ? s.cardRunning : ''}`}>

      {/* Header */}
      <div className={s.cardHeader}>
        <div className={s.cardNameRow}>
          <span className={s.cardName}>{item.name || <span className={s.namePlaceholder}>Sin nombre</span>}</span>
        </div>
        <span className={`${s.badge} ${s[`badge_${item.status}`] ?? s.badge_draft}`}>
          {STATUS_LABEL[item.status] ?? item.status}
        </span>
      </div>

      {item.description && <p className={s.cardDesc}>{item.description}</p>}

      {/* Counts */}
      <div className={s.importRow}>
        <span className={s.importCount}>{item.totalImported.toLocaleString()} contactos en la lista</span>
        {item.hasCrmFilter && <span className={s.filterTag}>Filtrado del sistema</span>}
        {item.kind === 'orphan' && <span className={s.orphanTag}>Lista manual</span>}
      </div>

      {/* Progress */}
      {total > 0 && (
        <div className={s.progress}>
          <div className={s.progressBar}>
            <div className={s.progressFill} style={{ width: `${pct}%` }} />
          </div>
          <div className={s.progressLabel}>
            <span>{called} procesados / {total}</span>
            <span>{pct}%</span>
          </div>
          <div className={s.entryChips}>
            <span className={s.chipPending}>{pending} pendientes</span>
            <span className={s.chipCalled}>{item.stats?.called ?? 0} llamadas</span>
            {(item.stats?.dnc ?? 0) > 0 && <span className={s.chipDnc}>{item.stats?.dnc} DNC</span>}
          </div>
        </div>
      )}

      {/* Live stats */}
      {item.dialerRunning && liveStats && (
        <div className={s.statsBox}>
          <div className={s.statsRow}>
            <span className={s.statItem}><span className={s.statLabel}>Llamadas</span><span className={s.statVal}>{(liveStats as any).dialed}</span></span>
            <span className={s.statItem}><span className={s.statLabel}>Contactadas</span><span className={`${s.statVal} ${s.statGreen}`}>{(liveStats as any).answered}</span></span>
            <span className={s.statItem}><span className={s.statLabel}>En curso</span><span className={`${s.statVal} ${s.statBlue}`}>{(liveStats as any).inFlight}</span></span>
            <span className={s.statItem}><span className={s.statLabel}>Agentes disponibles</span><span className={s.statVal}>{(liveStats as any).availAgents}</span></span>
          </div>
          <div className={s.dropRow}>
            <span className={s.statLabel}>Llamadas sin agente</span>
            <DropBar rate={(liveStats as any).dropRate ?? 0} />
          </div>
        </div>
      )}

      {/* ── Actions ── */}
      <div className={s.cardActions}>

        {/* Primary: start / stop */}
        {!isFinished && (
          item.dialerRunning ? (
            <button className={s.stopBtn} onClick={onStop} disabled={!!busy}>
              {busy === 'stop' ? 'Deteniendo…' : 'Detener campaña'}
            </button>
          ) : (
            <button className={s.startBtn} onClick={onStart}
              disabled={!!busy || total === 0 || pending === 0}
              title={pending === 0 ? 'No quedan contactos pendientes' : undefined}>
              {busy === 'start' ? 'Iniciando…' : 'Iniciar campaña'}
            </button>
          )
        )}

        {/* Secondary row — contact management */}
        {(item.hasCrmFilter || item.listId) && (
          <div className={s.secondaryActions}>
            {item.hasCrmFilter && (
              <button className={s.secondaryBtn} onClick={onReimport} disabled={!!busy}
                title="Busca en el sistema clientes nuevos que aún no están en esta lista y los añade">
                {busy === 'reimport' ? 'Buscando…' : 'Añadir contactos nuevos'}
              </button>
            )}
            {item.listId && (
              <button className={s.secondaryBtn} onClick={onExcel} disabled={!!busy}
                title="Sube un archivo Excel con teléfonos">
                Subir lista Excel
              </button>
            )}
          </div>
        )}

        {/* Secondary row — campaign management */}
        <div className={s.secondaryActions}>
          <button className={s.secondaryBtn} onClick={onEdit} disabled={!!busy}>
            Editar
          </button>
          <button className={s.secondaryBtn} onClick={onReset} disabled={!!busy || item.dialerRunning}
            title={item.dialerRunning ? 'Detén la campaña antes de reiniciar' : 'Vuelve a marcar todos los contactos como pendientes'}>
            {busy === 'reset' ? 'Reiniciando…' : 'Reiniciar'}
          </button>
        </div>

      </div>

      {excelMsg && (
        <div className={`${s.excelMsg} ${excelMsg.startsWith('✕') ? s.excelMsgErr : excelMsg.startsWith('✓') ? s.excelMsgOk : ''}`}>
          {excelMsg}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function CampaignsPage() {
  const [campaigns, setCampaigns]       = useState<Campaign[]>([]);
  const [orphans, setOrphans]           = useState<OrphanList[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [showCreate, setShowCreate]     = useState(false);
  const [editItem, setEditItem]         = useState<CardItem | null>(null);
  const [saleStatuses, setSaleStatuses] = useState<SaleStatus[]>([]);
  const [products, setProducts]         = useState<Product[]>([]);
  const [loadingMeta, setLoadingMeta]   = useState(false);
  const [actionMap, setActionMap]       = useState<Record<string, string>>({});
  const [excelMsg, setExcelMsg]         = useState<Record<string, string>>({});
  const excelInputRef  = useRef<HTMLInputElement>(null);
  const excelTargetRef = useRef<string | null>(null);
  const pollRef        = useRef<ReturnType<typeof setInterval> | null>(null);

  const predictiveStats = useAppSelector((s) => s.calls.predictiveStats);

  const load = useCallback(async () => {
    try {
      const [camps, orps] = await Promise.all([listCampaigns(), getOrphanDialLists()]);
      setCampaigns(camps);
      setOrphans(orps);
    } catch {
      setError('Error al cargar las campañas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    pollRef.current = setInterval(async () => {
      const running = campaigns.filter((c) => c.dialerRunning);
      if (running.length === 0) return;
      const updated = await Promise.all(running.map((c) => getCampaignStatus(c.id)));
      setCampaigns((prev) =>
        prev.map((c) => { const u = updated.find((u) => u.id === c.id); return u ? { ...c, ...u } : c; }),
      );
    }, 5_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [load]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMeta = async () => {
    if (saleStatuses.length > 0 || products.length > 0) return;
    setLoadingMeta(true);
    try {
      const [statuses, prods] = await Promise.all([getAllSaleStatuses(), getAllProducts()]);
      setSaleStatuses(statuses);
      setProducts(prods.filter((p) => p.active));
    } catch { /* non-fatal */ }
    finally { setLoadingMeta(false); }
  };

  const openCreate = async () => { setShowCreate(true); await loadMeta(); };
  const openEdit   = async (item: CardItem) => { setEditItem(item); await loadMeta(); };

  const handleCreated = (campaign: Campaign) => {
    setCampaigns((prev) => [campaign, ...prev]);
    setShowCreate(false);
  };

  const handleExcelClick = (dialListId: string) => {
    excelTargetRef.current = dialListId;
    excelInputRef.current?.click();
  };

  const handleExcelFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const listId = excelTargetRef.current;
    if (!file || !listId) return;
    e.target.value = '';
    const campaign = campaigns.find((c) => c.dialListId === listId);
    const orphan   = orphans.find((o) => o.id === listId);
    const key = campaign?.id ?? orphan?.id ?? listId;
    setExcelMsg((prev) => ({ ...prev, [key]: 'Procesando archivo…' }));
    try {
      const { entries, skipped, truncated } = await parseDialerExcel(file);
      if (entries.length === 0) {
        setExcelMsg((prev) => ({ ...prev, [key]: 'Sin teléfonos válidos en el archivo' }));
        return;
      }
      await addDialListEntries(listId, entries);
      const msg = `✓ ${entries.length} contactos añadidos${skipped > 0 ? ` · ${skipped} filas sin teléfono omitidas` : ''}${truncated ? ' · archivo truncado a 5000 filas' : ''}`;
      setExcelMsg((prev) => ({ ...prev, [key]: msg }));
      await load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al procesar el archivo';
      setExcelMsg((prev) => ({ ...prev, [key]: `✕ ${msg}` }));
    }
  };

  const busy = (id: string, action: string) => setActionMap((prev) => ({ ...prev, [id]: action }));
  const done = (id: string) => setActionMap((prev) => { const n = { ...prev }; delete n[id]; return n; });

  const handleCampaignAction = async (id: string, action: 'start' | 'stop' | 'reimport' | 'reset') => {
    busy(id, action);
    try {
      if (action === 'start')    await startCampaign(id);
      if (action === 'stop')     await stopCampaign(id);
      if (action === 'reimport') {
        const result = await reimportCampaign(id);
        alert(`Se han añadido ${result.imported} contactos nuevos a la campaña.`);
      }
      if (action === 'reset') {
        if (!confirm('¿Reiniciar la campaña? Todos los contactos volverán a estado pendiente y se podrán volver a llamar.')) return;
        await resetCampaign(id);
      }
      await load();
    } catch {
      setError('Error al ejecutar la acción. Inténtalo de nuevo.');
    } finally {
      done(id);
    }
  };

  const handleOrphanAction = async (listId: string, action: 'start' | 'stop') => {
    busy(listId, action);
    try {
      if (action === 'start') await startPredictive(listId);
      if (action === 'stop')  await stopPredictive(listId);
      await load();
    } catch {
      setError('Error al ejecutar la acción. Inténtalo de nuevo.');
    } finally {
      done(listId);
    }
  };

  const handleSaveEdit = async (updates: { name: string; description: string; maxAttempts: number }) => {
    if (!editItem) return;
    if (editItem.kind === 'campaign') {
      await updateCampaign(editItem.id, {
        name: updates.name,
        description: updates.description || undefined,
        maxAttempts: updates.maxAttempts,
      });
      setCampaigns((prev) => prev.map((c) =>
        c.id === editItem.id ? { ...c, name: updates.name, description: updates.description || null, maxAttempts: updates.maxAttempts } : c
      ));
    } else {
      await updateDialList(editItem.id, { name: updates.name });
      setOrphans((prev) => prev.map((o) =>
        o.id === editItem.id ? { ...o, name: updates.name } : o
      ));
    }
  };

  const allItems: CardItem[] = [
    ...campaigns.map(fromCampaign),
    ...orphans.map(fromOrphan),
  ];

  return (
    <div className={s.page}>
      <input ref={excelInputRef} type="file" accept=".xlsx,.xls"
        style={{ display: 'none' }} onChange={handleExcelFile} />

      <div className={s.header}>
        <div>
          <h1 className={s.title}>Campañas de llamadas</h1>
          <p className={s.subtitle}>
            Organiza listas de llamadas y ponlas en marcha con un clic.
            Pueden correr varias campañas a la vez.
          </p>
        </div>
        <button className={s.newBtn} onClick={openCreate}>+ Nueva campaña</button>
      </div>

      {error && <div className={s.errorBanner}>{error}</div>}

      {loading ? (
        <div className={s.empty}>Cargando campañas…</div>
      ) : allItems.length === 0 ? (
        <div className={s.empty}>No hay campañas aún. Crea la primera para empezar a llamar.</div>
      ) : (
        <div className={s.grid}>
          {allItems.map((item) => {
            const liveStats =
              predictiveStats && item.listId && (predictiveStats as any).listId === item.listId
                ? predictiveStats : null;
            return (
              <CampaignCard
                key={`${item.kind}-${item.id}`}
                item={item}
                busy={actionMap[item.id]}
                excelMsg={excelMsg[item.id]}
                liveStats={liveStats}
                onStart={() => item.kind === 'campaign' ? handleCampaignAction(item.id, 'start') : handleOrphanAction(item.id, 'start')}
                onStop={() => item.kind === 'campaign' ? handleCampaignAction(item.id, 'stop') : handleOrphanAction(item.id, 'stop')}
                onReimport={() => handleCampaignAction(item.id, 'reimport')}
                onExcel={() => handleExcelClick(item.listId)}
                onEdit={() => openEdit(item)}
                onReset={() => item.kind === 'campaign' ? handleCampaignAction(item.id, 'reset') : undefined}
              />
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreateModal
          saleStatuses={loadingMeta ? [] : saleStatuses}
          products={loadingMeta ? [] : products}
          onClose={() => setShowCreate(false)}
          onCreate={handleCreated}
        />
      )}

      {editItem && (
        <EditModal
          item={editItem}
          saleStatuses={loadingMeta ? [] : saleStatuses}
          products={loadingMeta ? [] : products}
          onClose={() => setEditItem(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}
