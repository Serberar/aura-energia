/**
 * Utilidades para manejo y formato de fechas en el CRM
 */

/**
 * Formatos de fecha disponibles
 */
export type DateFormat = 'short' | 'medium' | 'long' | 'full' | 'time' | 'datetime';

/**
 * Formatear fecha según el tipo especificado
 * @param date - Fecha a formatear (Date, string o timestamp)
 * @param format - Formato deseado
 * @param locale - Locale para el formato (default: 'es-ES')
 * @returns Fecha formateada como string
 *
 * @example
 * formatDate(new Date(), 'short') // "04/12/2025"
 * formatDate(new Date(), 'medium') // "4 dic 2025"
 * formatDate(new Date(), 'long') // "4 de diciembre de 2025"
 * formatDate(new Date(), 'datetime') // "04/12/2025 14:30"
 */
export const formatDate = (
  date: Date | string | number,
  format: DateFormat = 'short',
  locale: string = 'es-ES'
): string => {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return 'Fecha inválida';
  }

  const formatOptions: Record<DateFormat, Intl.DateTimeFormatOptions> = {
    short: { day: '2-digit', month: '2-digit', year: 'numeric' },
    medium: { day: 'numeric', month: 'short', year: 'numeric' },
    long: { day: 'numeric', month: 'long', year: 'numeric' },
    full: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit' },
    datetime: {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    },
  };

  return new Intl.DateTimeFormat(locale, formatOptions[format]).format(dateObj);
};

/**
 * Verificar si una fecha está dentro de un rango
 * @param date - Fecha a verificar
 * @param from - Fecha inicial del rango
 * @param to - Fecha final del rango
 * @returns true si la fecha está en el rango
 *
 * @example
 * const today = new Date();
 * const from = new Date('2025-01-01');
 * const to = new Date('2025-12-31');
 * isDateInRange(today, from, to) // true
 */
export const isDateInRange = (
  date: Date | string | number,
  from: Date | string | number,
  to: Date | string | number
): boolean => {
  const dateObj = new Date(date);
  const fromObj = new Date(from);
  const toObj = new Date(to);

  return dateObj >= fromObj && dateObj <= toObj;
};

/**
 * Obtener rangos de fecha predefinidos comunes
 * @returns Objeto con rangos de fecha comunes
 *
 * @example
 * const ranges = getDateRanges();
 * console.log(ranges.today); // { from: Date, to: Date }
 * console.log(ranges.thisMonth); // { from: Date, to: Date }
 */
export const getDateRanges = () => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return {
    today: {
      from: today,
      to: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
    },
    yesterday: {
      from: new Date(today.getTime() - 24 * 60 * 60 * 1000),
      to: new Date(today.getTime() - 1),
    },
    thisWeek: {
      from: new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000),
      to: new Date(today.getTime() + (6 - today.getDay()) * 24 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000 - 1),
    },
    lastWeek: {
      from: new Date(today.getTime() - (today.getDay() + 7) * 24 * 60 * 60 * 1000),
      to: new Date(today.getTime() - (today.getDay() + 1) * 24 * 60 * 60 * 1000),
    },
    thisMonth: {
      from: new Date(now.getFullYear(), now.getMonth(), 1),
      to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
    },
    lastMonth: {
      from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      to: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999),
    },
    thisYear: {
      from: new Date(now.getFullYear(), 0, 1),
      to: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999),
    },
    lastYear: {
      from: new Date(now.getFullYear() - 1, 0, 1),
      to: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999),
    },
    last7Days: {
      from: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
      to: today,
    },
    last30Days: {
      from: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
      to: today,
    },
    last90Days: {
      from: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000),
      to: today,
    },
  };
};

/**
 * Calcular la diferencia en días entre dos fechas
 * @param date1 - Primera fecha
 * @param date2 - Segunda fecha
 * @returns Diferencia en días (absoluta)
 *
 * @example
 * const date1 = new Date('2025-01-01');
 * const date2 = new Date('2025-01-10');
 * getDaysDifference(date1, date2) // 9
 */
export const getDaysDifference = (
  date1: Date | string | number,
  date2: Date | string | number
): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Verificar si una fecha es hoy
 * @param date - Fecha a verificar
 * @returns true si la fecha es hoy
 */
export const isToday = (date: Date | string | number): boolean => {
  const dateObj = new Date(date);
  const today = new Date();
  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
};

/**
 * Verificar si una fecha es del pasado
 * @param date - Fecha a verificar
 * @returns true si la fecha es anterior a hoy
 */
export const isPastDate = (date: Date | string | number): boolean => {
  const dateObj = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dateObj < today;
};

/**
 * Verificar si una fecha es del futuro
 * @param date - Fecha a verificar
 * @returns true si la fecha es posterior a hoy
 */
export const isFutureDate = (date: Date | string | number): boolean => {
  const dateObj = new Date(date);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return dateObj > today;
};

/**
 * Formatear fecha relativa (hace X días, hace X horas, etc.)
 * @param date - Fecha a formatear
 * @param locale - Locale para el formato (default: 'es-ES')
 * @returns Fecha formateada de forma relativa
 *
 * @example
 * formatRelativeDate(new Date(Date.now() - 1000 * 60 * 5)) // "hace 5 minutos"
 * formatRelativeDate(new Date(Date.now() - 1000 * 60 * 60 * 2)) // "hace 2 horas"
 * formatRelativeDate(new Date(Date.now() - 1000 * 60 * 60 * 24 * 3)) // "hace 3 días"
 */
export const formatRelativeDate = (
  date: Date | string | number,
  _locale: string = 'es-ES'
): string => {
  const dateObj = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return 'hace unos segundos';
  } else if (diffMins < 60) {
    return `hace ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`;
  } else if (diffHours < 24) {
    return `hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
  } else if (diffDays < 7) {
    return `hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `hace ${years} ${years === 1 ? 'año' : 'años'}`;
  }
};

/**
 * Convertir fecha a formato ISO string para inputs de tipo date
 * @param date - Fecha a convertir
 * @returns String en formato YYYY-MM-DD
 *
 * @example
 * toDateInputValue(new Date('2025-12-04')) // "2025-12-04"
 */
export const toDateInputValue = (date: Date | string | number): string => {
  const dateObj = new Date(date);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Agregar días a una fecha
 * @param date - Fecha base
 * @param days - Número de días a agregar (puede ser negativo)
 * @returns Nueva fecha con los días agregados
 *
 * @example
 * addDays(new Date('2025-01-01'), 5) // 2025-01-06
 * addDays(new Date('2025-01-10'), -5) // 2025-01-05
 */
export const addDays = (date: Date | string | number, days: number): Date => {
  const dateObj = new Date(date);
  dateObj.setDate(dateObj.getDate() + days);
  return dateObj;
};

/**
 * Obtener el primer día del mes
 * @param date - Fecha de referencia
 * @returns Fecha del primer día del mes
 */
export const getFirstDayOfMonth = (date: Date | string | number): Date => {
  const dateObj = new Date(date);
  return new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
};

/**
 * Obtener el último día del mes
 * @param date - Fecha de referencia
 * @returns Fecha del último día del mes
 */
export const getLastDayOfMonth = (date: Date | string | number): Date => {
  const dateObj = new Date(date);
  return new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0, 23, 59, 59, 999);
};
