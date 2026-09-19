import { useState, useEffect, useCallback } from 'react';
import {
  getReviewSummary,
  getCallsByDisposition,
  bulkAddDnc,
  type ReviewSummaryItem,
} from '@/features/calls/services/reviewService';
import { listCampaigns, createCampaign, type Campaign } from '@/features/calls/services/campaignService';
import { addDialListEntries } from '@/features/calls/services/dialerService';
import type { Call } from '@/features/calls/types';
import s from './ReviewPage.module.scss';

function fmt(iso: string) {
  return new Date(iso).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function dur(seconds?: number | null) {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

// ── Add-to-campaign modal ─────────────────────────────────────────────────

interface AddToCampaignModalProps {
  count:      number;
  onClose:    () => void;
  onAdd:      (campaignId: string, listId: string) => Promise<void>;
  onNew:      (name: string) => Promise<void>;
}

function AddToCampaignModal({ count, onClose, onAdd, onNew }: AddToCampaignModalProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading]     = useState(true);
  const [mode, setMode]           = useState<'existing' | 'new'>('existing');
  const [selectedId, setSelectedId] = useState('');
  const [newName, setNewName]     = useState('');
  const [busy, setBusy]           = useState(false);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    listCampaigns()
      .then((cs) => { setCampaigns(cs); if (cs.length === 0) setMode('new'); })
      .catch(() => setError('No se pudieron cargar las campañas'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async () => {
    setBusy(true); setError(null);
    try {
      if (mode === 'existing') {
        const c = campaigns.find((c) => c.id === selectedId);
        if (!c || !c.dialListId) { setError('Selecciona una campaña válida'); setBusy(false); return; }
        await onAdd(c.id, c.dialListId);
      } else {
        if (!newName.trim()) { setError('El nombre es obligatorio'); setBusy(false); return; }
        await onNew(newName.trim());
      }
      onClose();
    } catch {
      setError('Error al añadir los registros. Inténtalo de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={s.modalBackdrop} onClick={onClose}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        <div className={s.modalHeader}>
          <h2 className={s.modalTitle}>Añadir {count} registro{count !== 1 ? 's' : ''} a campaña</h2>
          <button className={s.modalClose} onClick={onClose}>✕</button>
        </div>

        {error && <div className={s.modalError}>{error}</div>}

        {loading ? (
          <div className={s.empty}>Cargando campañas…</div>
        ) : (
          <>
            <div className={s.modeRow}>
              <button
                className={`${s.modeBtn} ${mode === 'existing' ? s.modeBtnActive : ''}`}
                onClick={() => setMode('existing')}
                disabled={campaigns.length === 0}
              >
                Campaña existente
              </button>
              <button
                className={`${s.modeBtn} ${mode === 'new' ? s.modeBtnActive : ''}`}
                onClick={() => setMode('new')}
              >
                Nueva campaña
              </button>
            </div>

            {mode === 'existing' ? (
              <div className={s.formGroup}>
                <label className={s.label}>Elige la campaña</label>
                <select className={s.select} value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
                  <option value="">— Selecciona —</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className={s.formGroup}>
                <label className={s.label}>Nombre de la nueva campaña</label>
                <input
                  className={s.input}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej. Reintento no contesta"
                  autoFocus
                />
              </div>
            )}
          </>
        )}

        <div className={s.modalActions}>
          <button className={s.cancelBtn} onClick={onClose} disabled={busy}>Cancelar</button>
          <button
            className={s.submitBtn}
            onClick={handleSubmit}
            disabled={busy || loading || (mode === 'existing' && !selectedId) || (mode === 'new' && !newName.trim())}
          >
            {busy ? 'Añadiendo…' : 'Añadir a campaña'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function ReviewPage() {
  const [summary, setSummary]         = useState<ReviewSummaryItem[]>([]);
  const [selected, setSelected]       = useState<ReviewSummaryItem | null>(null);
  const [calls, setCalls]             = useState<Call[]>([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [loadingSummary, setLS]       = useState(true);
  const [loadingCalls, setLC]         = useState(false);
  const [checked, setChecked]         = useState<Set<string>>(new Set());
  const [busy, setBusy]               = useState<string | null>(null);
  const [msg, setMsg]                 = useState<string | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [showCampaignModal, setShowCampaignModal] = useState(false);

  const PAGE_SIZE = 50;

  useEffect(() => {
    getReviewSummary()
      .then(setSummary)
      .catch(() => setError('Error al cargar el resumen'))
      .finally(() => setLS(false));
  }, []);

  const loadCalls = useCallback(async (item: ReviewSummaryItem, p: number) => {
    setLC(true); setCalls([]); setChecked(new Set()); setMsg(null);
    try {
      const result = await getCallsByDisposition(item.id, p, PAGE_SIZE);
      setCalls(result.data);
      setTotal(result.total);
    } catch {
      setError('Error al cargar las llamadas');
    } finally {
      setLC(false);
    }
  }, []);

  const selectItem = (item: ReviewSummaryItem) => {
    setSelected(item);
    setPage(1);
    loadCalls(item, 1);
  };

  const toggleCheck = (id: string) =>
    setChecked((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleAll = () =>
    setChecked(checked.size === calls.length ? new Set() : new Set(calls.map((c) => c.id)));

  const selectedCalls = calls.filter((c) => checked.has(c.id));
  const selectedPhones = selectedCalls.map((c) => ({ phone: c.clientPhone }));

  const handleBlock = async () => {
    if (!confirm(`¿Bloquear ${selectedCalls.length} número${selectedCalls.length > 1 ? 's' : ''}? No volverán a recibir llamadas.`)) return;
    setBusy('block');
    try {
      const result = await bulkAddDnc(selectedCalls.map((c) => c.clientPhone), selected?.label ?? undefined);
      setMsg(`✓ ${result.added} número${result.added !== 1 ? 's' : ''} bloqueado${result.added !== 1 ? 's' : ''}`);
      setChecked(new Set());
    } catch {
      setError('Error al bloquear números');
    } finally {
      setBusy(null);
    }
  };

  const handleAddToExisting = async (_campaignId: string, listId: string) => {
    await addDialListEntries(listId, selectedPhones);
    setMsg(`✓ ${selectedPhones.length} contacto${selectedPhones.length !== 1 ? 's' : ''} añadido${selectedPhones.length !== 1 ? 's' : ''} a la campaña`);
    setChecked(new Set());
  };

  const handleCreateNew = async (name: string) => {
    const campaign = await createCampaign({ name, description: `Creada desde revisión: ${selected?.label ?? ''}` });
    if (campaign.dialListId) {
      await addDialListEntries(campaign.dialListId, selectedPhones);
    }
    setMsg(`✓ Campaña "${name}" creada con ${selectedPhones.length} contacto${selectedPhones.length !== 1 ? 's' : ''}`);
    setChecked(new Set());
  };

  const pages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>Revisar registros</h1>
        <p className={s.subtitle}>Elige una codificación para ver sus llamadas y actuar sobre ellas.</p>
      </div>

      {error && <div className={s.errorBanner} onClick={() => setError(null)}>{error}</div>}

      <div className={s.layout}>

        {/* ── Sidebar ── */}
        <div className={s.sidebar}>
          {loadingSummary ? (
            <div className={s.empty}>Cargando…</div>
          ) : summary.length === 0 ? (
            <div className={s.empty}>Sin llamadas codificadas aún</div>
          ) : summary.map((item) => (
            <button
              key={item.id ?? '__null__'}
              className={`${s.codeBtn} ${selected?.id === item.id ? s.codeBtnActive : ''}`}
              onClick={() => selectItem(item)}
            >
              <span className={s.codeDot} style={{ background: item.color }} />
              <span className={s.codeLabel}>{item.label}</span>
              <span className={s.codeCount}>{item.count}</span>
            </button>
          ))}
        </div>

        {/* ── Main panel ── */}
        <div className={s.main}>
          {!selected ? (
            <div className={s.placeholder}>← Elige una codificación para ver sus registros</div>
          ) : (
            <>
              {/* Action bar */}
              <div className={s.actionBar}>
                <span className={s.selLabel}>
                  {checked.size > 0
                    ? `${checked.size} seleccionado${checked.size > 1 ? 's' : ''}`
                    : `${total} registros`}
                </span>

                {checked.size > 0 && (
                  <div className={s.actions}>
                    <button className={s.campaignBtn} onClick={() => setShowCampaignModal(true)} disabled={!!busy}>
                      Añadir a campaña
                    </button>
                    <button className={s.blockBtn} onClick={handleBlock} disabled={!!busy}>
                      {busy === 'block' ? 'Bloqueando…' : 'Bloquear'}
                    </button>
                  </div>
                )}
              </div>

              {msg && <div className={s.successBanner} onClick={() => setMsg(null)}>{msg}</div>}

              {loadingCalls ? (
                <div className={s.empty}>Cargando llamadas…</div>
              ) : calls.length === 0 ? (
                <div className={s.empty}>Sin llamadas en esta categoría</div>
              ) : (
                <>
                  <div className={s.tableWrap}>
                    <table className={s.table}>
                      <thead>
                        <tr>
                          <th>
                            <input type="checkbox"
                              checked={checked.size === calls.length && calls.length > 0}
                              onChange={toggleAll} />
                          </th>
                          <th>Teléfono</th>
                          <th>Fecha</th>
                          <th>Duración</th>
                          <th>Notas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {calls.map((c) => (
                          <tr key={c.id} className={checked.has(c.id) ? s.rowChecked : ''}>
                            <td>
                              <input type="checkbox"
                                checked={checked.has(c.id)}
                                onChange={() => toggleCheck(c.id)} />
                            </td>
                            <td className={s.phone}>{c.clientPhone}</td>
                            <td className={s.date}>{fmt(c.createdAt)}</td>
                            <td className={s.dur}>{dur(c.duration)}</td>
                            <td className={s.notes}>{c.agentNotes ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {pages > 1 && (
                    <div className={s.pagination}>
                      <button disabled={page === 1}
                        onClick={() => { const p = page - 1; setPage(p); loadCalls(selected, p); }}>
                        ‹ Anterior
                      </button>
                      <span>{page} / {pages}</span>
                      <button disabled={page === pages}
                        onClick={() => { const p = page + 1; setPage(p); loadCalls(selected, p); }}>
                        Siguiente ›
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {showCampaignModal && (
        <AddToCampaignModal
          count={checked.size}
          onClose={() => setShowCampaignModal(false)}
          onAdd={handleAddToExisting}
          onNew={handleCreateNew}
        />
      )}
    </div>
  );
}
