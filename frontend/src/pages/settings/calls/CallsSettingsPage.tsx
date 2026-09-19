import { useState, useEffect, useCallback } from 'react';
import DemoSimulator from '@/features/calls/components/DemoSimulator';
import {
  listDispositionCodes,
  createDispositionCode,
  deleteDispositionCode,
} from '@/features/calls/services/dispositionService';
import type { DispositionCode } from '@/features/calls/types';
import styles from './CallsSettingsPage.module.scss';

const PRESET_COLORS = [
  '#22c55e', '#16a34a', '#ef4444', '#dc2626',
  '#3b82f6', '#2563eb', '#f59e0b', '#d97706',
  '#8b5cf6', '#6b7280', '#ec4899', '#14b8a6',
];

// ── Disposition Codes ─────────────────────────────────────────────────────────

function DispositionSection() {
  const [codes, setCodes]       = useState<DispositionCode[]>([]);
  const [loading, setLoading]   = useState(true);
  const [adding, setAdding]     = useState(false);
  const [label, setLabel]       = useState('');
  const [color, setColor]       = useState('#3b82f6');
  const [isDefault, setIsDefault] = useState(false);
  const [marksSaleClosed, setMarksSaleClosed] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    listDispositionCodes()
      .then(setCodes)
      .catch(() => setError('Error al cargar códigos'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!label.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await createDispositionCode({ label: label.trim(), color, isDefault, marksSaleClosed });
      setLabel('');
      setColor('#3b82f6');
      setIsDefault(false);
      setMarksSaleClosed(false);
      setAdding(false);
      load();
    } catch {
      setError('Error al crear código');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDispositionCode(id);
      load();
    } catch {
      setError('Error al eliminar código');
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <div>
          <h2 className={styles.sectionTitle}>Códigos de disposición</h2>
          <p className={styles.sectionDesc}>
            Opciones que el agente selecciona tras cada llamada (resultado de la llamada).
          </p>
        </div>
        {!adding && (
          <button className={styles.btnAdd} onClick={() => setAdding(true)}>
            + Añadir código
          </button>
        )}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {adding && (
        <div className={styles.addForm}>
          <input
            className={styles.input}
            placeholder="Nombre del código (ej: Interesado)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            autoFocus
          />
          <div className={styles.colorRow}>
            <span className={styles.colorLabel}>Color:</span>
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                className={`${styles.colorDot} ${color === c ? styles.colorDotSelected : ''}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
                title={c}
              />
            ))}
            <input
              type="color"
              className={styles.colorPicker}
              value={color}
              onChange={(e) => setColor(e.target.value)}
              title="Color personalizado"
            />
          </div>
          <label className={styles.checkRow}>
            <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
            Marcar como opción por defecto
          </label>
          <label className={styles.checkRow}>
            <input type="checkbox" checked={marksSaleClosed} onChange={(e) => setMarksSaleClosed(e.target.checked)} />
            Al seleccionarla, llevar al agente a registrar la venta en el CRM
          </label>
          <div className={styles.formActions}>
            <button className={styles.btnCancel} onClick={() => setAdding(false)}>Cancelar</button>
            <button className={styles.btnSave} onClick={handleAdd} disabled={saving || !label.trim()}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className={styles.loading}>Cargando…</p>
      ) : codes.length === 0 ? (
        <p className={styles.empty}>No hay códigos de disposición. Añade el primero.</p>
      ) : (
        <div className={styles.codeList}>
          {codes.map((code) => (
            <div key={code.id} className={styles.codeRow}>
              <span className={styles.codeDot} style={{ background: code.color }} />
              <span className={styles.codeLabel}>{code.label}</span>
              {code.isDefault && <span className={styles.badge}>Por defecto</span>}
              {code.marksSaleClosed && <span className={styles.badge}>→ Crea venta</span>}
              <button
                className={styles.btnDelete}
                onClick={() => handleDelete(code.id)}
                title="Desactivar código"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CallsSettingsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Módulo de Llamadas</h1>
        <p className={styles.subtitle}>Configuración y herramientas del sistema de llamadas</p>
      </div>

      <DispositionSection />

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <h2 className={styles.sectionTitle}>Demo del sistema</h2>
            <p className={styles.sectionDesc}>
              Simula una sesión de call center completa con contactos reales de la base de datos.
              Los datos de codificación se guardan igual que en producción.
            </p>
          </div>
        </div>
        <DemoSimulator />
      </section>
    </div>
  );
}
