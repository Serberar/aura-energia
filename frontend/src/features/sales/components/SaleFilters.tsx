/**
 * Filtros para ventas
 */

import { useState, useEffect } from 'react';
import type { SaleFilters as Filters } from '@/types/sales';
import { useSaleStatus } from '@/features/saleStatus';
import { getComerciales } from '../services/saleService';
import Button from '@/design-system/components/Button';
import styles from './SaleFilters.module.scss';

interface SaleFiltersProps {
  filters: Filters;
  onApplyFilters: (filters: Filters) => void;
  onClearFilters: () => void;
}

const SaleFilters = ({ filters, onApplyFilters, onClearFilters }: SaleFiltersProps) => {
  const [localFilters, setLocalFilters] = useState<Filters>(filters);
  const [comerciales, setComerciales] = useState<string[]>([]);
  const { statuses } = useSaleStatus();

  useEffect(() => {
    getComerciales()
      .then(setComerciales)
      .catch(() => setComerciales([]));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setLocalFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
  };

  const handleClear = () => {
    setLocalFilters({});
    onClearFilters();
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Filtros</h3>
      <div className={styles.filters}>
        <input
          name="clientDniOrPhone"
          value={localFilters.clientDniOrPhone || ''}
          onChange={handleChange}
          placeholder="DNI o Teléfono del Cliente"
          className={styles.input}
        />
        <select
          name="statusId"
          value={localFilters.statusId || ''}
          onChange={handleChange}
          className={styles.select}
        >
          <option value="">Todos los estados</option>
          {statuses.map((status) => (
            <option key={status.id} value={status.id}>
              {status.name}
            </option>
          ))}
        </select>
        <select
          name="comercial"
          value={localFilters.comercial || ''}
          onChange={handleChange}
          className={styles.select}
        >
          <option value="">Todos los comerciales</option>
          {comerciales.map((comercial) => (
            <option key={comercial} value={comercial}>
              {comercial}
            </option>
          ))}
        </select>
        <input
          name="from"
          type="date"
          value={localFilters.from || ''}
          onChange={handleChange}
          className={styles.input}
        />
        <input
          name="to"
          type="date"
          value={localFilters.to || ''}
          onChange={handleChange}
          className={styles.input}
        />
      </div>
      <div className={styles.actions}>
        <Button variant="secondary" onClick={handleClear}>Limpiar</Button>
        <Button variant="primary" onClick={handleApply}>Buscar</Button>
      </div>
    </div>
  );
};

export default SaleFilters;
