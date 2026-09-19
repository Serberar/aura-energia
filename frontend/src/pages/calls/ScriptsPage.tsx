import { useState, useEffect, useCallback } from 'react';
import { listScripts, createScript, updateScript, deleteScript } from '@/features/calls/services/scriptService';
import type { CallScript } from '@/features/calls/services/scriptService';
import s from './ScriptsPage.module.scss';

export default function ScriptsPage() {
  const [scripts, setScripts]   = useState<CallScript[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [editing, setEditing]   = useState<CallScript | null>(null);
  const [name, setName]         = useState('');
  const [content, setContent]   = useState('');
  const [saving, setSaving]     = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setScripts(await listScripts());
    } catch {
      setError('Error al cargar guiones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditing(null);
    setName('');
    setContent('');
    setShowForm(true);
  };

  const openEdit = (sc: CallScript) => {
    setEditing(sc);
    setName(sc.name);
    setContent(sc.content);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !content.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        const updated = await updateScript(editing.id, { name, content });
        setScripts((prev) => prev.map((sc) => sc.id === updated.id ? updated : sc));
      } else {
        const created = await createScript({ name, content, order: scripts.length });
        setScripts((prev) => [...prev, created]);
      }
      setShowForm(false);
    } catch {
      setError('Error al guardar el guión');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteScript(id);
      setScripts((prev) => prev.filter((sc) => sc.id !== id));
    } catch {
      setError('Error al eliminar guión');
    }
  };

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>Guiones de llamada</h1>
        <button className={s.addBtn} onClick={openNew}>+ Nuevo guión</button>
      </div>

      {error && <div className={s.error}>{error}</div>}

      {showForm && (
        <div className={s.formCard}>
          <h2 className={s.formTitle}>{editing ? 'Editar guión' : 'Nuevo guión'}</h2>
          <input
            className={s.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del guión"
          />
          <textarea
            className={s.textarea}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Contenido del guión (markdown básico soportado)…"
            rows={12}
          />
          <div className={s.formActions}>
            <button className={s.cancelBtn} onClick={() => setShowForm(false)}>Cancelar</button>
            <button className={s.saveBtn} onClick={handleSave} disabled={!name.trim() || !content.trim() || saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      <div className={s.list}>
        {loading ? (
          <div className={s.empty}>Cargando…</div>
        ) : scripts.length === 0 ? (
          <div className={s.empty}>No hay guiones. Crea el primero.</div>
        ) : (
          scripts.map((sc) => (
            <div key={sc.id} className={s.scriptCard}>
              <div className={s.scriptHeader}>
                <span className={s.scriptName}>{sc.name}</span>
                <div className={s.scriptActions}>
                  <button className={s.editBtn} onClick={() => openEdit(sc)}>Editar</button>
                  <button className={s.deleteBtn} onClick={() => handleDelete(sc.id)}>Eliminar</button>
                </div>
              </div>
              <pre className={s.scriptPreview}>{sc.content.slice(0, 200)}{sc.content.length > 200 ? '…' : ''}</pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
