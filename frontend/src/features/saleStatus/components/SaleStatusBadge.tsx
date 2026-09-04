/**
 * Badge para mostrar un estado de venta con color personalizado
 * Memoizado para evitar re-renders innecesarios en listas
 */

import { memo } from 'react';
import styles from './SaleStatusBadge.module.scss';

export interface SaleStatusBadgeProps {
  name: string;
  color?: string;
  isFinal?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Componente Badge que muestra el nombre del estado con su color
 */
const SaleStatusBadge = memo(function SaleStatusBadge({
  name,
  color = '#6c757d',
  isFinal = false,
  size = 'md',
  className = '',
}: SaleStatusBadgeProps) {
  return (
    <span
      className={`${styles.badge} ${styles[size]} ${className}`}
      style={{ backgroundColor: color, borderColor: color }}
    >
      {name}
      {isFinal && (
        <span className={styles.finalIndicator} title="Estado final">
          ✓
        </span>
      )}
    </span>
  );
});

export default SaleStatusBadge;
