/**
 * Keyboard Shortcuts System
 * Provides global keyboard shortcuts for navigation and actions
 */

class KeyboardShortcuts {
  constructor() {
    this.shortcuts = new Map();
    this.helpVisible = false;
    this.gKeyPressed = false;
    this.gKeyTimeout = null;
    this.keydownHandler = null;
    this.escapeHandler = null;
    this.init();
  }

  init() {
    // Wait for DOM
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    // Global shortcuts
    this.register('/', () => {
      this.focusSearch();
    }, 'Focus search');

    this.register('?', () => {
      this.toggleHelp();
    }, 'Show keyboard shortcuts');

    this.register('Escape', () => {
      this.handleEscape();
    }, 'Close modals/dialogs');

    // Navigation shortcuts (GitHub-style: g + key)
    this.register('g d', () => {
      window.location.href = '/dashboard/';
    }, 'Go to Dashboard');

    this.register('g e', () => {
      window.location.href = '/dashboard/events/';
    }, 'Go to Events');

    this.register('g p', () => {
      window.location.href = '/dashboard/projects/';
    }, 'Go to Projects');

    this.register('g s', () => {
      window.location.href = '/dashboard/studio/';
    }, 'Go to Studio');

    this.register('g m', () => {
      window.location.href = '/dashboard/members/';
    }, 'Go to Members');

    this.register('g r', () => {
      window.location.href = '/dashboard/resources/';
    }, 'Go to Resources');

    this.register('g a', () => {
      // Check both window.isAdmin and auth.getCurrentUser for admin status
      const isAdmin = window.isAdmin || (typeof auth !== 'undefined' && auth.getCurrentUser()?.role === 'admin');
      if (isAdmin) {
        window.location.href = '/dashboard/admin/users.html';
      }
    }, 'Go to Admin');

    // Add event listener (store reference for cleanup)
    this.keydownHandler = (e) => this.handleKeydown(e);
    document.addEventListener('keydown', this.keydownHandler);
  }

  register(keys, handler, description) {
    const normalized = this.normalizeKeys(keys);
    this.shortcuts.set(normalized, { handler, description, keys });
  }

  normalizeKeys(keys) {
    return keys.toLowerCase().replace(/\s+/g, ' ');
  }

  handleKeydown(e) {
    // Don't trigger shortcuts when typing in inputs, textareas, or contenteditable
    if (this.isTyping(e.target)) {
      return;
    }

    const key = e.key.toLowerCase();
    const ctrl = e.ctrlKey || e.metaKey;
    const shift = e.shiftKey;
    const alt = e.altKey;

    // Handle single key shortcuts
    if (!ctrl && !shift && !alt) {
      if (key === '/' || key === '?') {
        e.preventDefault();
        const shortcut = this.shortcuts.get(key);
        if (shortcut) {
          shortcut.handler();
        }
        return;
      }

      if (key === 'escape') {
        const shortcut = this.shortcuts.get('escape');
        if (shortcut) {
          shortcut.handler();
        }
        return;
      }
    }

    // Handle 'g' prefix shortcuts (GitHub-style)
    if (key === 'g' && !ctrl && !shift && !alt) {
      // Clear any existing timeout
      if (this.gKeyTimeout) {
        clearTimeout(this.gKeyTimeout);
      }
      this.gKeyPressed = true;
      this.gKeyTimeout = setTimeout(() => {
        this.gKeyPressed = false;
        this.gKeyTimeout = null;
      }, 1000);
      return;
    }

    // If 'g' was pressed, check for second key
    if (this.gKeyPressed && !ctrl && !shift && !alt) {
      const combo = `g ${key}`;
      const shortcut = this.shortcuts.get(combo);
      if (shortcut) {
        e.preventDefault();
        if (this.gKeyTimeout) {
          clearTimeout(this.gKeyTimeout);
          this.gKeyTimeout = null;
        }
        this.gKeyPressed = false;
        shortcut.handler();
      }
    }
  }

  isTyping(element) {
    if (!element) return false;
    const tagName = element.tagName.toLowerCase();
    const isInput = tagName === 'input' && element.type !== 'button' && element.type !== 'submit' && element.type !== 'reset';
    const isTextarea = tagName === 'textarea';
    const isContentEditable = element.contentEditable === 'true';
    return isInput || isTextarea || isContentEditable;
  }

  focusSearch() {
    try {
      // Try to find search input
      const searchInputs = document.querySelectorAll('input[type="search"], input[placeholder*="search" i]');
      if (searchInputs.length > 0 && searchInputs[0]) {
        searchInputs[0].focus();
        searchInputs[0].select();
      } else {
        // Show toast if no search available
        if (typeof toast !== 'undefined' && toast) {
          toast.info('No search available on this page');
        }
      }
    } catch (error) {
      console.error('Error focusing search:', error);
    }
  }

  toggleHelp() {
    if (this.helpVisible) {
      this.hideHelp();
    } else {
      this.showHelp();
    }
  }

  showHelp() {
    if (this.helpVisible) {
      return;
    }
    
    const shortcuts = Array.from(this.shortcuts.values());
    
    // Escape HTML to prevent XSS
    const escapeHtml = (text) => {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    };
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.2s ease;
    `;

    modal.innerHTML = `
      <div class="modal-content" style="
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 16px;
        padding: 2rem;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        animation: slideUp 0.3s ease;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <h2 style="margin: 0;">Keyboard Shortcuts</h2>
          <button onclick="if(window.keyboardShortcuts){window.keyboardShortcuts.hideHelp();}" style="
            background: none;
            border: none;
            color: var(--text-primary);
            font-size: 1.5rem;
            cursor: pointer;
            padding: 0;
            width: 32px;
            height: 32px;
          ">×</button>
        </div>
        <div style="display: grid; gap: 1rem;">
          ${shortcuts.map(s => {
            const safeDesc = escapeHtml(s.description || '');
            const safeKeys = escapeHtml(s.keys || '');
            return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--bg-darker); border-radius: 8px;">
              <span style="color: var(--text-secondary);">${safeDesc}</span>
              <kbd style="
                background: var(--bg-card);
                border: 1px solid var(--border-color);
                border-radius: 4px;
                padding: 0.25rem 0.5rem;
                font-family: monospace;
                font-size: 0.85rem;
                color: var(--text-primary);
              ">${safeKeys}</kbd>
            </div>
          `;
          }).join('')}
        </div>
        <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color); color: var(--text-secondary); font-size: 0.9rem;">
          Press <kbd style="padding: 0.2rem 0.4rem; background: var(--bg-darker); border-radius: 4px;">?</kbd> again or <kbd style="padding: 0.2rem 0.4rem; background: var(--bg-darker); border-radius: 4px;">Esc</kbd> to close
        </div>
      </div>
    `;

    if (document.body) {
      document.body.appendChild(modal);
      this.helpVisible = true;
    } else {
      console.error('Cannot show help: document.body is not available');
    }

    // Close on overlay click
    const overlayClickHandler = (e) => {
      if (e.target === modal) {
        this.hideHelp();
      }
    };
    modal.addEventListener('click', overlayClickHandler);
    modal._overlayClickHandler = overlayClickHandler; // Store for cleanup

    // Close on Escape (remove old handler if exists)
    if (this.escapeHandler) {
      document.removeEventListener('keydown', this.escapeHandler);
    }
    this.escapeHandler = (e) => {
      if (e.key === 'Escape' && this.helpVisible) {
        this.hideHelp();
      }
    };
    document.addEventListener('keydown', this.escapeHandler);
  }

  hideHelp() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
      // Remove overlay click handler
      if (modal._overlayClickHandler) {
        modal.removeEventListener('click', modal._overlayClickHandler);
        delete modal._overlayClickHandler;
      }
      modal.remove();
    }
    // Remove escape handler
    if (this.escapeHandler) {
      document.removeEventListener('keydown', this.escapeHandler);
      this.escapeHandler = null;
    }
    this.helpVisible = false;
  }

  handleEscape() {
    // Close any open modals
    const modals = document.querySelectorAll('.modal-overlay, .modal, [role="dialog"]');
    modals.forEach(modal => {
      const closeBtn = modal.querySelector('[aria-label="Close"], .close, button:last-child');
      if (closeBtn) {
        closeBtn.click();
      } else {
        modal.remove();
      }
    });

    // Close dropdowns
    const dropdowns = document.querySelectorAll('.dropdown-menu.show');
    dropdowns.forEach(dropdown => {
      const toggle = document.querySelector(`[data-bs-toggle="dropdown"][aria-expanded="true"]`);
      if (toggle) {
        toggle.click();
      }
    });
  }
}

// Initialize keyboard shortcuts (only once)
if (!window.keyboardShortcuts) {
  window.keyboardShortcuts = new KeyboardShortcuts();
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (window.keyboardShortcuts && window.keyboardShortcuts.keydownHandler) {
      document.removeEventListener('keydown', window.keyboardShortcuts.keydownHandler);
    }
    if (window.keyboardShortcuts && window.keyboardShortcuts.escapeHandler) {
      document.removeEventListener('keydown', window.keyboardShortcuts.escapeHandler);
    }
  });
}
