/**
 * Better Error States & Recovery
 * Provides friendly error messages with recovery actions
 */

class ErrorStateManager {
  constructor() {
    this.retryCallbacks = new Map();
    this.init();
  }

  init() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.showNetworkStatus('online');
      this.retryFailedRequests();
    });

    window.addEventListener('offline', () => {
      this.showNetworkStatus('offline');
    });

    // Show initial network status
    if (!navigator.onLine) {
      this.showNetworkStatus('offline');
    }
  }

  /**
   * Show network status indicator
   */
  showNetworkStatus(status) {
    try {
      // Remove existing indicator
      const existing = document.getElementById('network-status');
      if (existing) {
        existing.remove();
      }

      if (status === 'offline') {
        const indicator = document.createElement('div');
        indicator.id = 'network-status';
        indicator.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: var(--error);
          color: white;
          padding: 0.75rem;
          text-align: center;
          z-index: 10001;
          animation: slideDown 0.3s ease;
        `;
        indicator.textContent = '⚠️ You\'re offline. Some features may not work.';
        if (document.body && document.body.firstChild) {
          document.body.insertBefore(indicator, document.body.firstChild);
        } else if (document.body) {
          document.body.appendChild(indicator);
        }
      } else if (status === 'online') {
        const indicator = document.createElement('div');
        indicator.id = 'network-status';
        indicator.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: var(--success);
          color: white;
          padding: 0.75rem;
          text-align: center;
          z-index: 10001;
          animation: slideDown 0.3s ease;
        `;
        indicator.textContent = '✓ You\'re back online!';
        if (document.body && document.body.firstChild) {
          document.body.insertBefore(indicator, document.body.firstChild);
        } else if (document.body) {
          document.body.appendChild(indicator);
        }
        
        // Remove after 3 seconds
        setTimeout(() => {
          if (indicator.parentNode) {
            indicator.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => {
              if (indicator.parentNode) {
                indicator.remove();
              }
            }, 300);
          }
        }, 3000);
      }
    } catch (error) {
      console.error('Error showing network status:', error);
    }
  }

  /**
   * Show error with retry option
   */
  showErrorWithRetry(message, retryCallback, context = {}) {
    const errorId = `error-${Date.now()}`;
    this.retryCallbacks.set(errorId, retryCallback);

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-state';
    errorDiv.id = errorId;
    errorDiv.style.cssText = `
      background: var(--bg-card);
      border: 1px solid var(--error);
      border-radius: 12px;
      padding: 2rem;
      text-align: center;
      margin: 2rem 0;
      animation: slideDown 0.3s ease;
    `;

    // Escape HTML to prevent XSS
    const escapeHtml = (text) => {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    };
    
    const escapedMessage = escapeHtml(message);
    const escapedDetails = context.details ? escapeHtml(context.details) : '';
    
    errorDiv.innerHTML = `
      <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
      <h3 style="color: var(--text-primary); margin-bottom: 0.5rem;">Something went wrong</h3>
      <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">${escapedMessage}</p>
      <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
        <button class="btn" onclick="if(window.errorStateManager){window.errorStateManager.retry('${errorId}');}" style="
          background: var(--bitcoin-orange);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        ">
          🔄 Try Again
        </button>
        <button class="btn-secondary" onclick="this.closest('.error-state').remove()" style="
          background: var(--bg-darker);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
        ">
          Dismiss
        </button>
      </div>
      ${escapedDetails ? `<p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 1rem;">${escapedDetails}</p>` : ''}
    `;

    return errorDiv;
  }

  /**
   * Retry a failed request
   */
  retry(errorId) {
    const callback = this.retryCallbacks.get(errorId);
    if (callback) {
      callback();
      this.retryCallbacks.delete(errorId);
    }
  }

  /**
   * Retry all failed requests
   */
  retryFailedRequests() {
    this.retryCallbacks.forEach((callback) => {
      callback();
    });
    this.retryCallbacks.clear();
  }

  /**
   * Wrap API call with retry logic
   */
  async withRetry(apiCall, errorMessage = 'Request failed') {
    try {
      return await apiCall();
    } catch (error) {
      // Show error with retry (escape error message to prevent XSS)
      const safeErrorMessage = error?.message ? String(error.message) : 'Unknown error';
      const errorDiv = this.showErrorWithRetry(
        errorMessage,
        () => this.withRetry(apiCall, errorMessage),
        { details: safeErrorMessage }
      );

      // Insert error into page
      try {
        const container = document.querySelector('.container, main, #content');
        if (container) {
          container.appendChild(errorDiv);
        } else {
          // Fallback: append to body
          if (document.body) {
            document.body.appendChild(errorDiv);
          }
        }
      } catch (error) {
        console.error('Error inserting error div:', error);
      }

      throw error;
    }
  }

  /**
   * Show friendly 404 page
   */
  show404() {
    try {
      const container = document.querySelector('.container, main');
      if (container) {
        container.innerHTML = `
          <div style="text-align: center; padding: 4rem 2rem;">
            <div style="font-size: 6rem; margin-bottom: 1rem;">404</div>
            <h1 style="color: var(--text-primary); margin-bottom: 0.5rem;">Page Not Found</h1>
            <p style="color: var(--text-secondary); margin-bottom: 2rem;">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <a href="/dashboard/" class="btn" style="
              display: inline-block;
              text-decoration: none;
              padding: 0.75rem 1.5rem;
              background: var(--bitcoin-orange);
              color: white;
              border-radius: 8px;
              font-weight: 600;
            ">
              Go to Dashboard
            </a>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error showing 404 page:', error);
    }
  }

  /**
   * Show friendly 500 page
   */
  show500() {
    const container = document.querySelector('.container, main');
    if (container) {
      container.innerHTML = `
        <div style="text-align: center; padding: 4rem 2rem;">
          <div style="font-size: 6rem; margin-bottom: 1rem;">500</div>
          <h1 style="color: var(--text-primary); margin-bottom: 0.5rem;">Server Error</h1>
          <p style="color: var(--text-secondary); margin-bottom: 2rem;">
            Something went wrong on our end. We're working on it!
          </p>
          <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
            <button class="btn" onclick="window.location.reload()" style="
              padding: 0.75rem 1.5rem;
              background: var(--bitcoin-orange);
              color: white;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-weight: 600;
            ">
              🔄 Refresh Page
            </button>
            <a href="/dashboard/" class="btn-secondary" style="
              display: inline-block;
              text-decoration: none;
              padding: 0.75rem 1.5rem;
              background: var(--bg-darker);
              color: var(--text-primary);
              border: 1px solid var(--border-color);
              border-radius: 8px;
            ">
              Go to Dashboard
            </a>
          </div>
        </div>
      `;
    }
  }
}

// Initialize error state manager (only once)
if (!window.errorStateManager) {
  window.errorStateManager = new ErrorStateManager();
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (window.errorStateManager) {
      if (window.errorStateManager.onlineHandler) {
        window.removeEventListener('online', window.errorStateManager.onlineHandler);
      }
      if (window.errorStateManager.offlineHandler) {
        window.removeEventListener('offline', window.errorStateManager.offlineHandler);
      }
    }
  });
}
