/**
 * Validadores para datos del CRM
 */

import type { Product, Sale, SaleItem, ClientSnapshot } from '@/types/sales';

// ============================================
// Validadores de Productos
// ============================================

/**
 * Validar datos de un producto
 * @param data - Datos del producto a validar
 * @returns Objeto con isValid y errores
 *
 * @example
 * const result = validateProduct({ name: '', price: -10, stock: 5 });
 * if (!result.isValid) {
 *   console.log(result.errors); // ["El nombre es requerido", "El precio debe ser mayor a 0"]
 * }
 */
export const validateProduct = (
  data: Partial<Product>
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Nombre requerido
  if (!data.name || data.name.trim().length === 0) {
    errors.push('El nombre del producto es requerido');
  } else if (data.name.length < 3) {
    errors.push('El nombre debe tener al menos 3 caracteres');
  } else if (data.name.length > 100) {
    errors.push('El nombre no puede exceder 100 caracteres');
  }

  // SKU opcional pero si existe debe ser válido
  if (data.sku && data.sku.trim().length === 0) {
    errors.push('El SKU no puede estar vacío');
  } else if (data.sku && data.sku.length > 50) {
    errors.push('El SKU no puede exceder 50 caracteres');
  }

  // Precio requerido y válido
  if (data.price === undefined || data.price === null) {
    errors.push('El precio es requerido');
  } else if (!isValidPrice(data.price)) {
    errors.push('El precio debe ser un número válido mayor o igual a 0');
  }

  // Active es opcional (no se requiere validación de stock ya que el sistema no lo usa)

  // Descripción opcional pero con límite
  if (data.description && data.description.length > 500) {
    errors.push('La descripción no puede exceder 500 caracteres');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// ============================================
// Validadores de Ventas
// ============================================

/**
 * Validar datos de una venta
 * @param data - Datos de la venta a validar
 * @returns Objeto con isValid y errores
 *
 * @example
 * const result = validateSale({ clientId: '', items: [] });
 * if (!result.isValid) {
 *   console.log(result.errors);
 * }
 */
export const validateSale = (
  data: Partial<Sale>
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Cliente requerido
  if (!data.clientId) {
    errors.push('El cliente es requerido');
  }

  // Al menos un item requerido
  if (!data.items || data.items.length === 0) {
    errors.push('La venta debe tener al menos un producto');
  } else {
    // Validar cada item
    data.items.forEach((item, index) => {
      const itemErrors = validateSaleItem(item);
      if (!itemErrors.isValid) {
        errors.push(`Item ${index + 1}: ${itemErrors.errors.join(', ')}`);
      }
    });
  }

  // Estado requerido
  if (!data.statusId) {
    errors.push('El estado de la venta es requerido');
  }

  // Notas opcionales pero con límite
  if (data.notes && data.notes.length > 1000) {
    errors.push('Las notas no pueden exceder 1000 caracteres');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validar un item de venta
 * @param item - Item a validar
 * @returns Objeto con isValid y errores
 */
export const validateSaleItem = (
  item: Partial<SaleItem>
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Producto requerido
  if (!item.productId) {
    errors.push('El producto es requerido');
  }

  // Cantidad requerida y válida
  if (item.quantity === undefined || item.quantity === null) {
    errors.push('La cantidad es requerida');
  } else if (!isValidQuantity(item.quantity)) {
    errors.push('La cantidad debe ser un número entero mayor a 0');
  }

  // Precio unitario requerido y válido
  if (item.unitPrice === undefined || item.unitPrice === null) {
    errors.push('El precio unitario es requerido');
  } else if (!isValidPrice(item.unitPrice)) {
    errors.push('El precio unitario debe ser un número válido mayor a 0');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// ============================================
// Validadores de Clientes
// ============================================

/**
 * Validar datos de un cliente (ClientSnapshot)
 * @param data - Datos del cliente a validar
 * @returns Objeto con isValid y errores
 */
export const validateClient = (
  data: Partial<ClientSnapshot>
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Nombre requerido
  if (!data.firstName || data.firstName.trim().length === 0) {
    errors.push('El nombre es requerido');
  } else if (data.firstName.length < 2) {
    errors.push('El nombre debe tener al menos 2 caracteres');
  } else if (data.firstName.length > 100) {
    errors.push('El nombre no puede exceder 100 caracteres');
  }

  // Apellido requerido
  if (!data.lastName || data.lastName.trim().length === 0) {
    errors.push('El apellido es requerido');
  }

  // DNI requerido y debe ser válido
  if (!data.dni || data.dni.trim().length === 0) {
    errors.push('El DNI es requerido');
  } else if (!isValidDNI(data.dni)) {
    errors.push('El DNI/NIE no es válido');
  }

  // Teléfonos opcionales pero si existen deben ser válidos
  if (data.phones && data.phones.length > 0) {
    data.phones.forEach((phone, index) => {
      if (phone && !isValidPhone(phone)) {
        errors.push(`El teléfono ${index + 1} no es válido`);
      }
    });
  }

  // Email opcional pero si existe debe ser válido
  if (data.email && data.email.length > 0) {
    if (!isValidEmail(data.email)) {
      errors.push('El email no es válido');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// ============================================
// Validadores Básicos
// ============================================

/**
 * Validar que un precio sea válido
 * @param price - Precio a validar
 * @returns true si el precio es válido
 */
export const isValidPrice = (price: number): boolean => {
  return (
    typeof price === 'number' &&
    !isNaN(price) &&
    isFinite(price) &&
    price >= 0
  );
};

/**
 * Validar que una cantidad sea válida
 * @param quantity - Cantidad a validar
 * @returns true si la cantidad es válida
 */
export const isValidQuantity = (quantity: number): boolean => {
  return (
    typeof quantity === 'number' &&
    !isNaN(quantity) &&
    isFinite(quantity) &&
    quantity > 0 &&
    Number.isInteger(quantity)
  );
};

/**
 * Validar formato de email
 * @param email - Email a validar
 * @returns true si el email es válido
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validar formato de teléfono español
 * @param phone - Teléfono a validar
 * @returns true si el teléfono es válido
 */
export const isValidPhone = (phone: string): boolean => {
  // Eliminar espacios y caracteres especiales
  const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');

  // Validar formato español (9 dígitos empezando por 6, 7, 8 o 9)
  // También acepta formato internacional +34
  const phoneRegex = /^(\+34)?[6-9]\d{8}$/;
  return phoneRegex.test(cleanPhone);
};

/**
 * Validar DNI/NIE español
 * @param dni - DNI/NIE a validar
 * @returns true si el DNI/NIE es válido
 */
export const isValidDNI = (dni: string): boolean => {
  const dniClean = dni.toUpperCase().replace(/[\s\-]/g, '');

  // Validar formato DNI (8 números + letra)
  const dniRegex = /^[0-9]{8}[A-Z]$/;
  if (dniRegex.test(dniClean)) {
    const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
    const number = parseInt(dniClean.substr(0, 8), 10);
    const letter = dniClean.charAt(8);
    return letters.charAt(number % 23) === letter;
  }

  // Validar formato NIE (X/Y/Z + 7 números + letra)
  const nieRegex = /^[XYZ][0-9]{7}[A-Z]$/;
  if (nieRegex.test(dniClean)) {
    const niePrefix: { [key: string]: string } = { X: '0', Y: '1', Z: '2' };
    const nieNumber = niePrefix[dniClean.charAt(0)] + dniClean.substr(1, 7);
    const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
    const number = parseInt(nieNumber, 10);
    const letter = dniClean.charAt(8);
    return letters.charAt(number % 23) === letter;
  }

  return false;
};

/**
 * Validar que un string no esté vacío
 * @param value - String a validar
 * @returns true si el string no está vacío
 */
export const isNotEmpty = (value: string): boolean => {
  return value.trim().length > 0;
};

/**
 * Validar longitud mínima de un string
 * @param value - String a validar
 * @param minLength - Longitud mínima requerida
 * @returns true si cumple la longitud mínima
 */
export const hasMinLength = (value: string, minLength: number): boolean => {
  return value.length >= minLength;
};

/**
 * Validar longitud máxima de un string
 * @param value - String a validar
 * @param maxLength - Longitud máxima permitida
 * @returns true si no excede la longitud máxima
 */
export const hasMaxLength = (value: string, maxLength: number): boolean => {
  return value.length <= maxLength;
};

/**
 * Validar que un número esté en un rango
 * @param value - Número a validar
 * @param min - Valor mínimo
 * @param max - Valor máximo
 * @returns true si el número está en el rango
 */
export const isInRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};
