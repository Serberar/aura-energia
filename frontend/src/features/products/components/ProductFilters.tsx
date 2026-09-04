/**
 * Componente ProductFilters - Filtros de búsqueda de productos
 */

import React from 'react';
import Input from '@/design-system/components/Input';
import Button from '@/design-system/components/Button';
import styles from './ProductFilters.module.scss';

export interface ProductFiltersProps {
  /** Término de búsqueda */
  searchTerm: string;
  /** Callback al cambiar el término de búsqueda */
  onSearchChange: (value: string) => void;
  /** Filtro de estado activo (null = todos, true = activos, false = inactivos) */
  filterActive: boolean | null;
  /** Callback al cambiar el filtro de estado */
  onFilterActiveChange: (value: boolean | null) => void;
  /** Callback para limpiar filtros */
  onClearFilters?: () => void;
  /** Si muestra el botón de crear */
  showCreateButton?: boolean;
  /** Callback al hacer click en crear */
  onCreateClick?: () => void;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({
  searchTerm,
  onSearchChange,
  filterActive,
  onFilterActiveChange,
  onClearFilters,
  showCreateButton = true,
  onCreateClick,
}) => {
  const hasActiveFilters = searchTerm.trim() !== '' || filterActive !== null;

  return (
    <div className={styles.filters}>
      <div className={styles.searchSection}>
        <Input
          type="text"
          placeholder="Buscar por nombre, descripción o SKU..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          fullWidth
          size="md"
          aria-label="Buscar productos"
        />
      </div>

      <div className={styles.filterSection}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Estado:</label>
          <div className={styles.filterButtons}>
            <Button
              variant={filterActive === null ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => onFilterActiveChange(null)}
              aria-label="Mostrar todos los productos"
            >
              Todos
            </Button>
            <Button
              variant={filterActive === true ? 'success' : 'secondary'}
              size="sm"
              onClick={() => onFilterActiveChange(true)}
              aria-label="Mostrar solo productos activos"
            >
              Activos
            </Button>
            <Button
              variant={filterActive === false ? 'warning' : 'secondary'}
              size="sm"
              onClick={() => onFilterActiveChange(false)}
              aria-label="Mostrar solo productos inactivos"
            >
              Inactivos
            </Button>
          </div>
        </div>

        <div className={styles.actions}>
          {hasActiveFilters && onClearFilters && (
            <Button
              variant="tertiary"
              size="sm"
              onClick={onClearFilters}
              aria-label="Limpiar filtros"
            >
              Limpiar filtros
            </Button>
          )}

          {showCreateButton && onCreateClick && (
            <Button
              variant="primary"
              size="md"
              onClick={onCreateClick}
              aria-label="Crear nuevo producto"
            >
              + Nuevo Producto
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductFilters;
