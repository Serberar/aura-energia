import type { ReactNode } from 'react';
import styles from './Badge.module.scss';

export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  /**
   * Variante de color del badge
   */
  variant?: BadgeVariant;

  /**
   * Tamaño del badge
   */
  size?: BadgeSize;

  /**
   * Contenido del badge
   */
  children: ReactNode;

  /**
   * Si el badge tiene borde punteado (para estados activos)
   */
  dot?: boolean;

  /**
   * Clases CSS adicionales
   */
  className?: string;

  /**
   * Callback al hacer click
   */
  onClick?: () => void;
}

/**
 * Componente Badge del Design System
 *
 * Badge para mostrar estados, etiquetas o contadores.
 * Soporta múltiples variantes de color y tamaños.
 *
 * @example
 * ```tsx
 * // Badge básico
 * <Badge variant="success">Activo</Badge>
 *
 * // Badge con punto indicador
 * <Badge variant="warning" dot>Pendiente</Badge>
 *
 * // Badge pequeño para contadores
 * <Badge variant="danger" size="sm">3</Badge>
 *
 * // Badge clickeable
 * <Badge variant="info" onClick={() => console.log('clicked')}>
 *   Ver más
 * </Badge>
 * ```
 */
export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  children,
  dot = false,
  className = '',
  onClick,
}) => {
  const baseClasses = [
    styles.badge,
    styles[variant],
    styles[size],
    dot && styles.withDot,
    onClick && styles.clickable,
    className,
  ].filter(Boolean).join(' ');

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <span
      className={baseClasses}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {dot && <span className={styles.dot} aria-hidden="true" />}
      <span className={styles.content}>{children}</span>
    </span>
  );
};

export default Badge;