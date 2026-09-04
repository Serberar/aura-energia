import React, { forwardRef, useState } from 'react';
import type { ReactNode } from 'react';
import styles from './Input.module.scss';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Etiqueta del input */
  label?: string;
  /** Mensaje de error */
  error?: string;
  /** Texto de ayuda */
  helpText?: string;
  /** Tamaño del input */
  size?: 'sm' | 'md' | 'lg';
  /** Si el input está en estado de error */
  hasError?: boolean;
  /** Si el input es requerido */
  required?: boolean;
  /** Contenido antes del input */
  startAdornment?: ReactNode;
  /** Contenido después del input */
  endAdornment?: ReactNode;
  /** Ancho completo */
  fullWidth?: boolean;
  /** Variante visual */
  variant?: 'outlined' | 'filled';
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helpText,
  size = 'md',
  hasError,
  required,
  startAdornment,
  endAdornment,
  fullWidth,
  variant = 'outlined',
  className,
  disabled,
  id,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const isError = hasError || !!error;
  const hasValue = props.value !== undefined ? String(props.value).length > 0 : false;

  const containerClasses = [
    styles.container,
    fullWidth && styles.fullWidth,
    className
  ].filter(Boolean).join(' ');

  const inputContainerClasses = [
    styles.inputContainer,
    styles[size],
    styles[variant],
    isFocused && styles.focused,
    isError && styles.error,
    disabled && styles.disabled,
    hasValue && styles.hasValue,
    startAdornment && styles.hasStartAdornment,
    endAdornment && styles.hasEndAdornment
  ].filter(Boolean).join(' ');

  const inputClasses = [
    styles.input,
    startAdornment && styles.inputWithStart,
    endAdornment && styles.inputWithEnd
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {label && (
        <label 
          htmlFor={inputId} 
          className={`${styles.label} ${required ? styles.required : ''}`}
        >
          {label}
          {required && <span className={styles.asterisk}>*</span>}
        </label>
      )}
      
      <div className={inputContainerClasses}>
        {startAdornment && (
          <div className={styles.startAdornment}>
            {startAdornment}
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={inputClasses}
          disabled={disabled}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        
        {endAdornment && (
          <div className={styles.endAdornment}>
            {endAdornment}
          </div>
        )}
      </div>
      
      {(error || helpText) && (
        <div className={styles.helperText}>
          {error && (
            <span className={styles.errorText}>
              {error}
            </span>
          )}
          {!error && helpText && (
            <span className={styles.helpText}>
              {helpText}
            </span>
          )}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;