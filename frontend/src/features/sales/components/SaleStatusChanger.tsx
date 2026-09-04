/**
 * Componente para cambiar el estado de una venta
 */

import { useState } from 'react';
import type { Sale, SaleStatus } from '@/types/sales';
import { SaleStatusBadge } from '@/features/saleStatus';
import Button from '@/design-system/components/Button';
import styles from './SaleStatusChanger.module.scss';

interface SaleStatusChangerProps {
  sale: Sale;
  availableStatuses: SaleStatus[];
  onChangeStatus: (statusId: string) => void | Promise<void>;
  loading?: boolean;
}

const SaleStatusChanger = ({ sale, availableStatuses, onChangeStatus, loading = false }: SaleStatusChangerProps) => {
  const [selectedStatusId, setSelectedStatusId] = useState(sale.statusId);

  const handleChange = async () => {
    if (selectedStatusId !== sale.statusId) {
      await onChangeStatus(selectedStatusId);
    }
  };

  const hasChanged = selectedStatusId !== sale.statusId;

  return (
    <div className={styles.container}>
      <h4 className={styles.title}>Cambiar Estado</h4>

      <div className={styles.current}>
        <span className={styles.label}>Estado actual:</span>
        {sale.status && (
          <SaleStatusBadge
            name={sale.status.name}
            color={sale.status.color}
            isFinal={sale.status.isFinal}
            size="md"
          />
        )}
      </div>

      <div className={styles.selector}>
        {availableStatuses.map((status) => (
          <label key={status.id} className={styles.option}>
            <input
              type="radio"
              name="status"
              value={status.id}
              checked={selectedStatusId === status.id}
              onChange={(e) => setSelectedStatusId(e.target.value)}
              disabled={loading}
            />
            <SaleStatusBadge
              name={status.name}
              color={status.color}
              isFinal={status.isFinal}
              size="sm"
            />
          </label>
        ))}
      </div>

      <Button
        variant="primary"
        onClick={handleChange}
        disabled={loading || !hasChanged}
        className={styles.submitButton}
      >
        {loading ? 'Guardando...' : 'Cambiar Estado'}
      </Button>
    </div>
  );
};

export default SaleStatusChanger;
