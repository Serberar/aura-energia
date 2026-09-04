/**
 * Formulario para crear o editar estados de venta
 * Usa validación Zod centralizada
 */

import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import type { SaleStatus, CreateSaleStatusData } from '@/types/sales';
import Button from '@/design-system/components/Button';
import Input from '@/design-system/components/Input';
import SaleStatusBadge from './SaleStatusBadge';
import { saleStatusSchema } from '@/validation';
import styles from './SaleStatusForm.module.scss';

interface SaleStatusFormProps {
  status?: SaleStatus;
  onSubmit: (data: CreateSaleStatusData) => void;
  onCancel?: () => void;
  loading?: boolean;
  error?: string | null;
}

/**
 * Formulario para crear o editar un estado de venta
 * Incluye validación y preview del badge con el color seleccionado
 */
const SaleStatusForm = ({ status, onSubmit, onCancel, loading = false, error }: SaleStatusFormProps) => {
  const isEdit = Boolean(status);

  const [formData, setFormData] = useState<CreateSaleStatusData>({
    name: status?.name || '',
    order: status?.order || 0,
    color: status?.color || '#6c757d',
    isFinal: status?.isFinal || false,
    isCancelled: status?.isCancelled || false,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Actualizar formulario cuando cambia el estado a editar
  useEffect(() => {
    if (status) {
      setFormData({
        name: status.name,
        order: status.order,
        color: status.color || '#6c757d',
        isFinal: status.isFinal,
        isCancelled: status.isCancelled,
      });
    }
  }, [status]);

  // Validar formulario usando Zod
  const validateForm = (): boolean => {
    const result = saleStatusSchema.safeParse(formData);

    if (result.success) {
      setValidationErrors({});
      return true;
    }

    const errors: Record<string, string> = {};
    // Zod v4 usa .issues en lugar de .errors
    for (const issue of result.error.issues) {
      const field = issue.path[0] as string;
      if (!errors[field]) {
        errors[field] = issue.message;
      }
    }

    setValidationErrors(errors);
    return false;
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }));

    // Limpiar error del campo
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  // Preview del badge
  const previewStatus: SaleStatus = {
    id: 'preview',
    name: formData.name || 'Preview',
    order: formData.order,
    color: formData.color || '#6c757d',
    isFinal: formData.isFinal || false,
    isCancelled: formData.isCancelled || false,
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h3 className={styles.title}>{isEdit ? 'Editar Estado' : 'Nuevo Estado'}</h3>

      {/* Preview del badge */}
      <div className={styles.preview}>
        <label className={styles.previewLabel}>Vista previa:</label>
        <SaleStatusBadge name={previewStatus.name} color={previewStatus.color} isFinal={previewStatus.isFinal} size="lg" />
      </div>

      {/* Campo Nombre */}
      <div className={styles.field}>
        <Input
          label="Nombre del estado"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Ej: Pendiente, En proceso, Cerrada..."
          error={validationErrors.name}
          required
        />
      </div>

      {/* Campo Orden */}
      <div className={styles.field}>
        <Input
          label="Orden de visualización"
          name="order"
          type="number"
          value={formData.order}
          onChange={handleInputChange}
          placeholder="0"
          error={validationErrors.order}
          required
          helpText="Los estados se ordenarán según este número (menor a mayor)"
        />
      </div>

      {/* Campo Color */}
      <div className={styles.field}>
        <label htmlFor="color" className={styles.label}>
          Color del badge
        </label>
        <div className={styles.colorPicker}>
          <input
            id="color"
            name="color"
            type="color"
            value={formData.color}
            onChange={handleInputChange}
            className={styles.colorInput}
          />
          <Input
            name="color"
            type="text"
            value={formData.color}
            onChange={handleInputChange}
            placeholder="#6c757d"
            className={styles.colorText}
          />
        </div>
      </div>

      {/* Checkbox Estado Final */}
      <div className={styles.checkboxField}>
        <label className={styles.checkboxLabel}>
          <input
            name="isFinal"
            type="checkbox"
            checked={formData.isFinal}
            onChange={handleInputChange}
            className={styles.checkbox}
          />
          <span>¿Es un estado final?</span>
        </label>
        <p className={styles.helperText}>
          Los estados finales indican que la venta ha concluido
        </p>
      </div>

      {/* Checkbox Estado Cancelación */}
      <div className={styles.checkboxField}>
        <label className={styles.checkboxLabel}>
          <input
            name="isCancelled"
            type="checkbox"
            checked={formData.isCancelled}
            onChange={handleInputChange}
            className={styles.checkbox}
          />
          <span>¿Es un estado de cancelación?</span>
        </label>
        <p className={styles.helperText}>
          Las ventas con este estado no se cuentan en las estadísticas
        </p>
      </div>

      {/* Error general */}
      {error && <div className={styles.error}>{error}</div>}

      {/* Botones */}
      <div className={styles.actions}>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
        )}
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
};

export default SaleStatusForm;
