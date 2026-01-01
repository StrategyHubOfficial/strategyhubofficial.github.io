/**
 * Event Cleanup Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// EventCleanup class (matching event-cleanup.js)
class EventCleanup {
  constructor() {
    this.listeners = [];
    this.abortControllers = [];
  }

  add(element, event, handler, options = {}) {
    if (!element) return null;

    const controller = new AbortController();
    this.abortControllers.push(controller);

    const signal = options.signal || controller.signal;
    element.addEventListener(event, handler, { ...options, signal });

    this.listeners.push({ element, event, handler, controller });

    return controller;
  }

  remove(element, event, handler) {
    if (!element) return;

    element.removeEventListener(event, handler);
    this.listeners = this.listeners.filter(
      l => !(l.element === element && l.event === event && l.handler === handler)
    );
  }

  cleanup() {
    this.abortControllers.forEach(controller => {
      try {
        controller.abort();
      } catch (e) {
        // Ignore errors during cleanup
      }
    });

    this.listeners.forEach(({ element, event, handler }) => {
      try {
        element.removeEventListener(event, handler);
      } catch (e) {
        // Ignore errors during cleanup
      }
    });

    this.listeners = [];
    this.abortControllers = [];
  }
}

describe('EventCleanup', () => {
  let cleanup;
  let element;

  beforeEach(() => {
    cleanup = new EventCleanup();
    element = document.createElement('div');
    document.body.appendChild(element);
  });

  afterEach(() => {
    cleanup.cleanup();
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  });

  describe('add', () => {
    it('should add event listener and return controller', () => {
      const handler = vi.fn();
      const controller = cleanup.add(element, 'click', handler);

      expect(controller).toBeTruthy();
      expect(cleanup.listeners.length).toBe(1);
      expect(cleanup.abortControllers.length).toBe(1);
    });

    it('should not add listener if element is null', () => {
      const handler = vi.fn();
      const controller = cleanup.add(null, 'click', handler);

      expect(controller).toBeNull();
      expect(cleanup.listeners.length).toBe(0);
    });

    it('should track listener correctly', () => {
      const handler = vi.fn();
      cleanup.add(element, 'click', handler);

      const listener = cleanup.listeners[0];
      expect(listener.element).toBe(element);
      expect(listener.event).toBe('click');
      expect(listener.handler).toBe(handler);
    });

    it('should call handler when event fires', () => {
      const handler = vi.fn();
      cleanup.add(element, 'click', handler);

      element.click();

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove', () => {
    it('should remove specific listener', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      cleanup.add(element, 'click', handler1);
      cleanup.add(element, 'click', handler2);

      expect(cleanup.listeners.length).toBe(2);

      cleanup.remove(element, 'click', handler1);

      expect(cleanup.listeners.length).toBe(1);
      expect(cleanup.listeners[0].handler).toBe(handler2);
    });

    it('should not remove listener if element is null', () => {
      const handler = vi.fn();
      cleanup.add(element, 'click', handler);

      cleanup.remove(null, 'click', handler);

      expect(cleanup.listeners.length).toBe(1);
    });

    it('should stop calling removed handler', () => {
      const handler = vi.fn();
      cleanup.add(element, 'click', handler);

      cleanup.remove(element, 'click', handler);
      element.click();

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should remove all listeners', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      cleanup.add(element, 'click', handler1);
      cleanup.add(element, 'mouseenter', handler2);

      expect(cleanup.listeners.length).toBe(2);

      cleanup.cleanup();

      expect(cleanup.listeners.length).toBe(0);
      expect(cleanup.abortControllers.length).toBe(0);
    });

    it('should abort all controllers', () => {
      const handler = vi.fn();
      const controller = cleanup.add(element, 'click', handler);

      expect(controller.signal.aborted).toBe(false);

      cleanup.cleanup();

      expect(controller.signal.aborted).toBe(true);
    });

    it('should prevent handlers from firing after cleanup', () => {
      const handler = vi.fn();
      cleanup.add(element, 'click', handler);

      cleanup.cleanup();
      element.click();

      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle cleanup errors gracefully', () => {
      const handler = vi.fn();
      cleanup.add(element, 'click', handler);

      // Mock removeEventListener to throw
      const originalRemove = element.removeEventListener;
      element.removeEventListener = vi.fn(() => {
        throw new Error('Test error');
      });

      // Should not throw
      expect(() => cleanup.cleanup()).not.toThrow();

      element.removeEventListener = originalRemove;
    });
  });

  describe('multiple elements', () => {
    it('should track listeners for multiple elements', () => {
      const element2 = document.createElement('div');
      document.body.appendChild(element2);

      const handler1 = vi.fn();
      const handler2 = vi.fn();

      cleanup.add(element, 'click', handler1);
      cleanup.add(element2, 'click', handler2);

      expect(cleanup.listeners.length).toBe(2);

      cleanup.cleanup();

      expect(cleanup.listeners.length).toBe(0);

      if (element2.parentNode) {
        element2.parentNode.removeChild(element2);
      }
    });
  });
});
