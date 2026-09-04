import { describe, it, expect } from 'vitest';
import {
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

describe('dateUtils', () => {
  describe('formatDate', () => {
    const testDate = new Date('2025-12-04T14:30:00');

    it('should format date in short format', () => {
      const result = formatDate(testDate, 'short');
      expect(result).toBe('04/12/2025');
    });

    it('should format date in medium format', () => {
      const result = formatDate(testDate, 'medium');
      expect(result).toContain('dic');
      expect(result).toContain('2025');
    });

    it('should format date in datetime format', () => {
      const result = formatDate(testDate, 'datetime');
      expect(result).toContain('04/12/2025');
      expect(result).toContain('14:30');
    });

    it('should handle string dates', () => {
      const result = formatDate('2025-12-04', 'short');
      expect(result).toBe('04/12/2025');
    });

    it('should handle timestamp', () => {
      const timestamp = testDate.getTime();
      const result = formatDate(timestamp, 'short');
      expect(result).toBe('04/12/2025');
    });

    it('should return "Fecha inválida" for invalid dates', () => {
      const result = formatDate('invalid', 'short');
      expect(result).toBe('Fecha inválida');
    });
  });

  describe('isDateInRange', () => {
    it('should return true when date is in range', () => {
      const date = new Date('2025-06-15');
      const from = new Date('2025-01-01');
      const to = new Date('2025-12-31');
      expect(isDateInRange(date, from, to)).toBe(true);
    });

    it('should return false when date is before range', () => {
      const date = new Date('2024-12-31');
      const from = new Date('2025-01-01');
      const to = new Date('2025-12-31');
      expect(isDateInRange(date, from, to)).toBe(false);
    });

    it('should return false when date is after range', () => {
      const date = new Date('2026-01-01');
      const from = new Date('2025-01-01');
      const to = new Date('2025-12-31');
      expect(isDateInRange(date, from, to)).toBe(false);
    });

    it('should include boundary dates', () => {
      const from = new Date('2025-01-01');
      const to = new Date('2025-12-31');
      expect(isDateInRange(from, from, to)).toBe(true);
      expect(isDateInRange(to, from, to)).toBe(true);
    });
  });

  describe('getDateRanges', () => {
    it('should return ranges object with all keys', () => {
      const ranges = getDateRanges();
      expect(ranges).toHaveProperty('today');
      expect(ranges).toHaveProperty('yesterday');
      expect(ranges).toHaveProperty('thisWeek');
      expect(ranges).toHaveProperty('lastWeek');
      expect(ranges).toHaveProperty('thisMonth');
      expect(ranges).toHaveProperty('lastMonth');
      expect(ranges).toHaveProperty('thisYear');
      expect(ranges).toHaveProperty('lastYear');
      expect(ranges).toHaveProperty('last7Days');
      expect(ranges).toHaveProperty('last30Days');
      expect(ranges).toHaveProperty('last90Days');
    });

    it('should have valid from/to dates in each range', () => {
      const ranges = getDateRanges();
      Object.values(ranges).forEach((range) => {
        expect(range).toHaveProperty('from');
        expect(range).toHaveProperty('to');
        expect(range.from).toBeInstanceOf(Date);
        expect(range.to).toBeInstanceOf(Date);
        expect(range.from.getTime()).toBeLessThanOrEqual(range.to.getTime());
      });
    });
  });

  describe('getDaysDifference', () => {
    it('should calculate difference in days', () => {
      const date1 = new Date('2025-01-01');
      const date2 = new Date('2025-01-10');
      expect(getDaysDifference(date1, date2)).toBe(9);
    });

    it('should return absolute difference', () => {
      const date1 = new Date('2025-01-10');
      const date2 = new Date('2025-01-01');
      expect(getDaysDifference(date1, date2)).toBe(9);
    });

    it('should return 0 for same date', () => {
      const date = new Date('2025-01-01');
      expect(getDaysDifference(date, date)).toBe(0);
    });
  });

  describe('isToday', () => {
    it('should return true for current date', () => {
      const today = new Date();
      expect(isToday(today)).toBe(true);
    });

    it('should return false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday)).toBe(false);
    });

    it('should return false for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isToday(tomorrow)).toBe(false);
    });
  });

  describe('isPastDate', () => {
    it('should return true for past dates', () => {
      const pastDate = new Date('2024-01-01');
      expect(isPastDate(pastDate)).toBe(true);
    });

    it('should return false for future dates', () => {
      const futureDate = new Date('2030-01-01');
      expect(isPastDate(futureDate)).toBe(false);
    });
  });

  describe('isFutureDate', () => {
    it('should return true for future dates', () => {
      const futureDate = new Date('2030-01-01');
      expect(isFutureDate(futureDate)).toBe(true);
    });

    it('should return false for past dates', () => {
      const pastDate = new Date('2024-01-01');
      expect(isFutureDate(pastDate)).toBe(false);
    });
  });

  describe('toDateInputValue', () => {
    it('should format date for HTML input', () => {
      const date = new Date('2025-12-04');
      expect(toDateInputValue(date)).toBe('2025-12-04');
    });

    it('should pad single digits', () => {
      const date = new Date('2025-01-05');
      expect(toDateInputValue(date)).toBe('2025-01-05');
    });
  });

  describe('addDays', () => {
    it('should add days to date', () => {
      const date = new Date('2025-01-01');
      const result = addDays(date, 5);
      expect(result.getDate()).toBe(6);
      expect(result.getMonth()).toBe(0);
    });

    it('should subtract days with negative number', () => {
      const date = new Date('2025-01-10');
      const result = addDays(date, -5);
      expect(result.getDate()).toBe(5);
    });

    it('should handle month transitions', () => {
      const date = new Date('2025-01-30');
      const result = addDays(date, 5);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(4);
    });
  });

  describe('getFirstDayOfMonth', () => {
    it('should return first day of month', () => {
      const date = new Date('2025-12-15');
      const result = getFirstDayOfMonth(date);
      expect(result.getDate()).toBe(1);
      expect(result.getMonth()).toBe(11); // December
      expect(result.getFullYear()).toBe(2025);
    });
  });

  describe('getLastDayOfMonth', () => {
    it('should return last day of month', () => {
      const date = new Date('2025-12-15');
      const result = getLastDayOfMonth(date);
      expect(result.getDate()).toBe(31);
      expect(result.getMonth()).toBe(11); // December
    });

    it('should handle February correctly', () => {
      const date = new Date('2025-02-15');
      const result = getLastDayOfMonth(date);
      expect(result.getDate()).toBe(28); // 2025 is not a leap year
    });

    it('should handle leap years', () => {
      const date = new Date('2024-02-15');
      const result = getLastDayOfMonth(date);
      expect(result.getDate()).toBe(29); // 2024 is a leap year
    });
  });

  describe('formatRelativeDate', () => {
    it('should format seconds ago', () => {
      const date = new Date(Date.now() - 30 * 1000);
      const result = formatRelativeDate(date);
      expect(result).toBe('hace unos segundos');
    });

    it('should format minutes ago', () => {
      const date = new Date(Date.now() - 5 * 60 * 1000);
      const result = formatRelativeDate(date);
      expect(result).toBe('hace 5 minutos');
    });

    it('should format hours ago', () => {
      const date = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const result = formatRelativeDate(date);
      expect(result).toBe('hace 2 horas');
    });

    it('should format days ago', () => {
      const date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const result = formatRelativeDate(date);
      expect(result).toBe('hace 3 días');
    });
  });
});
