/**
 * Componente ClientPushDataForm - Añadir datos a arrays del cliente
 * Permite añadir teléfonos, direcciones, comentarios y cuentas bancarias
 */

import React, { useState, useEffect } from 'react';
import Input from '@/design-system/components/Input';
import Button from '@/design-system/components/Button';
import Card from '@/design-system/components/Card';
import { clientService } from '../services/clientService';
import type { Client } from '@/types/sales';
import styles from './ClientPushDataForm.module.scss';

export interface ClientPushDataFormProps {
  /** Cliente al que añadir datos */
  client: Client;
  /** Callback cuando se añaden datos exitosamente */
  onSuccess?: (updatedClient: Client) => void;
  /** Callback en caso de error */
  onError?: (error: string) => void;
}

type FieldType = 'phones' | 'addresses' | 'comments' | 'bankAccounts';

interface FieldConfig {
  label: string;
  placeholder: string;
  type: string;
  maxLength?: number;
}

const FIELD_CONFIGS: Record<FieldType, FieldConfig> = {
  phones: {
    label: 'Teléfono',
    placeholder: 'Ej: 612345678',
    type: 'tel',
    maxLength: 15,
  },
  addresses: {
    label: 'Dirección',
    placeholder: 'Ej: Calle Mayor 123, Madrid',
    type: 'text',
    maxLength: 200,
  },
  comments: {
    label: 'Comentario',
    placeholder: 'Añadir nota o comentario...',
    type: 'text',
    maxLength: 500,
  },
  bankAccounts: {
    label: 'Cuenta Bancaria (IBAN)',
    placeholder: 'Ej: ES1234567890123456789012',
    type: 'text',
    maxLength: 34,
  },
};

const ClientPushDataForm: React.FC<ClientPushDataFormProps> = ({
  client,
  onSuccess,
  onError,
}) => {
  const [selectedField, setSelectedField] = useState<FieldType>('phones');
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Auto-limpiar mensaje de éxito después de 3 segundos
  useEffect(() => {
    if (!success) return;

    const timer = setTimeout(() => setSuccess(null), 3000);
    return () => clearTimeout(timer);
  }, [success]);

  const fieldConfig = FIELD_CONFIGS[selectedField];

  const validateValue = (): boolean => {
    if (!value.trim()) {
      setError('El valor no puede estar vacío');
      return false;
    }

    // Validaciones específicas por campo
    switch (selectedField) {
      case 'phones':
        if (!/^\d{9,15}$/.test(value.replace(/\s/g, ''))) {
          setError('El teléfono debe tener entre 9 y 15 dígitos');
          return false;
        }
        break;
      case 'bankAccounts':
        if (!/^[A-Z]{2}\d{22}$/.test(value.replace(/\s/g, ''))) {
          setError('El IBAN debe tener formato válido (Ej: ES + 22 dígitos)');
          return false;
        }
        break;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateValue()) {
      return;
    }

    setLoading(true);

    try {
      const updatedClient = await clientService.pushClientData(client.id, {
        field: selectedField,
        value: value.trim(),
      });

      setSuccess(`${fieldConfig.label} añadido correctamente`);
      setValue('');
      onSuccess?.(updatedClient);
    } catch (err: any) {
      const message = err.response?.data?.message || `Error al añadir ${fieldConfig.label.toLowerCase()}`;
      setError(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentValues = (): string[] => {
    const values = client[selectedField as keyof Client];
    if (!values || !Array.isArray(values)) return [];

    // Para direcciones, extraer solo el string de address
    if (selectedField === 'addresses') {
      return (values as Array<{ address: string }>).map(addr =>
        typeof addr === 'string' ? addr : addr.address
      );
    }

    return values as string[];
  };

  return (
    <Card variant="outlined" padding="lg" className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Añadir Datos al Cliente</h3>
        <p className={styles.subtitle}>
          {client.firstName} {client.lastName}
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.fieldSelector}>
          <label className={styles.label}>Tipo de dato:</label>
          <div className={styles.radioGroup}>
            {(Object.keys(FIELD_CONFIGS) as FieldType[]).map((field) => (
              <label key={field} className={styles.radioOption}>
                <input
                  type="radio"
                  name="fieldType"
                  value={field}
                  checked={selectedField === field}
                  onChange={() => {
                    setSelectedField(field);
                    setValue('');
                    setError(null);
                    setSuccess(null);
                  }}
                  disabled={loading}
                />
                <span>{FIELD_CONFIGS[field].label}</span>
              </label>
            ))}
          </div>
        </div>

        <Input
          label={fieldConfig.label}
          type={fieldConfig.type}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={fieldConfig.placeholder}
          maxLength={fieldConfig.maxLength}
          fullWidth
          disabled={loading}
          error={error || undefined}
          required
        />

        {success && (
          <div className={styles.successMessage}>
            ✓ {success}
          </div>
        )}

        <div className={styles.currentValues}>
          <h4 className={styles.currentValuesTitle}>
            {fieldConfig.label}s actuales ({getCurrentValues().length}):
          </h4>
          {getCurrentValues().length > 0 ? (
            <ul className={styles.valuesList}>
              {getCurrentValues().map((val, index) => (
                <li key={index} className={styles.valueItem}>
                  {val}
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.emptyMessage}>
              No hay {fieldConfig.label.toLowerCase()}s registrados
            </p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          isLoading={loading}
          loadingText="Añadiendo..."
          disabled={loading || !value.trim()}
          fullWidth
        >
          Añadir {fieldConfig.label}
        </Button>
      </form>
    </Card>
  );
};

export default ClientPushDataForm;
