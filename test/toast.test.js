/**
 * Toast Notification Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Toast Manager class (simplified for testing)
class ToastManager {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    if (!document.body) {
      setTimeout(() => this.init(), 10);
      return;
    }
    
    if (!document.getElementById('toast-container')) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    } else {
      this.container = document.getElementById('toast-container');
    }
  }

  show(message, type = 'info', duration = 5000) {
    if (!this.container || !document.body) {
      this.init();
      if (!this.container) {
        setTimeout(() => this.show(message, type, duration), 50);
        return null;
      }
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    this.container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, duration);

    return toast;
  }

  success(message, duration) {
    return this.show(message, 'success', duration);
  }

  error(message, duration) {
    return this.show(message, 'error', duration);
  }

  warning(message, duration) {
    return this.show(message, 'warning', duration);
  }

  info(message, duration) {
    return this.show(message, 'info', duration);
  }
}

describe('ToastManager', () => {
  let toast;
  let container;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = '';
    toast = new ToastManager();
    container = document.getElementById('toast-container');
    vi.useFakeTimers();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.useRealTimers();
  });

  describe('initialization', () => {
    it('should create toast container', () => {
      expect(container).toBeTruthy();
      expect(container.id).toBe('toast-container');
    });

    it('should reuse existing container', () => {
      const toast2 = new ToastManager();
      const container2 = document.getElementById('toast-container');
      expect(container2).toBe(container);
    });
  });

  describe('show', () => {
    it('should display toast message', () => {
      toast.show('Test message');
      const toasts = container.querySelectorAll('.toast');
      expect(toasts.length).toBe(1);
      expect(toasts[0].textContent).toBe('Test message');
    });

    it('should apply correct type class', () => {
      toast.show('Error message', 'error');
      const toastEl = container.querySelector('.toast');
      expect(toastEl.classList.contains('error')).toBe(true);
    });

    it('should default to info type', () => {
      toast.show('Info message');
      const toastEl = container.querySelector('.toast');
      expect(toastEl.classList.contains('info')).toBe(true);
    });

    it('should remove toast after duration', () => {
      toast.show('Test message', 'info', 1000);
      expect(container.querySelectorAll('.toast').length).toBe(1);

      vi.advanceTimersByTime(1000);
      expect(container.querySelectorAll('.toast').length).toBe(0);
    });
  });

  describe('helper methods', () => {
    it('should show success toast', () => {
      toast.success('Success!');
      const toastEl = container.querySelector('.toast');
      expect(toastEl.classList.contains('success')).toBe(true);
      expect(toastEl.textContent).toBe('Success!');
    });

    it('should show error toast', () => {
      toast.error('Error!');
      const toastEl = container.querySelector('.toast');
      expect(toastEl.classList.contains('error')).toBe(true);
      expect(toastEl.textContent).toBe('Error!');
    });

    it('should show warning toast', () => {
      toast.warning('Warning!');
      const toastEl = container.querySelector('.toast');
      expect(toastEl.classList.contains('warning')).toBe(true);
      expect(toastEl.textContent).toBe('Warning!');
    });

    it('should show info toast', () => {
      toast.info('Info!');
      const toastEl = container.querySelector('.toast');
      expect(toastEl.classList.contains('info')).toBe(true);
      expect(toastEl.textContent).toBe('Info!');
    });
  });

  describe('multiple toasts', () => {
    it('should display multiple toasts', () => {
      toast.info('First');
      toast.info('Second');
      toast.info('Third');

      const toasts = container.querySelectorAll('.toast');
      expect(toasts.length).toBe(3);
    });
  });
});
