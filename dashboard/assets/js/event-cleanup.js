/**
 * Event Listener Cleanup Utility
 * Prevents memory leaks by tracking and cleaning up event listeners
 */

class EventCleanup {
  constructor() {
    this.listeners = [];
    this.abortControllers = [];
  }

  /**
   * Add a tracked event listener
   */
  add(element, event, handler, options = {}) {
    if (!element) {
      return null;
    }

    // Use AbortController for automatic cleanup
    // eslint-disable-next-line no-undef
    const controller = new AbortController();
    this.abortControllers.push(controller);

    const signal = options.signal || controller.signal;
    element.addEventListener(event, handler, { ...options, signal });

    // Track for manual cleanup if needed
    this.listeners.push({ element, event, handler, controller });

    return controller;
  }

  /**
   * Remove a specific listener
   */
  remove(element, event, handler) {
    if (!element) return;

    element.removeEventListener(event, handler);
    this.listeners = this.listeners.filter(
      l => !(l.element === element && l.event === event && l.handler === handler)
    );
  }

  /**
   * Clean up all listeners
   */
  cleanup() {
    // Abort all controllers (removes listeners automatically)
    this.abortControllers.forEach((controller) => {
      try {
        controller.abort();
      } catch {
        // Ignore errors during cleanup
      }
    });

    // Manual cleanup as fallback
    this.listeners.forEach(({ element, event, handler }) => {
      try {
        element.removeEventListener(event, handler);
      } catch {
        // Ignore errors during cleanup
      }
    });

    this.listeners = [];
    this.abortControllers = [];
  }
}

// Global cleanup manager
window.eventCleanup = new EventCleanup();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (window.eventCleanup) {
    window.eventCleanup.cleanup();
  }
});

// Cleanup on visibility change (page hidden)
document.addEventListener('visibilitychange', () => {
  if (document.hidden && window.eventCleanup) {
    // Don't fully cleanup, but prepare for it
    // Full cleanup happens on beforeunload
  }
});

// Export for use
window.EventCleanup = EventCleanup;



