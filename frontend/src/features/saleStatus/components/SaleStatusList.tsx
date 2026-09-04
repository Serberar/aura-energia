/**
 * Lista de estados de venta con acciones CRUD
 */

import type { SaleStatus } from '@/types/sales';
import Button from '@/design-system/components/Button';
import SaleStatusBadge from './SaleStatusBadge';
import styles from './SaleStatusList.module.scss';

interface SaleStatusListProps {
  statuses: SaleStatus[];
  onEdit: (status: SaleStatus) => void;
  onDelete: (status: SaleStatus) => void;
  onReorder?: () => void;
  loading?: boolean;
}

/**
 * Lista ordenada de estados de venta con acciones de editar y eliminar
 * Muestra los estados ordenados por el campo 'order'
 */
const SaleStatusList = ({ statuses, onEdit, onDelete, onReorder, loading = false }: SaleStatusListProps) => {
  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Cargando estados...</p>
      </div>
    );
  }

  if (statuses.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No hay estados de venta configurados</p>
        <p className={styles.emptyHint}>Crea tu primer estado para comenzar</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header con botón de reordenar */}
      <div className={styles.header}>
        <h3 className={styles.title}>Estados de Venta ({statuses.length})</h3>
        {onReorder && statuses.length > 1 && (
          <Button variant="secondary" size="sm" onClick={onReorder}>
            ⇅ Reordenar
          </Button>
        )}
      </div>

      {/* Lista de estados */}
      <ul className={styles.list}>
        {statuses.map((status) => (
          <li key={status.id} className={styles.item}>
            {/* Orden */}
            <div className={styles.order}>
              <span className={styles.orderNumber}>{status.order}</span>
            </div>

            {/* Badge */}
            <div className={styles.badge}>
              <SaleStatusBadge
                name={status.name}
                color={status.color}
                isFinal={status.isFinal}
                size="md"
              />
            </div>

            {/* Info */}
            <div className={styles.info}>
              <span className={styles.name}>{status.name}</span>
              {status.isFinal && <span className={styles.finalTag}>Estado final</span>}
              {status.isSystem && <span className={styles.systemTag}>Sistema</span>}
            </div>

            {/* Acciones */}
            <div className={styles.actions}>
              {!status.isSystem && (
                <>
                  <Button variant="secondary" size="sm" onClick={() => onEdit(status)}>
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => onDelete(status)}
                    title={`Eliminar estado: ${status.name}`}
                  >
                    Eliminar
                  </Button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SaleStatusList;
