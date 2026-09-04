import React, { forwardRef, useState } from 'react';
import styles from './DatePicker.module.scss';

export interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  /** Etiqueta del date picker */
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
  /** Ancho completo */
  fullWidth?: boolean;
  /** Variante visual */
  variant?: 'outlined' | 'filled';
  /** Fecha mínima permitida (YYYY-MM-DD) */
  minDate?: string;
  /** Fecha máxima permitida (YYYY-MM-DD) */
  maxDate?: string;
  /** Si incluye selector de hora */
  includeTime?: boolean;
}

const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(({
  label,
  error,
  helpText,
  size = 'md',
  hasError,
  required,
  fullWidth,
  variant = 'outlined',
  minDate,
  maxDate,
  includeTime = false,
  className,
  disabled,
  id,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  const inputId = id || `datepicker-${Math.random().toString(36).substr(2, 9)}`;
  const isError = hasError || !!error;
  const hasValue = props.value !== undefined && String(props.value).length > 0;

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
    hasValue && styles.hasValue
  ].filter(Boolean).join(' ');

  const inputClasses = [styles.input].filter(Boolean).join(' ');

  const inputType = includeTime ? 'datetime-local' : 'date';

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
        <div className={styles.iconWrapper}>
          <svg
            className={styles.icon}
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12.6667 2.66667H3.33333C2.59695 2.66667 2 3.26362 2 4V13.3333C2 14.0697 2.59695 14.6667 3.33333 14.6667H12.6667C13.403 14.6667 14 14.0697 14 13.3333V4C14 3.26362 13.403 2.66667 12.6667 2.66667Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10.6667 1.33333V4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M5.33333 1.33333V4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 6.66667H14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <input
          ref={ref}
          id={inputId}
          type={inputType}
          className={inputClasses}
          disabled={disabled}
          min={minDate}
          max={maxDate}
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

DatePicker.displayName = 'DatePicker';

export default DatePicker;