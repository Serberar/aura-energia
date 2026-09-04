/**
 * Componente ProductCard - Tarjeta individual de producto
 * Memoizado para evitar re-renders innecesarios en listas
 */

import React, { memo } from 'react';
import Card from '@/design-system/components/Card';
import Button from '@/design-system/components/Button';
import type { Product } from '@/types/sales';
import styles from './ProductCard.module.scss';

export interface ProductCardProps {
  /** Producto a mostrar */
  product: Product;
  /** Callback al hacer click en editar */
  onEdit?: (product: Product) => void;
  /** Callback al hacer click en toggle activo */
  onToggleActive?: (product: Product) => void;
  /** Si se debe mostrar acciones */
  showActions?: boolean;
  /** Si está en modo compacto */
  compact?: boolean;
  /** Callback al hacer click en la tarjeta */
  onClick?: (product: Product) => void;
}

const ProductCard = memo(function ProductCard({
  product,
  onEdit,
  onToggleActive,
  showActions = true,
  compact = false,
  onClick,
}: ProductCardProps) {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(product);
  };

  const handleToggleActive = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleActive?.(product);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <Card
      variant="outlined"
      hoverable={!!onClick}
      clickable={!!onClick}
      onClick={() => onClick?.(product)}
      className={`${styles.productCard} ${compact ? styles.compact : ''}`}
    >
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h3 className={styles.name}>{product.name}</h3>
          <div className={styles.badges}>
            <span className={`${styles.badge} ${product.active ? styles.active : styles.inactive}`}>
              {product.active ? 'Activo' : 'Inactivo'}
            </span>
            {product.tipo && product.tipo !== 'unico' && (
              <span className={`${styles.badge} ${product.tipo === 'periodico' ? styles.periodico : styles.consumo}`}>
                {product.tipo === 'periodico' ? 'Periódico' : 'Consumo'}
              </span>
            )}
          </div>
        </div>
        {product.sku && (
          <span className={styles.sku}>SKU: {product.sku}</span>
        )}
      </div>

      {product.description && !compact && (
        <p className={styles.description}>{product.description}</p>
      )}

      <div className={styles.details}>
        <div className={styles.price}>
          <span className={styles.priceLabel}>
            {product.tipo === 'consumo' ? 'Base/mes:' : product.tipo === 'periodico' ? `Precio (${product.periodo ?? ''}):` : 'Precio:'}
          </span>
          <span className={styles.priceValue}>{formatPrice(product.price)}</span>
        </div>

        {product.tipo === 'consumo' && product.precioConsumo != null && (
          <div className={styles.price}>
            <span className={styles.priceLabel}>{product.unidadConsumo ? `€/${product.unidadConsumo}:` : '€/unidad:'}</span>
            <span className={styles.priceValue}>{product.precioConsumo.toFixed(4)} €</span>
          </div>
        )}

        {!compact && (
          <div className={styles.dates}>
            <span className={styles.dateLabel}>Creado:</span>
            <span className={styles.dateValue}>{product.createdAt ? formatDate(product.createdAt) : '-'}</span>
          </div>
        )}
      </div>

      {showActions && (
        <div className={styles.actions}>
          <Button
            variant="primary"
            size="sm"
            onClick={handleEdit}
            aria-label="Editar producto"
          >
            Editar
          </Button>

          <Button
            variant={product.active ? 'warning' : 'success'}
            size="sm"
            onClick={handleToggleActive}
            aria-label={product.active ? 'Desactivar producto' : 'Activar producto'}
          >
            {product.active ? 'Desactivar' : 'Activar'}
          </Button>
        </div>
      )}
    </Card>
  );
});

export default ProductCard;
