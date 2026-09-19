import { useState, useEffect } from 'react';
import {
  listDispositionCodes,
  createDispositionCode,
  deleteDispositionCode,
  type DispositionCode,
} from '@/features/calls/services/dispositionService';
import s from './DispositionsPage.module.scss';

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#6b7280', '#1d4ed8',
];

export default function DispositionsPage() {
  const [codes, setCodes]     = useState<DispositionCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel]     = useState('');
  const [color, setColor]     = useState('#6b7280');
  const [marksSaleClosed, setMarksSaleClosed] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    listDispositionCodes()
      .then(setCodes)
      .catch(() => setError('Error al cargar las codificaciones'))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    if (!label.trim()) return;
    setSaving(true); setError(null);
    try {
      const code = await createDispositionCode({ label: label.trim(), color, marksSaleClosed });
      setCodes((prev) => [...prev, code]);
      setLabel('');
      setColor('#6b7280');
      setMarksSaleClosed(false);
    } catch {
      setError('Error al crear la codificación');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta codificación? Las llamadas ya codificadas con ella no se verán afectadas.')) return;
    try {
      await deleteDispositionCode(id);
      setCodes((prev) => prev.filter((c) => c.id !== id));
    } catch {
      setError('Error al eliminar la codificación');
    }
  };

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>Codificaciones de llamada</h1>
        <p className={s.subtitle}>Los agentes usan estos códigos al finalizar cada llamada para indicar el resultado.</p>
      </div>

      {error && <div className={s.errorBanner}>{error}</div>}

      {/* Formulario añadir */}
      <div className={s.addCard}>
        <div className={s.addRow}>
          <input
            className={s.input}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Nombre de la codificación (ej. No contesta)"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <div className={s.colorPicker}>
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`${s.colorDot} ${color === c ? s.colorDotSelected : ''}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
          <button className={s.addBtn} onClick={handleAdd} disabled={!label.trim() || saving}>
            {saving ? 'Añadiendo…' : '+ Añadir'}
          </button>
        </div>
        <label className={s.checkRow}>
          <input type="checkbox" checked={marksSaleClosed} onChange={(e) => setMarksSaleClosed(e.target.checked)} />
          Al seleccionarla, llevar al agente a registrar la venta en el CRM
        </label>
      </div>

      {/* Lista */}
      <div className={s.listCard}>
        {loading ? (
          <div className={s.empty}>Cargando…</div>
        ) : codes.length === 0 ? (
          <div className={s.empty}>No hay codificaciones aún. Añade la primera arriba.</div>
        ) : (
          <ul className={s.list}>
            {codes.map((code) => (
              <li key={code.id} className={s.item}>
                <span className={s.dot} style={{ background: code.color }} />
                <span className={s.itemLabel}>{code.label}</span>
                {code.isDefault && <span className={s.defaultBadge}>Por defecto</span>}
                {code.marksSaleClosed && <span className={s.defaultBadge}>→ Crea venta</span>}
                <button
                  className={s.deleteBtn}
                  onClick={() => handleDelete(code.id)}
                  title="Eliminar"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
