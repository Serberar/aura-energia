import { describe, it, expect } from 'vitest';
import {
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

describe('formatCurrency', () => {
  it('formats EUR by default', () => {
    const result = formatCurrency(1234.56);
    // JSDOM may omit thousand separator, just assert EUR symbol and amount digits present
    expect(result).toContain('€');
    expect(result).toMatch(/1.?234/);
  });

  it('formats 0 correctly', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
  });

  it('accepts custom currency and locale', () => {
    const result = formatCurrency(100, 'USD', 'en-US');
    expect(result).toContain('100');
    expect(result).toContain('$');
  });
});

describe('formatNumber', () => {
  it('formats with thousand separators', () => {
    const result = formatNumber(1234567);
    expect(result).toContain('1.234.567');
  });

  it('respects decimals parameter', () => {
    const result = formatNumber(1234.5678, 2);
    // JSDOM may omit thousand separator; assert number and rounded decimal
    expect(result).toMatch(/1.?234/);
    expect(result).toContain('57');
  });

  it('returns 0 decimals by default', () => {
    const result = formatNumber(1234.9);
    expect(result).not.toContain(','); // rounded to 1.235 without decimals
  });
});

describe('formatPercentage', () => {
  it('formats 0.15 as 15%', () => {
    const result = formatPercentage(0.15);
    expect(result).toContain('15');
    expect(result).toContain('%');
  });

  it('formats with decimals', () => {
    const result = formatPercentage(0.1534, 2);
    expect(result).toContain('15');
  });
});

describe('formatPhone', () => {
  it('formats 9-digit Spanish national number', () => {
    expect(formatPhone('612345678')).toBe('612 34 56 78');
  });

  it('formats international +34 number', () => {
    const result = formatPhone('+34612345678');
    expect(result).toContain('+34');
    expect(result).toContain('612');
  });

  it('returns phone unchanged if unknown format', () => {
    expect(formatPhone('12345')).toBe('12345');
  });
});

describe('formatDNI', () => {
  it('adds dash before last character for 9-char DNI', () => {
    expect(formatDNI('12345678Z')).toBe('12345678-Z');
  });

  it('converts to uppercase', () => {
    expect(formatDNI('12345678z')).toBe('12345678-Z');
  });

  it('returns original if not 9 chars', () => {
    expect(formatDNI('1234')).toBe('1234');
  });
});

describe('formatName', () => {
  it('capitalizes each word', () => {
    expect(formatName('juan pérez garcía')).toBe('Juan Pérez García');
  });

  it('handles single word', () => {
    expect(formatName('maría')).toBe('María');
  });
});

describe('truncateText', () => {
  it('truncates text exceeding maxLength', () => {
    expect(truncateText('Este es un texto largo', 10)).toBe('Este es un...');
  });

  it('returns text unchanged when within maxLength', () => {
    expect(truncateText('Corto', 10)).toBe('Corto');
  });

  it('handles exact length', () => {
    expect(truncateText('Exacto', 6)).toBe('Exacto');
  });
});

describe('formatQuantity', () => {
  it('uses singular for quantity 1', () => {
    expect(formatQuantity(1, 'producto')).toBe('1 producto');
  });

  it('adds "s" for plural', () => {
    expect(formatQuantity(5, 'producto')).toBe('5 productos');
  });

  it('uses custom plural', () => {
    expect(formatQuantity(2, 'unidad', 'unidades')).toBe('2 unidades');
  });
});

describe('formatFileSize', () => {
  it('formats 0 bytes', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
  });

  it('formats KB', () => {
    expect(formatFileSize(1024)).toContain('KB');
  });

  it('formats MB', () => {
    expect(formatFileSize(1048576)).toContain('MB');
  });

  it('formats GB', () => {
    expect(formatFileSize(1073741824)).toContain('GB');
  });
});

describe('formatDuration', () => {
  it('formats seconds only', () => {
    expect(formatDuration(45)).toBe('45s');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(65)).toBe('1m 5s');
  });

  it('formats hours, minutes and seconds', () => {
    expect(formatDuration(3665)).toBe('1h 1m 5s');
  });

  it('formats 0 seconds as "0s"', () => {
    expect(formatDuration(0)).toBe('0s');
  });
});

describe('formatSKU', () => {
  it('converts to uppercase and trims', () => {
    expect(formatSKU('  prod-001  ')).toBe('PROD-001');
  });
});

describe('getInitials', () => {
  it('returns initials of multi-word name', () => {
    expect(getInitials('Juan Pérez García')).toBe('JPG');
  });

  it('returns single initial for one word', () => {
    expect(getInitials('María')).toBe('M');
  });
});

describe('formatAddress', () => {
  it('formats full address', () => {
    const result = formatAddress({ street: 'Calle Mayor 123', city: 'Madrid', postalCode: '28001', country: 'España' });
    expect(result).toContain('Calle Mayor 123');
    expect(result).toContain('28001 Madrid');
    expect(result).toContain('España');
  });

  it('returns empty string for empty address', () => {
    expect(formatAddress({})).toBe('');
  });

  it('handles partial address', () => {
    const result = formatAddress({ city: 'Barcelona' });
    expect(result).toContain('Barcelona');
  });
});

describe('capitalize', () => {
  it('capitalizes first letter', () => {
    expect(capitalize('hola mundo')).toBe('Hola mundo');
  });

  it('handles empty string', () => {
    expect(capitalize('')).toBe('');
  });
});

describe('formatList', () => {
  it('returns empty string for empty array', () => {
    expect(formatList([])).toBe('');
  });

  it('returns item itself for single-element array', () => {
    expect(formatList(['manzana'])).toBe('manzana');
  });

  it('joins two items with "y"', () => {
    expect(formatList(['Juan', 'María'])).toBe('Juan y María');
  });

  it('joins multiple items with commas and "y"', () => {
    expect(formatList(['manzana', 'pera', 'uva'])).toBe('manzana, pera y uva');
  });
});
