/**
 * Componente ProductList - Lista de productos con filtros
 */

import React, { useState } from 'react';
import { useProducts } from '../hooks';
import { useProductActions } from '../hooks';
import ProductCard from './ProductCard';
import ProductFilters from './ProductFilters';
import type { Product } from '@/types/sales';
import { logger } from '@/utils/logger';
import styles from './ProductList.module.scss';

export interface ProductListProps {
  /** Callback al hacer click en editar */
  onEdit?: (product: Product) => void;
  /** Callback al hacer click en crear */
  onCreate?: () => void;
  /** Callback al hacer click en un producto */
  onProductClick?: (product: Product) => void;
  /** Si se debe auto-cargar al montar */
  autoFetch?: boolean;
  /** Vista (grid o list) */
  view?: 'grid' | 'list';
}

const ProductList: React.FC<ProductListProps> = ({
  onEdit,
  onCreate,
  onProductClick,
  autoFetch = true,
  view = 'grid',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);

  const { products, loading, error, stats, refresh } = useProducts({
    autoFetch,
    filterActive,
    searchTerm,
  });

  const { toggleActive } = useProductActions();

  const handleToggleActive = async (product: Product) => {
    try {
      await toggleActive(product.id);
    } catch (error) {
      logger.error('Error al cambiar estado del producto', error as Error);
    }
  };
  
  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterActive(null);
  };

  if (error) {
    return (
      <div className={styles.error}>
        <div className={styles.errorContent}>
          <h3>Error al cargar productos</h3>
          <p>{error}</p>
          <button onClick={refresh} className={styles.retryButton}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h2 className={styles.title}>Productos</h2>
          <div className={styles.stats}>
            <span className={styles.stat}>
              Total: <strong>{stats.total}</strong>
            </span>
            <span className={styles.stat}>
              Activos: <strong className={styles.success}>{stats.active}</strong>
            </span>
            <span className={styles.stat}>
              Inactivos: <strong className={styles.warning}>{stats.inactive}</strong>
            </span>
          </div>
        </div>
      </div>

      <ProductFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterActive={filterActive}
        onFilterActiveChange={setFilterActive}
        onClearFilters={handleClearFilters}
        showCreateButton={!!onCreate}
        onCreateClick={onCreate}
      />

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Cargando productos...</p>
        </div>
      ) : products.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyContent}>
            <div className={styles.emptyIcon}>📦</div>
            <h3>No hay productos</h3>
            <p>
              {searchTerm || filterActive !== null
                ? 'No se encontraron productos con los filtros aplicados'
                : 'Aún no hay productos registrados'}
            </p>
            {onCreate && !searchTerm && filterActive === null && (
              <button onClick={onCreate} className={styles.createButton}>
                Crear primer producto
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className={`${styles.list} ${styles[view]}`}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={onEdit}
              onToggleActive={handleToggleActive}
              onClick={onProductClick}
              compact={view === 'list'}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductList;
