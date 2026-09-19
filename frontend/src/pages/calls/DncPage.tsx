import { useState, useEffect, useCallback } from 'react';
import { listDnc, addDnc, removeDnc } from '@/features/calls/services/dncService';
import type { DncEntry } from '@/features/calls/services/dncService';
import s from './DncPage.module.scss';

export default function DncPage() {
  const [entries, setEntries]   = useState<DncEntry[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [phone, setPhone]       = useState('');
  const [reason, setReason]     = useState('');
  const [expiresAt, setExpires] = useState('');
  const [saving, setSaving]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setEntries(await listDnc());
    } catch {
      setError('Error al cargar lista DNC');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!phone.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const entry = await addDnc({ phone: phone.trim(), reason: reason || undefined, expiresAt: expiresAt || undefined });
      setEntries((prev) => [entry, ...prev.filter((e) => e.phone !== entry.phone)]);
      setPhone('');
      setReason('');
      setExpires('');
    } catch {
      setError('Error al añadir número a la lista DNC');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeDnc(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch {
      setError('Error al eliminar de la lista DNC');
    }
  };

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>Números bloqueados</h1>
        <span className={s.badge}>{entries.length} bloqueados</span>
      </div>

      {error && <div className={s.error}>{error}</div>}

      <div className={s.addCard}>
        <div className={s.addRow}>
          <input
            className={s.input}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Teléfono a bloquear"
            type="tel"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <input
            className={s.input}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motivo (opcional)"
          />
          <button className={s.addBtn} onClick={handleAdd} disabled={!phone.trim() || saving}>
            {saving ? 'Bloqueando…' : 'Bloquear'}
          </button>
        </div>
      </div>

      <div className={s.tableCard}>
        {loading ? (
          <div className={s.empty}>Cargando…</div>
        ) : entries.length === 0 ? (
          <div className={s.empty}>La lista DNC está vacía</div>
        ) : (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Teléfono</th>
                  <th>Motivo</th>
                  <th>Añadido</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => {
                  const expired = e.expiresAt && new Date(e.expiresAt) < new Date();
                  return (
                    <tr key={e.id} className={expired ? s.expired : ''}>
                      <td className={s.phoneCell}>{e.phone}</td>
                      <td>{e.reason ?? '—'}</td>
                      <td className={s.dateText}>{new Date(e.createdAt).toLocaleDateString('es-ES')}</td>
                      <td>
                        <button className={s.removeBtn} onClick={() => handleRemove(e.id)}>
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
