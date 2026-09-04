/**
 * Exportación centralizada de validaciones
 */

export {
  // Esquemas
  productSchema,
  clientSchema,
  addressSchema,
  saleStatusSchema,
  saleItemSchema,
  saleFormSchema,

  // Tipos inferidos
  type ProductFormData,
  type ClientFormData,
  type SaleStatusFormData,
  type SaleFormPayload,

  // Utilidades
  validateWithSchema,
  validateField,
} from './schemas';
