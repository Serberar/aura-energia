import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import {
  fetchAgenda, createAgendaEntry, updateAgendaEntry, deleteAgendaEntry, initiateCall,
} from '../callsSlice';
import type { AgendaEntry, AgendaStatus, Priority } from '../types';
import type { CreateAgendaPayload } from '../services/agendaService';
import styles from './AgendaPanel.module.scss';

const PRIORITY_CLASS: Record<Priority, string> = {
  low:    styles.priorityLow    ?? '',
  normal: styles.priorityNormal ?? '',
  high:   styles.priorityHigh   ?? '',
};
const STATUS_CLASS: Record<AgendaStatus, string> = {
  pending:     styles.statusPending     ?? '',
  called:      styles.statusCalled      ?? '',
  cancelled:   styles.statusCancelled   ?? '',
  rescheduled: styles.statusRescheduled ?? '',
};
const STATUS_LABEL: Record<AgendaStatus, string> = {
  pending:     'Pendiente',
  called:      'Llamada',
  cancelled:   'Cancelada',
  rescheduled: 'Reprogramada',
};

const emptyForm = (): CreateAgendaPayload => ({
  clientPhone: '',
  clientName:  '',
  scheduledAt: new Date(Date.now() + 3600_000).toISOString().slice(0, 16),
  reminderAt:  '',
  notes:       '',
  priority:    'normal',
});

export default function AgendaPanel() {
  const dispatch = useAppDispatch();
  const entries  = useAppSelector((s) => s.calls.agendaEntries);
  const loading  = useAppSelector((s) => s.calls.loading);

  const [showForm, setShowForm]       = useState(false);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [form, setForm]               = useState<CreateAgendaPayload>(emptyForm());
  const [statusFilter, setFilter]     = useState<AgendaStatus | ''>('pending');

  useEffect(() => {
    dispatch(fetchAgenda(statusFilter ? { status: statusFilter as AgendaStatus } : undefined));
  }, [dispatch, statusFilter]);

  const setField = (k: keyof CreateAgendaPayload, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    const payload = {
      ...form,
      scheduledAt: new Date(form.scheduledAt).toISOString(),
      reminderAt:  form.reminderAt ? new Date(form.reminderAt).toISOString() : undefined,
    };
    if (editingId) {
      await dispatch(updateAgendaEntry({ id: editingId, payload }));
    } else {
      await dispatch(createAgendaEntry(payload));
    }
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const handleEdit = (entry: AgendaEntry) => {
    setEditingId(entry.id);
    setForm({
      clientPhone: entry.clientPhone,
      clientName:  entry.clientName ?? '',
      clientId:    entry.clientId ?? undefined,
      saleId:      entry.saleId ?? undefined,
      scheduledAt: new Date(entry.scheduledAt).toISOString().slice(0, 16),
      reminderAt:  entry.reminderAt ? new Date(entry.reminderAt).toISOString().slice(0, 16) : '',
      notes:       entry.notes ?? '',
      priority:    entry.priority,
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  return (
    <div className={styles.panel}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          className={styles.select}
          value={statusFilter}
          onChange={(e) => setFilter(e.target.value as AgendaStatus | '')}
          style={{ width: 'auto' }}
        >
          <option value="">Todos</option>
          <option value="pending">Pendientes</option>
          <option value="called">Llamadas</option>
          <option value="cancelled">Canceladas</option>
          <option value="rescheduled">Reprogramadas</option>
        </select>
        <div style={{ flex: 1 }} />
        <button className={styles.addBtn} onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm()); }}>
          + Nueva cita
        </button>
      </div>

      {showForm && (
        <div className={styles.form}>
          <div className={styles.formTitle}>{editingId ? 'Editar cita' : 'Nueva cita'}</div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Teléfono *</label>
              <input className={styles.input} value={form.clientPhone} onChange={(e) => setField('clientPhone', e.target.value)} placeholder="+34 600 000 000" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Nombre cliente</label>
              <input className={styles.input} value={form.clientName ?? ''} onChange={(e) => setField('clientName', e.target.value)} placeholder="Nombre" />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Fecha programada *</label>
              <input className={styles.input} type="datetime-local" value={form.scheduledAt} onChange={(e) => setField('scheduledAt', e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Recordatorio (opcional)</label>
              <input className={styles.input} type="datetime-local" value={form.reminderAt ?? ''} onChange={(e) => setField('reminderAt', e.target.value)} />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Prioridad</label>
              <select className={styles.select} value={form.priority ?? 'normal'} onChange={(e) => setField('priority', e.target.value)}>
                <option value="low">Baja</option>
                <option value="normal">Normal</option>
                <option value="high">Alta</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Notas</label>
              <textarea className={styles.textarea} value={form.notes ?? ''} onChange={(e) => setField('notes', e.target.value)} rows={2} />
            </div>
          </div>
          <div className={styles.formActions}>
            <button className={styles.cancelBtn} onClick={handleCancel}>Cancelar</button>
            <button className={styles.saveBtn} onClick={handleSave} disabled={!form.clientPhone || !form.scheduledAt || loading}>
              {loading ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      <div className={styles.list}>
        {entries.length === 0 ? (
          <div className={styles.empty}>No hay citas{statusFilter ? ` con estado "${STATUS_LABEL[statusFilter as AgendaStatus]}"` : ''}</div>
        ) : entries.map((entry) => (
          <div key={entry.id} className={styles.entry}>
            <div className={styles.entryLeft}>
              <div className={styles.entryPhone}>{entry.clientPhone} {entry.clientName && <span style={{ fontWeight: 400, fontSize: 13, color: '#6b7280' }}>— {entry.clientName}</span>}</div>
              <div className={styles.entryMeta}>
                <span>📅 {new Date(entry.scheduledAt).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                <span className={`${styles.statusBadge} ${STATUS_CLASS[entry.status]}`}>{STATUS_LABEL[entry.status]}</span>
                <span className={`${styles.priorityBadge} ${PRIORITY_CLASS[entry.priority]}`}>{entry.priority}</span>
              </div>
              {entry.notes && <div className={styles.entryNotes}>{entry.notes}</div>}
            </div>
            <div className={styles.entryActions}>
              <button
                className={`${styles.iconBtn} ${styles.callIconBtn}`}
                title="Llamar ahora"
                onClick={() => dispatch(initiateCall({ clientPhone: entry.clientPhone, clientId: entry.clientId ?? undefined, saleId: entry.saleId ?? undefined }))}
              >📞</button>
              <button className={`${styles.iconBtn} ${styles.editIconBtn}`} title="Editar" onClick={() => handleEdit(entry)}>✏️</button>
              <button
                className={`${styles.iconBtn} ${styles.deleteIconBtn}`}
                title="Eliminar"
                onClick={() => dispatch(deleteAgendaEntry(entry.id))}
              >🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
