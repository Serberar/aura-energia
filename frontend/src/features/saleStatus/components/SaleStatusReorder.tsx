/**
 * Componente para reordenar estados de venta mediante drag & drop
 */

import { useState, type DragEvent } from 'react';
import type { SaleStatus } from '@/types/sales';

interface ReorderStatusItem {
  id: string;
  order: number;
}
import Button from '@/design-system/components/Button';
import SaleStatusBadge from './SaleStatusBadge';
import styles from './SaleStatusReorder.module.scss';

interface SaleStatusReorderProps {
  statuses: SaleStatus[];
  onSave: (reorderedStatuses: ReorderStatusItem[]) => void;
  onCancel: () => void;
  loading?: boolean;
}

/**
 * Interfaz para reordenar estados mediante drag & drop
 * Permite arrastrar y soltar estados para cambiar su orden
 */
const SaleStatusReorder = ({ statuses, onSave, onCancel, loading = false }: SaleStatusReorderProps) => {
  const [items, setItems] = useState<SaleStatus[]>([...statuses].sort((a, b) => a.order - b.order));
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: DragEvent<HTMLLIElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add(styles.dragging);
  };

  const handleDragEnd = (e: DragEvent<HTMLLIElement>) => {
    setDraggedIndex(null);
    e.currentTarget.classList.remove(styles.dragging);
  };

  const handleDragOver = (e: DragEvent<HTMLLIElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: DragEvent<HTMLLIElement>, index: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === index) return;

    const newItems = [...items];
    const draggedItem = newItems[draggedIndex];

    // Remover el item arrastrado
    newItems.splice(draggedIndex, 1);

    // Insertar en la nueva posición
    newItems.splice(index, 0, draggedItem);

    setItems(newItems);
    setDraggedIndex(index);
  };

  const handleSave = () => {
    // Crear array con los nuevos valores de order
    const reorderedStatuses: ReorderStatusItem[] = items.map((item, index) => ({
      id: item.id,
      order: index,
    }));

    onSave(reorderedStatuses);
  };

  const hasChanges = () => {
    return items.some((item, index) => item.order !== index);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Reordenar Estados</h3>
        <p className={styles.hint}>Arrastra y suelta para cambiar el orden</p>
      </div>

      <ul className={styles.list}>
        {items.map((status, index) => (
          <li
            key={status.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(e, index)}
            className={`${styles.item} ${draggedIndex === index ? styles.dragging : ''}`}
          >
            {/* Drag handle */}
            <div className={styles.dragHandle}>
              <span className={styles.dragIcon}>⋮⋮</span>
            </div>

            {/* Nuevo orden */}
            <div className={styles.order}>
              <span className={styles.orderNumber}>{index}</span>
              {status.order !== index && (
                <span className={styles.orderChange}>
                  (antes: {status.order})
                </span>
              )}
            </div>

            {/* Badge y nombre */}
            <div className={styles.statusInfo}>
              <SaleStatusBadge
                name={status.name}
                color={status.color}
                isFinal={status.isFinal}
                size="md"
              />
              {status.isFinal && <span className={styles.finalTag}>Final</span>}
            </div>
          </li>
        ))}
      </ul>

      {/* Acciones */}
      <div className={styles.actions}>
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={loading || !hasChanges()}
        >
          {loading ? 'Guardando...' : 'Guardar Orden'}
        </Button>
      </div>

      {!hasChanges() && (
        <p className={styles.noChanges}>
          No hay cambios en el orden. Arrastra los elementos para reordenarlos.
        </p>
      )}
    </div>
  );
};

export default SaleStatusReorder;
