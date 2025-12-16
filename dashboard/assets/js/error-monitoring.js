/**
 * Frontend error monitoring
 * Captures client-side errors and sends to Sentry
 */

// Initialize Sentry if DSN is configured
let sentryInitialized = false;

/**
 * Initialize error monitoring
 */
export function initErrorMonitoring(sentryDsn) {
  if (!sentryDsn || sentryInitialized) {
    return;
  }

  // Auto-initialize if DSN is in config
  if (typeof window !== 'undefined' && window.HUB_CONFIG?.sentryDsn) {
    initErrorMonitoring(window.HUB_CONFIG.sentryDsn);
  }

  try {
    // Dynamically import Sentry to avoid blocking if not needed
    import('https://browser.sentry-cdn.com/7.91.0/bundle.min.js').then(() => {
      if (window.Sentry) {
        window.Sentry.init({
          dsn: sentryDsn,
          environment: window.location.hostname.includes('localhost') ? 'development' : 'production',
          // Only capture errors, not all console logs
          beforeSend(event, hint) {
            // Filter out known non-critical errors
            if (event.exception) {
              const error = hint.originalException;
              // Ignore network errors that are expected (404s, etc.)
              if (error && error.message && error.message.includes('404')) {
                return null; // Don't send to Sentry
              }
            }
            return event;
          },
          // Capture unhandled errors
          captureUnhandledRejections: true,
          // Sample rate (1.0 = 100%, 0.1 = 10%)
          tracesSampleRate: 0.1, // Only capture 10% of performance traces
        });

        // Set user context if available
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
        console.log('[ERROR_MONITORING] Sentry initialized');
      }
    }).catch(err => {
      console.warn('[ERROR_MONITORING] Failed to load Sentry:', err);
    });
  } catch (error) {
    console.warn('[ERROR_MONITORING] Failed to initialize:', error);
  }
}

/**
 * Capture an error manually
 */
export function captureError(error, context = {}) {
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

/**
 * Capture a message
 */
export function captureMessage(message, level = 'info', context = {}) {
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

/**
 * Set user context
 */
export function setUser(user) {
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

/**
 * Clear user context (on logout)
 */
export function clearUser() {
  if (!sentryInitialized || !window.Sentry) {
    return;
  }

  try {
    window.Sentry.setUser(null);
  } catch (err) {
    console.error('[ERROR_MONITORING] Failed to clear user:', err);
  }
}

// Auto-initialize if DSN is in config
if (typeof window !== 'undefined' && window.HUB_CONFIG?.sentryDsn) {
  initErrorMonitoring(window.HUB_CONFIG.sentryDsn);
}

// Global error handler
window.addEventListener('error', (event) => {
  if (sentryInitialized && window.Sentry) {
    window.Sentry.captureException(event.error || event.message);
  }
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  if (sentryInitialized && window.Sentry) {
    window.Sentry.captureException(event.reason);
  }
});

