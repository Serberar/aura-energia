import type { ReactNode, ButtonHTMLAttributes } from 'react';
import styles from './Button.module.scss';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'success' | 'warning';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Variante visual del botón
   */
  variant?: ButtonVariant;
  
  /**
   * Tamaño del botón
   */
  size?: ButtonSize;
  
  /**
   * Si el botón está en estado de carga
   */
  isLoading?: boolean;
  
  /**
   * Texto a mostrar durante la carga
   */
  loadingText?: string;
  
  /**
   * Icono a mostrar (lado izquierdo)
   */
  leftIcon?: ReactNode;
  
  /**
   * Icono a mostrar (lado derecho)
   */
  rightIcon?: ReactNode;
  
  /**
   * Si el botón debe ocupar todo el ancho disponible
   */
  fullWidth?: boolean;
  
  /**
   * Contenido del botón
   */
  children: ReactNode;
}

/**
 * Componente Button del Design System
 * 
 * Botón reutilizable que sigue los tokens de diseño establecidos.
 * Soporta múltiples variantes, tamaños y estados.
 * 
 * @example
 * ```tsx
 * // Botón primario básico
 * <Button variant="primary">Guardar</Button>
 * 
 * // Botón con icono y estado de carga
 * <Button 
 *   variant="success" 
 *   size="lg"
 *   leftIcon={<SaveIcon />}
 *   isLoading={isSubmitting}
 *   loadingText="Guardando..."
 * >
 *   Guardar Cliente
 * </Button>
 * 
 * // Botón de ancho completo
 * <Button variant="primary" fullWidth>
 *   Continuar
 * </Button>
 * ```
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText = 'Cargando...',
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...props
}) => {
  const baseClasses = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    isLoading && styles.loading,
    className,
  ].filter(Boolean).join(' ');

  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      className={baseClasses}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      {...props}
    >
      {isLoading && (
        <span className={styles.spinner} role="status" aria-hidden="true">
          <svg className={styles.spinnerIcon} viewBox="0 0 24 24" fill="none">
            <circle
              className={styles.spinnerCircle}
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className={styles.spinnerPath}
              fill="currentColor"
              d="m12 2a10 10 0 0 1 10 10h-2a8 8 0 0 0-8-8v-2z"
            />
          </svg>
        </span>
      )}
      
      {!isLoading && leftIcon && (
        <span className={styles.leftIcon} aria-hidden="true">
          {leftIcon}
        </span>
      )}
      
      <span className={styles.content}>
        {isLoading ? loadingText : children}
      </span>
      
      {!isLoading && rightIcon && (
        <span className={styles.rightIcon} aria-hidden="true">
          {rightIcon}
        </span>
      )}
    </button>
  );
};

export default Button;