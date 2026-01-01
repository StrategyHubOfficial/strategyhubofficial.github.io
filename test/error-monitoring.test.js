/**
 * Error Monitoring Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Sentry
const mockSentry = {
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  setUser: vi.fn()
};

// Error monitoring functions (simplified for testing)
let sentryInitialized = false;

function initErrorMonitoring(sentryDsn) {
  if (!sentryDsn || sentryInitialized) {
    return;
  }

  if (typeof window !== 'undefined' && window.HUB_CONFIG?.sentryDsn) {
    initErrorMonitoring(window.HUB_CONFIG.sentryDsn);
  }

  if (window.Sentry) {
    window.Sentry.init({
      dsn: sentryDsn,
      environment: window.location.hostname.includes('localhost') ? 'development' : 'production',
      beforeSend(event, hint) {
        if (event.exception) {
          const error = hint.originalException;
          if (error && error.message && error.message.includes('404')) {
            return null;
          }
        }
        return event;
      },
      captureUnhandledRejections: true,
      tracesSampleRate: 0.1,
    });

    if (typeof auth !== 'undefined' && auth.getCurrentUser) {
      const user = auth.getCurrentUser();
      if (user) {
        window.Sentry.setUser({
          id: user.id,
          email: user.email,
        });
      }
    }

    sentryInitialized = true;
  }
}

function captureError(error, context = {}) {
  if (!sentryInitialized || !window.Sentry) {
    console.error('[ERROR]', error, context);
    return;
  }

  try {
    window.Sentry.captureException(error, {
      extra: context,
    });
  } catch (err) {
    console.error('[ERROR_MONITORING] Failed to capture error:', err);
  }
}

function captureMessage(message, level = 'info', context = {}) {
  if (!sentryInitialized || !window.Sentry) {
    console.log(`[${level.toUpperCase()}]`, message, context);
    return;
  }

  try {
    window.Sentry.captureMessage(message, {
      level: level,
      extra: context,
    });
  } catch (err) {
    console.error('[ERROR_MONITORING] Failed to capture message:', err);
  }
}

function setUser(user) {
  if (!sentryInitialized || !window.Sentry) {
    return;
  }

  try {
    window.Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.name,
    });
  } catch (err) {
    console.error('[ERROR_MONITORING] Failed to set user:', err);
  }
}

function clearUser() {
  if (!sentryInitialized || !window.Sentry) {
    return;
  }

  try {
    window.Sentry.setUser(null);
  } catch (err) {
    console.error('[ERROR_MONITORING] Failed to clear user:', err);
  }
}

describe('Error Monitoring', () => {
  beforeEach(() => {
    sentryInitialized = false;
    window.Sentry = mockSentry;
    window.location = { hostname: 'localhost' };
    window.HUB_CONFIG = {};
    
    // Reset mocks
    vi.clearAllMocks();
  });

  describe('initErrorMonitoring', () => {
    it('should initialize Sentry with DSN', () => {
      initErrorMonitoring('test-dsn');
      
      expect(mockSentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: 'test-dsn',
          environment: 'development',
        })
      );
      expect(sentryInitialized).toBe(true);
    });

    it('should not initialize without DSN', () => {
      initErrorMonitoring('');
      expect(mockSentry.init).not.toHaveBeenCalled();
    });

    it('should not initialize twice', () => {
      initErrorMonitoring('test-dsn');
      mockSentry.init.mockClear();
      initErrorMonitoring('test-dsn');
      expect(mockSentry.init).not.toHaveBeenCalled();
    });

    it('should use production environment for non-localhost', () => {
      window.location.hostname = 'strategyhubofficial.github.io';
      initErrorMonitoring('test-dsn');
      
      expect(mockSentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          environment: 'production',
        })
      );
    });

    it('should filter 404 errors', () => {
      initErrorMonitoring('test-dsn');
      
      const initCall = mockSentry.init.mock.calls[0][0];
      const beforeSend = initCall.beforeSend;
      
      const event = { exception: {} };
      const hint = { originalException: { message: '404 Not Found' } };
      
      const result = beforeSend(event, hint);
      expect(result).toBeNull();
    });

    it('should not filter non-404 errors', () => {
      initErrorMonitoring('test-dsn');
      
      const initCall = mockSentry.init.mock.calls[0][0];
      const beforeSend = initCall.beforeSend;
      
      const event = { exception: {} };
      const hint = { originalException: { message: '500 Internal Error' } };
      
      const result = beforeSend(event, hint);
      expect(result).toEqual(event);
    });
  });

  describe('captureError', () => {
    beforeEach(() => {
      initErrorMonitoring('test-dsn');
    });

    it('should capture error when initialized', () => {
      const error = new Error('Test error');
      captureError(error, { context: 'test' });
      
      expect(mockSentry.captureException).toHaveBeenCalledWith(error, {
        extra: { context: 'test' },
      });
    });

    it('should log to console when not initialized', () => {
      sentryInitialized = false;
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const error = new Error('Test error');
      captureError(error);
      
      expect(consoleSpy).toHaveBeenCalledWith('[ERROR]', error, {});
      expect(mockSentry.captureException).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('captureMessage', () => {
    beforeEach(() => {
      initErrorMonitoring('test-dsn');
    });

    it('should capture message when initialized', () => {
      captureMessage('Test message', 'info', { data: 'test' });
      
      expect(mockSentry.captureMessage).toHaveBeenCalledWith('Test message', {
        level: 'info',
        extra: { data: 'test' },
      });
    });

    it('should log to console when not initialized', () => {
      sentryInitialized = false;
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      captureMessage('Test message', 'info');
      
      expect(consoleSpy).toHaveBeenCalledWith('[INFO]', 'Test message', {});
      expect(mockSentry.captureMessage).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('setUser', () => {
    beforeEach(() => {
      initErrorMonitoring('test-dsn');
    });

    it('should set user context', () => {
      const user = { id: '1', email: 'test@example.com', name: 'Test User' };
      setUser(user);
      
      expect(mockSentry.setUser).toHaveBeenCalledWith({
        id: '1',
        email: 'test@example.com',
        username: 'Test User',
      });
    });

    it('should not set user when not initialized', () => {
      sentryInitialized = false;
      setUser({ id: '1' });
      expect(mockSentry.setUser).not.toHaveBeenCalled();
    });
  });

  describe('clearUser', () => {
    beforeEach(() => {
      initErrorMonitoring('test-dsn');
    });

    it('should clear user context', () => {
      clearUser();
      expect(mockSentry.setUser).toHaveBeenCalledWith(null);
    });

    it('should not clear user when not initialized', () => {
      sentryInitialized = false;
      clearUser();
      expect(mockSentry.setUser).not.toHaveBeenCalled();
    });
  });
});
