/**
 * Esquemas de validación Zod para formularios frontend
 * Centraliza toda la validación en un solo lugar
 */

import { z } from 'zod';

// ======================================
// ESQUEMAS REUTILIZABLES
// ======================================

/** Email opcional pero válido si se proporciona */
const optionalEmail = z.string()
  .email({ message: 'Email inválido' })
  .max(100, { message: 'El email no puede exceder 100 caracteres' })
  .optional()
  .or(z.literal(''));

/** Fecha opcional que no puede ser futura */
const optionalPastDate = z.string()
  .refine(
    (val) => {
      if (!val) return true;
      const date = new Date(val);
      return !isNaN(date.getTime()) && date <= new Date();
    },
    { message: 'La fecha no puede ser futura' }
  )
  .optional()
  .or(z.literal(''));

// ======================================
// PRODUCTO
// ======================================

const optionalPositiveNumber = z.string()
  .optional()
  .or(z.literal(''))
  .refine(
    (val) => !val || val === '' || (!isNaN(Number(val)) && Number(val) >= 0),
    { message: 'Debe ser un número no negativo' }
  );

export const productSchema = z.object({
  name: z.string()
    .min(1, { message: 'El nombre es requerido' })
    .max(200, { message: 'El nombre no puede exceder 200 caracteres' }),

  description: z.string()
    .max(1000, { message: 'La descripción no puede exceder 1000 caracteres' })
    .optional()
    .or(z.literal('')),

  sku: z.string()
    .max(100, { message: 'El SKU no puede exceder 100 caracteres' })
    .optional()
    .or(z.literal('')),

  price: z.string()
    .min(1, { message: 'El precio es requerido' })
    .refine(
      (val) => {
        const num = Number(val);
        return !isNaN(num) && num > 0;
      },
      { message: 'El precio debe ser un número mayor que 0' }
    ),

  tipo: z.enum(['unico', 'periodico', 'consumo']).default('unico'),
  periodo: z.string().optional().or(z.literal('')),
  precioBase: optionalPositiveNumber,
  precioConsumo: optionalPositiveNumber,
  unidadConsumo: z.string().optional().or(z.literal('')),
});

export type ProductFormData = z.infer<typeof productSchema>;

// ======================================
// CLIENTE
// ======================================

export const addressSchema = z.object({
  address: z.string().min(1, { message: 'La dirección es requerida' }),
  cupsLuz: z.string().optional().or(z.literal('')),
  cupsGas: z.string().optional().or(z.literal('')),
});

/** Schema de dirección para ventas: requiere al menos un CUPS */
export const saleAddressSchema = z.object({
  address: z.string().min(1, { message: 'La dirección es requerida' }),
  cupsLuz: z.string().optional().or(z.literal('')),
  cupsGas: z.string().optional().or(z.literal('')),
}).refine(
  (data) => (data.cupsLuz && data.cupsLuz.trim().length > 0) || (data.cupsGas && data.cupsGas.trim().length > 0),
  { message: 'Debe proporcionar al menos un CUPS (Luz o Gas)' }
);

export const clientSchema = z.object({
  firstName: z.string()
    .min(2, { message: 'El nombre debe tener al menos 2 caracteres' })
    .max(100, { message: 'El nombre no puede exceder 100 caracteres' }),

  lastName: z.string()
    .min(2, { message: 'Los apellidos deben tener al menos 2 caracteres' })
    .max(100, { message: 'Los apellidos no pueden exceder 100 caracteres' }),

  dni: z.string()
    .min(1, { message: 'El DNI es requerido' })
    .max(20, { message: 'El DNI no puede exceder 20 caracteres' }),

  email: optionalEmail,
  birthday: optionalPastDate,
  businessName: z.string().max(200).optional().or(z.literal('')),
  authorized: z.string().max(200).optional().or(z.literal('')),

  phones: z.array(z.string())
    .refine(
      (phones) => phones.some((p) => p.trim().length > 0),
      { message: 'Debe proporcionar al menos un teléfono' }
    ),

  addresses: z.array(addressSchema).optional(),
  bankAccounts: z.array(z.string()).optional(),
});

export type ClientFormData = z.infer<typeof clientSchema>;

// ======================================
// ESTADO DE VENTA
// ======================================

export const saleStatusSchema = z.object({
  name: z.string()
    .min(1, { message: 'El nombre es requerido' })
    .max(50, { message: 'El nombre no puede exceder 50 caracteres' }),

  order: z.number()
    .min(0, { message: 'El orden no puede ser negativo' }),

  color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, { message: 'Color hexadecimal inválido' })
    .default('#6c757d'),

  isFinal: z.boolean().default(false),
  isCancelled: z.boolean().default(false),
});

export type SaleStatusFormData = z.infer<typeof saleStatusSchema>;

// ======================================
// VENTA (SALE FORM)
// ======================================

export const saleItemSchema = z.object({
  productId: z.string().min(1, { message: 'ID de producto requerido' }),
  name: z.string().min(1, { message: 'Nombre del producto requerido' }),
  quantity: z.number().min(1, { message: 'La cantidad debe ser al menos 1' }),
  price: z.number().min(0, { message: 'El precio no puede ser negativo' }),
});

export const saleFormSchema = z.object({
  client: z.object({
    id: z.string().optional().or(z.literal('')),
    firstName: z.string().min(1, { message: 'El nombre es obligatorio' }),
    lastName: z.string().min(1, { message: 'Los apellidos son obligatorios' }),
    dni: z.string().min(1, { message: 'El DNI es obligatorio' }),
    email: z.string().min(1, { message: 'El email es obligatorio' }).email({ message: 'Email inválido' }),
    birthday: z.string().optional(),
    phones: z.array(z.string()).refine(
      (phones) => phones.some((p) => p.trim().length > 0),
      { message: 'El teléfono es obligatorio' }
    ),
    bankAccounts: z.array(z.string()).refine(
      (accounts) => accounts.some((a) => a.trim().length > 0),
      { message: 'La cuenta bancaria es obligatoria' }
    ),
    address: saleAddressSchema,
  }),
  items: z.array(saleItemSchema)
    .min(1, { message: 'Debe añadir al menos un producto' }),
  comercial: z.string().min(1, { message: 'El nombre del comercial es obligatorio' }),
});

export type SaleFormPayload = z.infer<typeof saleFormSchema>;

// ======================================
// UTILIDADES DE VALIDACIÓN
// ======================================

/**
 * Valida datos contra un esquema y retorna errores formateados
 * @param schema - Esquema Zod a usar
 * @param data - Datos a validar
 * @returns Objeto con errores por campo o null si es válido
 */
export function validateWithSchema<T extends z.ZodType>(
  schema: T,
  data: unknown
): Record<string, string> | null {
  const result = schema.safeParse(data);

  if (result.success) {
    return null;
  }

  const errors: Record<string, string> = {};

  // Zod v4 usa .issues en lugar de .errors
  for (const issue of result.error.issues) {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }

  return errors;
}

/**
 * Valida un campo individual
 * @param schema - Esquema Zod del formulario completo
 * @param field - Nombre del campo a validar
 * @param value - Valor del campo
 * @returns Mensaje de error o undefined si es válido
 */
export function validateField(
  schema: z.ZodObject<z.ZodRawShape>,
  field: string,
  value: unknown
): string | undefined {
  const fieldSchema = schema.shape[field];

  if (!fieldSchema) {
    return undefined;
  }

  const result = (fieldSchema as z.ZodType).safeParse(value);

  if (result.success) {
    return undefined;
  }

  // Zod v4 usa .issues en lugar de .errors
  return result.error.issues[0]?.message;
}
