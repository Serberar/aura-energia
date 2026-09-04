import React, { forwardRef, useState } from 'react';
import type { ReactNode } from 'react';
import styles from './Select.module.scss';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /** Etiqueta del select */
  label?: string;
  /** Mensaje de error */
  error?: string;
  /** Texto de ayuda */
  helpText?: string;
  /** Tamaño del select */
  size?: 'sm' | 'md' | 'lg';
  /** Si el select está en estado de error */
  hasError?: boolean;
  /** Si el select es requerido */
  required?: boolean;
  /** Ancho completo */
  fullWidth?: boolean;
  /** Variante visual */
  variant?: 'outlined' | 'filled';
  /** Opciones del select */
  options: SelectOption[];
  /** Placeholder cuando no hay selección */
  placeholder?: string;
  /** Icono personalizado antes del select */
  startAdornment?: ReactNode;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  helpText,
  size = 'md',
  hasError,
  required,
  fullWidth,
  variant = 'outlined',
  options,
  placeholder,
  startAdornment,
  className,
  disabled,
  id,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  const isError = hasError || !!error;
  const hasValue = props.value !== undefined && props.value !== '';

  const containerClasses = [
    styles.container,
    fullWidth && styles.fullWidth,
    className
  ].filter(Boolean).join(' ');

  const selectContainerClasses = [
    styles.selectContainer,
    styles[size],
    styles[variant],
    isFocused && styles.focused,
    isError && styles.error,
    disabled && styles.disabled,
    hasValue && styles.hasValue,
    startAdornment && styles.hasStartAdornment
  ].filter(Boolean).join(' ');

  const selectClasses = [
    styles.select,
    startAdornment && styles.selectWithStart
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {label && (
        <label
          htmlFor={selectId}
          className={`${styles.label} ${required ? styles.required : ''}`}
        >
          {label}
          {required && <span className={styles.asterisk}>*</span>}
        </label>
      )}

      <div className={selectContainerClasses}>
        {startAdornment && (
          <div className={styles.startAdornment}>
            {startAdornment}
          </div>
        )}

        <select
          ref={ref}
          id={selectId}
          className={selectClasses}
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
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>

        <div className={styles.chevron} aria-hidden="true">
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2.5 4.5L6 8L9.5 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
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

Select.displayName = 'Select';

export default Select;