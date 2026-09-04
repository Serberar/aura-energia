/**
 * Utilidades del CRM
 *
 * Este módulo exporta todas las utilidades relacionadas con el CRM:
 * - dateUtils: Funciones para manejo de fechas
 * - validators: Validadores de datos
 * - formatters: Funciones de formato
 */

// Utilidades de fechas
export {
  formatDate,
  isDateInRange,
  getDateRanges,
  getDaysDifference,
  isToday,
  isPastDate,
  isFutureDate,
  formatRelativeDate,
  toDateInputValue,
  addDays,
  getFirstDayOfMonth,
  getLastDayOfMonth,
} from './dateUtils';

export type { DateFormat } from './dateUtils';

// Validadores
export {
  validateProduct,
  validateSale,
  validateSaleItem,
  validateClient,
  isValidPrice,
  isValidQuantity,
  isValidEmail,
  isValidPhone,
  isValidDNI,
  isNotEmpty,
  hasMinLength,
  hasMaxLength,
  isInRange,
} from './validators';

// Formateadores
export {
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatPhone,
  formatDNI,
  formatName,
  truncateText,
  formatQuantity,
  formatFileSize,
  formatDuration,
  formatSKU,
  getInitials,
  formatAddress,
  capitalize,
  formatList,
} from './formatters';
