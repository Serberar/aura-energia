import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/design-system/components/Button';
import {
  listTemplates,
  createTemplate,
  deleteTemplate,
  type ContractTemplate,
} from '@/features/settings/services/contractTemplateService';
import styles from './ContractTemplatesPage.module.scss';

const ContractTemplatesPage = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listTemplates();
      setTemplates(data);
    } catch {
      setError('No se pudieron cargar las plantillas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const newTemplate = await createTemplate({ nombre: 'Nueva plantilla' });
      navigate(`/settings/contract/${newTemplate.id}`);
    } catch {
      setError('No se pudo crear la plantilla');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar esta plantilla? Esta acción no se puede deshacer.')) return;
    setDeletingId(id);
    try {
      await deleteTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar la plantilla';
      setError(msg);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Plantillas de Contrato</h1>
          <p className={styles.subtitle}>
            Crea y gestiona las plantillas que los comerciales pueden usar al enviar contratos.
          </p>
        </div>
        <Button variant="primary" onClick={handleCreate} disabled={creating}>
          {creating ? 'Creando...' : '+ Nueva plantilla'}
        </Button>
      </div>

      {error && <p className={styles.errorMsg}>{error}</p>}

      {loading ? (
        <p className={styles.loading}>Cargando plantillas...</p>
      ) : templates.length === 0 ? (
        <p className={styles.empty}>No hay plantillas. Crea la primera.</p>
      ) : (
        <div className={styles.list}>
          {templates.map((t) => (
            <div
              key={t.id}
              className={styles.card}
              onClick={() => navigate(`/settings/contract/${t.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/settings/contract/${t.id}`)}
            >
              <div className={styles.cardMain}>
                <span className={styles.cardName}>{t.nombre}</span>
                {t.esDefecto && <span className={styles.defaultBadge}>Por defecto</span>}
              </div>
              <div className={styles.cardActions}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); navigate(`/settings/contract/${t.id}`); }}
                >
                  Editar
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={(e) => handleDelete(t.id, e)}
                  disabled={deletingId === t.id}
                >
                  {deletingId === t.id ? '...' : 'Eliminar'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContractTemplatesPage;
