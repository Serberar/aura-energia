import type { ReactNode } from 'react';
import styles from './EmptyState.module.scss';

export type EmptyStateVariant = 'default' | 'search' | 'error' | 'noData';

export interface EmptyStateProps {
  /**
   * Variante del estado vacío
   */
  variant?: EmptyStateVariant;

  /**
   * Título principal
   */
  title: string;

  /**
   * Descripción o mensaje adicional
   */
  description?: string;

  /**
   * Icono personalizado (SVG o componente)
   */
  icon?: ReactNode;

  /**
   * Acción principal (botón o elemento)
   */
  action?: ReactNode;

  /**
   * Acción secundaria (enlace o botón)
   */
  secondaryAction?: ReactNode;

  /**
   * Imagen ilustrativa (URL)
   */
  image?: string;

  /**
   * Tamaño del componente
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Clases CSS adicionales
   */
  className?: string;
}

/**
 * Componente EmptyState del Design System
 *
 * Estado vacío reutilizable para mostrar cuando no hay datos,
 * búsquedas sin resultados, errores, etc.
 *
 * @example
 * ```tsx
 * // Estado vacío básico
 * <EmptyState
 *   title="No hay productos"
 *   description="Aún no has agregado ningún producto"
 *   action={<Button onClick={handleCreate}>Crear producto</Button>}
 * />
 *
 * // Sin resultados de búsqueda
 * <EmptyState
 *   variant="search"
 *   title="No se encontraron resultados"
 *   description="Intenta con otros términos de búsqueda"
 * />
 *
 * // Con icono personalizado
 * <EmptyState
 *   icon={<CustomIcon />}
 *   title="Sin ventas"
 *   description="Todavía no se han registrado ventas"
 * />
 *
 * // Con imagen
 * <EmptyState
 *   image="/empty-cart.svg"
 *   title="Tu carrito está vacío"
 *   description="Agrega productos para comenzar"
 *   action={<Button>Ver productos</Button>}
 * />
 * ```
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'default',
  title,
  description,
  icon,
  action,
  secondaryAction,
  image,
  size = 'md',
  className = '',
}) => {
  const containerClasses = [
    styles.container,
    styles[size],
    className,
  ].filter(Boolean).join(' ');

  // Iconos por defecto según variante
  const defaultIcons = {
    default: (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
        <path d="M32 20v24M20 32h24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    search: (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="28" cy="28" r="12" stroke="currentColor" strokeWidth="2" />
        <path d="M37 37l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M25 28h6M28 25v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    error: (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2" />
        <path d="M32 20v16M32 44v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    noData: (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="16" y="24" width="32" height="24" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M16 30h32M24 24v-8M40 24v-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  };

  const displayIcon = icon || defaultIcons[variant];

  return (
    <div className={containerClasses}>
      {image ? (
        <div className={styles.imageWrapper}>
          <img src={image} alt={title} className={styles.image} />
        </div>
      ) : (
        <div className={styles.iconWrapper}>
          {displayIcon}
        </div>
      )}

      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        {description && (
          <p className={styles.description}>{description}</p>
        )}
      </div>

      {(action || secondaryAction) && (
        <div className={styles.actions}>
          {action && <div className={styles.primaryAction}>{action}</div>}
          {secondaryAction && (
            <div className={styles.secondaryAction}>{secondaryAction}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;