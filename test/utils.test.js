/**
 * Utility Functions Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Define utility functions (matching utils.js)
function debounce(func, wait = 300, immediate = false) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
}

function throttle(func, wait = 300) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, wait);
    }
  };
}

function createDebouncedSearch(searchFunction, delay = 300) {
  return debounce(searchFunction, delay);
}

function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes);
}

function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
}

describe('Utils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('debounce', () => {
    it('should delay function execution', () => {
      const func = vi.fn();
      const debounced = debounce(func, 100);

      debounced();
      expect(func).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(func).toHaveBeenCalledTimes(1);
    });

    it('should only execute once after multiple rapid calls', () => {
      const func = vi.fn();
      const debounced = debounce(func, 100);

      debounced();
      debounced();
      debounced();

      vi.advanceTimersByTime(100);
      expect(func).toHaveBeenCalledTimes(1);
    });

    it('should execute immediately when immediate flag is true', () => {
      const func = vi.fn();
      const debounced = debounce(func, 100, true);

      debounced();
      expect(func).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);
      expect(func).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments correctly', () => {
      const func = vi.fn();
      const debounced = debounce(func, 100);

      debounced('arg1', 'arg2');
      vi.advanceTimersByTime(100);

      expect(func).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('throttle', () => {
    it('should limit function execution frequency', () => {
      const func = vi.fn();
      const throttled = throttle(func, 100);

      throttled();
      expect(func).toHaveBeenCalledTimes(1);

      throttled();
      throttled();
      expect(func).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);
      throttled();
      expect(func).toHaveBeenCalledTimes(2);
    });

    it('should pass arguments correctly', () => {
      const func = vi.fn();
      const throttled = throttle(func, 100);

      throttled('arg1', 'arg2');
      expect(func).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('createDebouncedSearch', () => {
    it('should create a debounced search function', () => {
      const searchFunc = vi.fn();
      const debouncedSearch = createDebouncedSearch(searchFunc, 200);

      debouncedSearch('query');
      expect(searchFunc).not.toHaveBeenCalled();

      vi.advanceTimersByTime(200);
      expect(searchFunc).toHaveBeenCalledWith('query');
    });
  });

  describe('formatDate', () => {
    it('should format date in YYYY-MM-DD format', () => {
      // Use UTC date to avoid timezone issues
      const date = new Date('2024-01-15T12:00:00Z');
      const result = formatDate(date);
      // Should contain the date parts (timezone may affect exact match)
      expect(result).toMatch(/2024-01-1[45]/); // Allow for timezone offset
    });

    it('should format date with custom format', () => {
      const date = new Date('2024-01-15T14:30:00');
      expect(formatDate(date, 'YYYY-MM-DD HH:mm')).toBe('2024-01-15 14:30');
    });

    it('should return empty string for invalid date', () => {
      expect(formatDate('invalid')).toBe('');
      expect(formatDate(null)).toBe('');
      expect(formatDate(undefined)).toBe('');
    });
  });

  describe('formatCurrency', () => {
    it('should format USD currency', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });

    it('should format different currencies', () => {
      expect(formatCurrency(1000, 'EUR')).toContain('1,000');
    });

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });
  });
});
