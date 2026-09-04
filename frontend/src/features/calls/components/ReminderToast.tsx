import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { dismissReminder, initiateCall } from '../callsSlice';

const PRIORITY_COLOR: Record<string, string> = {
  high:   '#fee2e2',
  normal: '#fef9c3',
  low:    '#f0fdf4',
};

export default function ReminderToast() {
  const dispatch   = useAppDispatch();
  const reminders  = useAppSelector((s) => s.calls.reminders);

  if (reminders.length === 0) return null;

  return (
    <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 300 }}>
      {reminders.map((r) => (
        <div key={r.id} style={{ background: PRIORITY_COLOR[r.entry.priority ?? 'normal'] ?? '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '12px 16px', boxShadow: '0 4px 12px rgba(0,0,0,.12)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>⏰ Recordatorio</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{r.entry.clientPhone}</div>
              {r.entry.clientName && <div style={{ fontSize: 12, color: '#6b7280' }}>{r.entry.clientName}</div>}
              {r.entry.notes && <div style={{ fontSize: 12, color: '#4b5563', marginTop: 4, fontStyle: 'italic' }}>{r.entry.notes}</div>}
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                Programado: {new Date(r.entry.scheduledAt).toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
              </div>
            </div>
            <button onClick={() => dispatch(dismissReminder(r.id))} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 16, lineHeight: 1 }}>×</button>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button
              onClick={() => {
                dispatch(initiateCall({ clientPhone: r.entry.clientPhone, saleId: r.entry.saleId ?? undefined, clientId: r.entry.clientId ?? undefined }));
                dispatch(dismissReminder(r.id));
              }}
              style={{ flex: 1, padding: '6px 10px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
            >
              📞 Llamar
            </button>
            <button
              onClick={() => dispatch(dismissReminder(r.id))}
              style={{ flex: 1, padding: '6px 10px', background: 'transparent', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}
            >
              Descartar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
