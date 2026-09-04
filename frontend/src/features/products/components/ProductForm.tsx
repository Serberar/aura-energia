/**
 * Componente ProductForm - Formulario para crear/editar productos
 * Usa validación Zod centralizada
 */

import React, { useState, useEffect } from 'react';
import Input from '@/design-system/components/Input';
import Button from '@/design-system/components/Button';
import Card from '@/design-system/components/Card';
import type { Product, CreateProductData, UpdateProductData } from '@/types/sales';
import { productSchema, validateField } from '@/validation';
import { logger } from '@/utils/logger';
import styles from './ProductForm.module.scss';

// ======================================
// TIPADO CORRECTO PARA create y edit
// ======================================

interface ProductFormBaseProps {
  product?: Product;
  onCancel?: () => void;
  isLoading?: boolean;
}

export interface ProductFormCreateProps extends ProductFormBaseProps {
  mode: 'create';
  onSubmit: (data: CreateProductData) => Promise<void>;
}

export interface ProductFormEditProps extends ProductFormBaseProps {
  mode: 'edit';
  onSubmit: (data: UpdateProductData) => Promise<void>;
}

export type ProductFormProps = ProductFormCreateProps | ProductFormEditProps;

type TipoPago = 'unico' | 'periodico' | 'consumo';

const PERIODOS = [
  { value: 'semanal', label: 'Semanal' },
  { value: 'mensual', label: 'Mensual' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
];

// ======================================
// COMPONENTE
// ======================================

interface FormData {
  name: string;
  description: string;
  sku: string;
  price: string;
  tipo: TipoPago;
  periodo: string;
  precioBase: string;
  precioConsumo: string;
  unidadConsumo: string;
}

interface FormErrors {
  name?: string;
  price?: string;
  sku?: string;
}

const ProductForm: React.FC<ProductFormProps> = ({
  product,
  onSubmit,
  onCancel,
  isLoading = false,
  mode,
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: product?.name || '',
    description: product?.description || '',
    sku: product?.sku || '',
    price: product?.price?.toString() || '',
    tipo: (product?.tipo as TipoPago) || 'unico',
    periodo: product?.periodo || 'mensual',
    precioBase: product?.precioBase?.toString() || '',
    precioConsumo: product?.precioConsumo?.toString() || '',
    unidadConsumo: product?.unidadConsumo || '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        sku: product.sku || '',
        price: product.price?.toString() || '',
        tipo: (product.tipo as TipoPago) || 'unico',
        periodo: product.periodo || 'mensual',
        precioBase: product.precioBase?.toString() || '',
        precioConsumo: product.precioConsumo?.toString() || '',
        unidadConsumo: product.unidadConsumo || '',
      });
    }
  }, [product]);

  // Validación de campo individual usando Zod
  const validateFormField = (field: keyof FormData, value: string): string | undefined => {
    return validateField(productSchema, field, value);
  };

  // Validación completa del formulario usando Zod
  const validateForm = (): boolean => {
    const result = productSchema.safeParse(formData);

    if (result.success) {
      setErrors({});
      return true;
    }

    const newErrors: FormErrors = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] as keyof FormErrors;
      if (!newErrors[field]) {
        newErrors[field] = issue.message;
      }
    }

    setErrors(newErrors);
    return false;
  };

  const handleChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validateFormField(field, value) }));
    }
  };

  const handleBlur = (field: keyof FormData) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateFormField(field, formData[field]) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({ name: true, price: true, sku: true, description: true });

    if (!validateForm()) return;

    const priceNumber = Number(formData.price);

    const payload: CreateProductData = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      sku: formData.sku.trim() || undefined,
      price: priceNumber,
      tipo: formData.tipo,
      periodo: formData.tipo === 'periodico' ? (formData.periodo || null) : null,
      precioBase: formData.tipo === 'consumo' && formData.precioBase ? Number(formData.precioBase) : null,
      precioConsumo: formData.tipo === 'consumo' && formData.precioConsumo ? Number(formData.precioConsumo) : null,
      unidadConsumo: formData.tipo === 'consumo' ? (formData.unidadConsumo.trim() || null) : null,
    };

    try {
      if (mode === 'create') {
        await (onSubmit as (data: CreateProductData) => Promise<void>)(payload);
      } else {
        await (onSubmit as (data: UpdateProductData) => Promise<void>)(payload as UpdateProductData);
      }
    } catch (error) {
      logger.error('Error al enviar formulario de producto', error as Error);
    }
  };

  const priceLabel = formData.tipo === 'consumo' ? 'Precio base (€/mes)' : 'Precio (€)';
  const pricePlaceholder = formData.tipo === 'consumo' ? 'Ej: 15.00' : 'Ej: 1299.99';

  return (
    <Card variant="outlined" padding="lg" className={styles.formCard}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {mode === 'create' ? 'Crear Producto' : 'Editar Producto'}
          </h2>
        </div>

        <div className={styles.fields}>
          {/* Tipo de pago */}
          <div className={styles.textareaGroup}>
            <label className={styles.label}>Tipo de pago</label>
            <div className={styles.tipoSelector}>
              {(['unico', 'periodico', 'consumo'] as TipoPago[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`${styles.tipoBtn} ${formData.tipo === t ? styles.tipoBtnActive : ''}`}
                  onClick={() => setFormData((p) => ({ ...p, tipo: t }))}
                  disabled={isLoading}
                >
                  {t === 'unico' && 'Precio fijo'}
                  {t === 'periodico' && 'Periódico'}
                  {t === 'consumo' && 'Por consumo'}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Nombre del producto"
            type="text"
            value={formData.name}
            onChange={handleChange('name')}
            onBlur={handleBlur('name')}
            error={touched.name ? errors.name : undefined}
            required
            fullWidth
            placeholder="Ej: Tarifa Luz Premium"
            disabled={isLoading}
          />

          <div className={styles.row}>
            <Input
              label="SKU (Código)"
              type="text"
              value={formData.sku}
              onChange={handleChange('sku')}
              onBlur={handleBlur('sku')}
              error={touched.sku ? errors.sku : undefined}
              fullWidth
              placeholder="Ej: LUZ-PREM-001"
              disabled={isLoading}
            />

            <Input
              label={priceLabel}
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={handleChange('price')}
              onBlur={handleBlur('price')}
              error={touched.price ? errors.price : undefined}
              required
              fullWidth
              placeholder={pricePlaceholder}
              disabled={isLoading}
            />
          </div>

          {/* Periodicidad (solo para tipo 'periodico') */}
          {formData.tipo === 'periodico' && (
            <div className={styles.textareaGroup}>
              <label className={styles.label}>Periodicidad</label>
              <select
                className={styles.select}
                value={formData.periodo}
                onChange={handleChange('periodo')}
                disabled={isLoading}
              >
                {PERIODOS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Campos de consumo */}
          {formData.tipo === 'consumo' && (
            <div className={styles.row}>
              <Input
                label="Precio variable (€/unidad)"
                type="number"
                step="0.0001"
                min="0"
                value={formData.precioConsumo}
                onChange={handleChange('precioConsumo')}
                fullWidth
                placeholder="Ej: 0.1200"
                disabled={isLoading}
              />
              <Input
                label="Unidad de consumo"
                type="text"
                value={formData.unidadConsumo}
                onChange={handleChange('unidadConsumo')}
                fullWidth
                placeholder="Ej: kWh, m³, hora"
                disabled={isLoading}
              />
            </div>
          )}

          <div className={styles.textareaGroup}>
            <label htmlFor="description" className={styles.label}>
              Descripción <span className={styles.optional}>(Opcional)</span>
            </label>

            <textarea
              id="description"
              value={formData.description}
              onChange={handleChange('description')}
              onBlur={handleBlur('description')}
              placeholder="Descripción detallada del producto..."
              className={styles.textarea}
              rows={4}
              disabled={isLoading}
              maxLength={1000}
            />

            <span className={styles.charCount}>{formData.description.length}/1000</span>
          </div>
        </div>

        <div className={styles.actions}>
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isLoading}
              fullWidth
            >
              Cancelar
            </Button>
          )}

          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            loadingText={mode === 'create' ? 'Creando...' : 'Guardando...'}
            disabled={isLoading}
            fullWidth
          >
            {mode === 'create' ? 'Crear Producto' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default ProductForm;
