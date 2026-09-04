/**
 * Utilidades de formato para datos del CRM
 */

/**
 * Formatear precio a moneda
 * @param amount - Cantidad a formatear
 * @param currency - Código de moneda (default: 'EUR')
 * @param locale - Locale para el formato (default: 'es-ES')
 * @returns Precio formateado con símbolo de moneda
 *
 * @example
 * formatCurrency(1234.56) // "1.234,56 €"
 * formatCurrency(1234.56, 'USD', 'en-US') // "$1,234.56"
 */
export const formatCurrency = (
  amount: number,
  currency: string = 'EUR',
  locale: string = 'es-ES'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * Formatear número con separadores de miles
 * @param value - Número a formatear
 * @param decimals - Número de decimales (default: 0)
 * @param locale - Locale para el formato (default: 'es-ES')
 * @returns Número formateado
 *
 * @example
 * formatNumber(1234567) // "1.234.567"
 * formatNumber(1234.5678, 2) // "1.234,57"
 */
export const formatNumber = (
  value: number,
  decimals: number = 0,
  locale: string = 'es-ES'
): string => {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Formatear porcentaje
 * @param value - Valor decimal (0.15 = 15%)
 * @param decimals - Número de decimales (default: 0)
 * @param locale - Locale para el formato (default: 'es-ES')
 * @returns Porcentaje formateado
 *
 * @example
 * formatPercentage(0.1534) // "15%"
 * formatPercentage(0.1534, 2) // "15,34%"
 */
export const formatPercentage = (
  value: number,
  decimals: number = 0,
  locale: string = 'es-ES'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Formatear teléfono español
 * @param phone - Teléfono a formatear
 * @returns Teléfono formateado
 *
 * @example
 * formatPhone('612345678') // "612 34 56 78"
 * formatPhone('+34612345678') // "+34 612 34 56 78"
 */
export const formatPhone = (phone: string): string => {
  // Eliminar espacios y caracteres especiales
  const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');

  // Formatear según sea nacional o internacional
  if (cleanPhone.startsWith('+34')) {
    const number = cleanPhone.substring(3);
    return `+34 ${number.substring(0, 3)} ${number.substring(3, 5)} ${number.substring(5, 7)} ${number.substring(7)}`;
  } else if (cleanPhone.length === 9) {
    return `${cleanPhone.substring(0, 3)} ${cleanPhone.substring(3, 5)} ${cleanPhone.substring(5, 7)} ${cleanPhone.substring(7)}`;
  }

  return phone; // Retornar sin formato si no coincide
};

/**
 * Formatear DNI/NIE español
 * @param dni - DNI/NIE a formatear
 * @returns DNI/NIE formateado
 *
 * @example
 * formatDNI('12345678Z') // "12345678-Z"
 * formatDNI('X1234567L') // "X1234567-L"
 */
export const formatDNI = (dni: string): string => {
  const dniClean = dni.toUpperCase().replace(/[\s\-]/g, '');

  if (dniClean.length === 9) {
    return `${dniClean.substring(0, 8)}-${dniClean.substring(8)}`;
  }

  return dni;
};

/**
 * Formatear nombre completo (capitalizar primera letra de cada palabra)
 * @param name - Nombre a formatear
 * @returns Nombre formateado
 *
 * @example
 * formatName('juan pérez garcía') // "Juan Pérez García"
 */
export const formatName = (name: string): string => {
  return name
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Truncar texto con puntos suspensivos
 * @param text - Texto a truncar
 * @param maxLength - Longitud máxima
 * @returns Texto truncado
 *
 * @example
 * truncateText('Este es un texto muy largo', 15) // "Este es un text..."
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
};

/**
 * Formatear cantidad con unidad
 * @param quantity - Cantidad
 * @param unit - Unidad (singular)
 * @param pluralUnit - Unidad (plural) - opcional, se añade 's' por defecto
 * @returns Cantidad con unidad formateada
 *
 * @example
 * formatQuantity(1, 'producto') // "1 producto"
 * formatQuantity(5, 'producto') // "5 productos"
 * formatQuantity(2, 'unidad', 'unidades') // "2 unidades"
 */
export const formatQuantity = (
  quantity: number,
  unit: string,
  pluralUnit?: string
): string => {
  const unitText = quantity === 1 ? unit : pluralUnit || `${unit}s`;
  return `${quantity} ${unitText}`;
};

/**
 * Formatear tamaño de archivo
 * @param bytes - Tamaño en bytes
 * @param decimals - Número de decimales (default: 2)
 * @returns Tamaño formateado
 *
 * @example
 * formatFileSize(1024) // "1.00 KB"
 * formatFileSize(1234567) // "1.18 MB"
 * formatFileSize(1234567890) // "1.15 GB"
 */
export const formatFileSize = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
};

/**
 * Formatear duración en formato legible
 * @param seconds - Duración en segundos
 * @returns Duración formateada
 *
 * @example
 * formatDuration(65) // "1m 5s"
 * formatDuration(3665) // "1h 1m 5s"
 */
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
};

/**
 * Formatear código de producto/SKU
 * @param sku - SKU a formatear
 * @returns SKU formateado en mayúsculas
 *
 * @example
 * formatSKU('prod-001') // "PROD-001"
 */
export const formatSKU = (sku: string): string => {
  return sku.toUpperCase().trim();
};

/**
 * Formatear inicial de nombre
 * @param name - Nombre completo
 * @returns Iniciales
 *
 * @example
 * getInitials('Juan Pérez García') // "JPG"
 * getInitials('María') // "M"
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
};

/**
 * Formatear dirección en múltiples líneas
 * @param address - Objeto con datos de dirección
 * @returns Dirección formateada
 *
 * @example
 * formatAddress({
 *   street: 'Calle Mayor 123',
 *   city: 'Madrid',
 *   postalCode: '28001',
 *   country: 'España'
 * })
 * // "Calle Mayor 123\n28001 Madrid\nEspaña"
 */
export const formatAddress = (address: {
  street?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}): string => {
  const lines: string[] = [];

  if (address.street) lines.push(address.street);

  const cityLine: string[] = [];
  if (address.postalCode) cityLine.push(address.postalCode);
  if (address.city) cityLine.push(address.city);
  if (cityLine.length > 0) lines.push(cityLine.join(' '));

  if (address.country) lines.push(address.country);

  return lines.join('\n');
};

/**
 * Capitalizar primera letra de un texto
 * @param text - Texto a capitalizar
 * @returns Texto con primera letra mayúscula
 *
 * @example
 * capitalize('hola mundo') // "Hola mundo"
 */
export const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};

/**
 * Formatear lista de items con comas y "y"
 * @param items - Array de strings
 * @returns Lista formateada
 *
 * @example
 * formatList(['manzana', 'pera', 'uva']) // "manzana, pera y uva"
 * formatList(['Juan', 'María']) // "Juan y María"
 */
export const formatList = (items: string[]): string => {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} y ${items[1]}`;

  const lastItem = items[items.length - 1];
  const restItems = items.slice(0, -1).join(', ');
  return `${restItems} y ${lastItem}`;
};
