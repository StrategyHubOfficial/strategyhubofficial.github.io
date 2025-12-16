/**
 * Enhanced Error Handling & Recovery
 * Provides user-friendly error states, retry buttons, and offline detection
 */

class ErrorHandler {
  constructor() {
    this.isOnline = navigator.onLine;
    this.networkStatusIndicator = null;
    this.retryCallbacks = new Map();
    
    this.init();
  }

  init() {
    // Create network status indicator
    this.createNetworkIndicator();
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.handleOnline();
    });
    
    window.addEventListener('offline', () => {
      this.handleOffline();
    });
    
    // Periodically check network status
    setInterval(() => {
      this.checkNetworkStatus();
    }, 5000);
  }

  createNetworkIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'network-status-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      display: none;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.9rem;
      transition: all 0.3s ease;
    `;
    document.body.appendChild(indicator);
    this.networkStatusIndicator = indicator;
  }

  handleOnline() {
    this.isOnline = true;
    this.showNetworkStatus('You\'re back online', 'success');
    
    // Retry any pending operations
    this.retryAllPending();
  }

  handleOffline() {
    this.isOnline = false;
    this.showNetworkStatus('You\'re offline. Some features may not work.', 'error');
  }

  showNetworkStatus(message, type = 'info') {
    if (!this.networkStatusIndicator) return;
    
    const colors = {
      success: { bg: '#00b894', text: '#ffffff' },
      error: { bg: '#d63031', text: '#ffffff' },
      info: { bg: '#60a5fa', text: '#ffffff' }
    };
    
    const color = colors[type] || colors.info;
    this.networkStatusIndicator.style.background = color.bg;
    this.networkStatusIndicator.style.color = color.text;
    this.networkStatusIndicator.textContent = message;
    this.networkStatusIndicator.style.display = 'flex';
    
    // Auto-hide after 5 seconds for success/info
    if (type !== 'error') {
      setTimeout(() => {
        this.networkStatusIndicator.style.display = 'none';
      }, 5000);
    }
  }

  checkNetworkStatus() {
    // Use fetch to check if we can reach the API
    // Only check if navigator.onLine is true to avoid unnecessary requests
    if (!navigator.onLine) {
      return;
    }
    
    fetch(this.getAPIBaseURL() + '/api/health', { 
      method: 'HEAD',
      cache: 'no-cache',
      signal: AbortSignal.timeout(3000)
    })
      .then(() => {
        if (!this.isOnline) {
          this.handleOnline();
        }
      })
      .catch(() => {
        if (this.isOnline && navigator.onLine) {
          // Network is up but API is down
          this.showNetworkStatus('Unable to reach server. Please try again later.', 'error');
        }
      });
  }

  getAPIBaseURL() {
    return window.HUB_CONFIG?.apiBaseUrl || 'https://dashboard.securesovereigns.workers.dev';
  }

  retryAllPending() {
    this.retryCallbacks.forEach((callback, id) => {
      try {
        callback();
      } catch (error) {
        console.error('Error retrying operation:', error);
      }
    });
  }

  /**
   * Create an error state component with retry button
   */
  createErrorState(message, error = null, retryCallback = null, options = {}) {
    const {
      title = 'Something went wrong',
      showRetry = true,
      showDetails = false,
      icon = '⚠️'
    } = options;
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-state';
    errorDiv.style.cssText = `
      text-align: center;
      padding: 3rem 2rem;
      background: var(--bg-card, #1a1a1a);
      border: 1px solid var(--border-color, rgba(247, 147, 26, 0.15));
      border-radius: 16px;
      margin: 2rem 0;
    `;
    
    const iconEl = document.createElement('div');
    iconEl.style.cssText = 'font-size: 3rem; margin-bottom: 1rem;';
    iconEl.textContent = icon;
    
    const titleEl = document.createElement('h3');
    titleEl.style.cssText = 'color: var(--text-primary, #ffffff); margin-bottom: 0.75rem; font-size: 1.5rem;';
    titleEl.textContent = title;
    
    const messageEl = document.createElement('p');
    messageEl.style.cssText = 'color: var(--text-secondary, #b0b0b0); margin-bottom: 1.5rem; line-height: 1.6;';
    messageEl.textContent = message;
    
    errorDiv.appendChild(iconEl);
    errorDiv.appendChild(titleEl);
    errorDiv.appendChild(messageEl);
    
    // Add error details if available and requested
    if (showDetails && error) {
      const detailsEl = document.createElement('details');
      detailsEl.style.cssText = 'text-align: left; margin: 1rem 0; color: var(--text-muted, #666); font-size: 0.85rem;';
      
      const summary = document.createElement('summary');
      summary.textContent = 'Technical details';
      summary.style.cssText = 'cursor: pointer; margin-bottom: 0.5rem;';
      
      const pre = document.createElement('pre');
      pre.style.cssText = 'background: var(--bg-darker, #000); padding: 1rem; border-radius: 8px; overflow-x: auto;';
      pre.textContent = error.message || error.toString();
      
      detailsEl.appendChild(summary);
      detailsEl.appendChild(pre);
      errorDiv.appendChild(detailsEl);
    }
    
    // Add retry button
    if (showRetry && retryCallback) {
      const retryBtn = document.createElement('button');
      retryBtn.className = 'btn';
      retryBtn.textContent = 'Try Again';
      retryBtn.style.cssText = 'margin-top: 1rem;';
      retryBtn.addEventListener('click', () => {
        errorDiv.style.opacity = '0.6';
        retryBtn.disabled = true;
        retryBtn.textContent = 'Retrying...';
        
        Promise.resolve(retryCallback())
          .then(() => {
            errorDiv.remove();
          })
          .catch((retryError) => {
            retryBtn.disabled = false;
            retryBtn.textContent = 'Try Again';
            errorDiv.style.opacity = '1';
            messageEl.textContent = `Retry failed: ${retryError.message || 'Unknown error'}`;
          });
      });
      errorDiv.appendChild(retryBtn);
    }
    
    return errorDiv;
  }

  /**
   * Show error state in a container
   */
  showErrorState(container, message, error = null, retryCallback = null, options = {}) {
    const containerEl = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;
    
    if (!containerEl) {
      console.error('Error container not found');
      return;
    }
    
    // Clear existing content
    containerEl.innerHTML = '';
    
    // Add error state
    const errorState = this.createErrorState(message, error, retryCallback, options);
    containerEl.appendChild(errorState);
  }

  /**
   * Wrap an async function with error handling and retry
   */
  withErrorHandling(fn, container = null, options = {}) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        console.error('Error in wrapped function:', error);
        
        // Show error state if container provided
        if (container) {
          const retryCallback = () => fn(...args);
          this.showErrorState(container, this.getErrorMessage(error), error, retryCallback, options);
        }
        
        // Show toast notification
        if (typeof toast !== 'undefined') {
          toast.error(this.getErrorMessage(error));
        }
        
        throw error;
      }
    };
  }

  /**
   * Get user-friendly error message
   */
  getErrorMessage(error) {
    if (!error) return 'An unknown error occurred';
    
    // Network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      if (!this.isOnline) {
        return 'You appear to be offline. Please check your internet connection.';
      }
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }
    
    if (error.name === 'BlockedRequestError') {
      return 'Request blocked by browser. This may be caused by an ad blocker or privacy extension.';
    }
    
    // HTTP errors
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      return 'Your session has expired. Please log in again.';
    }
    
    if (error.message.includes('403') || error.message.includes('Forbidden')) {
      return 'You don\'t have permission to perform this action.';
    }
    
    if (error.message.includes('404') || error.message.includes('Not Found')) {
      return 'The requested resource was not found.';
    }
    
    if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
      return 'The server encountered an error. Please try again later.';
    }
    
    if (error.message.includes('503') || error.message.includes('Service Unavailable')) {
      return 'The service is temporarily unavailable. Please try again in a few moments.';
    }
    
    // Rate limiting
    if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
      return 'Too many requests. Please wait a moment and try again.';
    }
    
    // Default: use error message or generic
    return error.message || 'An error occurred. Please try again.';
  }

  /**
   * Check if error is retryable
   */
  isRetryable(error) {
    if (!error) return false;
    
    // Network errors are retryable
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return true;
    }
    
    // 5xx errors are retryable
    if (error.message.includes('500') || 
        error.message.includes('502') || 
        error.message.includes('503') || 
        error.message.includes('504')) {
      return true;
    }
    
    // 429 (rate limit) is retryable after delay
    if (error.message.includes('429')) {
      return true;
    }
    
    return false;
  }
}

// Initialize global error handler
window.errorHandler = new ErrorHandler();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ErrorHandler;
}

