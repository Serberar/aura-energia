// Componentes reutilizables para estados de carga y mensajes

import React from 'react';
import styles from './LoadingComponents.module.css';

// Spinner de carga básico
export interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'white';
}

export const Spinner: React.FC<SpinnerProps> = ({ 
  size = 'medium', 
  color = 'primary' 
}) => {
  return (
    <div 
      className={`${styles.spinner} ${styles[size]} ${styles[color]}`}
      role="status"
      aria-label="Cargando..."
    >
      <span className={styles.visuallyHidden}>Cargando...</span>
    </div>
  );
};

// Componente de loading con mensaje
export interface LoadingMessageProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export const LoadingMessage: React.FC<LoadingMessageProps> = ({ 
  message = 'Cargando...', 
  size = 'medium' 
}) => {
  return (
    <div className={styles.loadingMessage}>
      <Spinner size={size} />
      <span className={styles.message}>{message}</span>
    </div>
  );
};

// Componente para overlay de carga
export interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  children: React.ReactNode;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  message = 'Cargando...',
  children
}) => {
  return (
    <div className={styles.overlayContainer}>
      {children}
      {isVisible && (
        <div className={styles.overlay}>
          <div className={styles.overlayContent}>
            <LoadingMessage message={message} size="large" />
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para botones con loading
export interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading = false,
  loadingText = 'Cargando...',
  children,
  disabled,
  className = '',
  ...props
}) => {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`${styles.loadingButton} ${className} ${isLoading ? styles.loading : ''}`}
    >
      {isLoading && <Spinner size="small" color="white" />}
      <span className={isLoading ? styles.hiddenText : ''}>
        {isLoading ? loadingText : children}
      </span>
    </button>
  );
};

// Componente para mensajes de error
export interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
  variant?: 'error' | 'warning' | 'info';
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onDismiss,
  variant = 'error'
}) => {
  return (
    <div className={`${styles.message} ${styles[variant]}`} role="alert">
      <span className={styles.messageText}>{message}</span>
      {onDismiss && (
        <button 
          className={styles.dismissButton}
          onClick={onDismiss}
          aria-label="Cerrar mensaje"
        >
          ×
        </button>
      )}
    </div>
  );
};

// Componente para mensajes de éxito
export interface SuccessMessageProps {
  message: string;
  onDismiss?: () => void;
  autoHide?: boolean;
  duration?: number;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({
  message,
  onDismiss,
  autoHide = true,
  duration = 3000
}) => {
  React.useEffect(() => {
    if (autoHide && onDismiss) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [autoHide, duration, onDismiss]);

  return (
    <div className={`${styles.message} ${styles.success}`} role="status">
      <span className={styles.messageText}>{message}</span>
      {onDismiss && (
        <button 
          className={styles.dismissButton}
          onClick={onDismiss}
          aria-label="Cerrar mensaje"
        >
          ×
        </button>
      )}
    </div>
  );
};

// Componente para skeleton loading (placeholder)
export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular';
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1em',
  variant = 'text',
  className = ''
}) => {
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div 
      className={`${styles.skeleton} ${styles[variant]} ${className}`}
      style={style}
      aria-label="Cargando contenido..."
    />
  );
};