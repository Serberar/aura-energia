import type { ReactNode } from 'react';
import styles from './StatusIndicator.module.scss';

export type StatusIndicatorVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'processing';
export type StatusIndicatorSize = 'sm' | 'md' | 'lg';

export interface StatusIndicatorProps {
  /**
   * Variante del indicador de estado
   */
  variant?: StatusIndicatorVariant;

  /**
   * Tamaño del indicador
   */
  size?: StatusIndicatorSize;

  /**
   * Texto a mostrar junto al indicador
   */
  children?: ReactNode;

  /**
   * Si el indicador está pulsando (animación)
   */
  pulse?: boolean;

  /**
   * Si solo se muestra el punto (sin texto)
   */
  dotOnly?: boolean;

  /**
   * Color personalizado (sobrescribe variant)
   */
  customColor?: string;

  /**
   * Clases CSS adicionales
   */
  className?: string;
}

/**
 * Componente StatusIndicator del Design System
 *
 * Indicador visual de estados con punto de color y texto opcional.
 * Soporta animación de pulso para estados en progreso.
 *
 * @example
 * ```tsx
 * // Indicador básico
 * <StatusIndicator variant="success">Activo</StatusIndicator>
 *
 * // Solo punto con animación
 * <StatusIndicator variant="processing" pulse dotOnly />
 *
 * // Con color personalizado
 * <StatusIndicator customColor="#ff6b6b">Estado personalizado</StatusIndicator>
 *
 * // Tamaño pequeño
 * <StatusIndicator variant="warning" size="sm">Pendiente</StatusIndicator>
 * ```
 */
export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  variant = 'neutral',
  size = 'md',
  children,
  pulse = false,
  dotOnly = false,
  customColor,
  className = '',
}) => {
  const containerClasses = [
    styles.container,
    styles[size],
    dotOnly && styles.dotOnly,
    className,
  ].filter(Boolean).join(' ');

  const dotClasses = [
    styles.dot,
    styles[variant],
    pulse && styles.pulse,
  ].filter(Boolean).join(' ');

  const dotStyle = customColor ? { backgroundColor: customColor } : undefined;

  if (dotOnly) {
    return (
      <span className={containerClasses}>
        <span className={dotClasses} style={dotStyle} aria-hidden="true" />
      </span>
    );
  }

  return (
    <span className={containerClasses}>
      <span className={dotClasses} style={dotStyle} aria-hidden="true" />
      {children && <span className={styles.text}>{children}</span>}
    </span>
  );
};

export default StatusIndicator;