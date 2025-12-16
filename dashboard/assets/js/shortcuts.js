/**
 * Keyboard Shortcuts for StrategyHub Dashboard
 * Provides power-user navigation and quick actions
 */

class KeyboardShortcuts {
  constructor() {
    this.shortcuts = new Map();
    this.helpModal = null;
    this.isEnabled = true;
    this.sequenceBuffer = [];
    this.sequenceTimeout = null;
    
    this.init();
  }

  init() {
    // Only enable if not in an input/textarea/contenteditable
    document.addEventListener('keydown', (e) => {
      if (!this.isEnabled) return;
      
      const isInputFocused = this.isInputFocused(e.target);
      
      // Global shortcuts (work everywhere)
      if (e.key === '/' && !isInputFocused) {
        e.preventDefault();
        this.focusSearch();
        return;
      }
      
      if (e.key === '?' && !isInputFocused) {
        e.preventDefault();
        this.showHelp();
        return;
      }
      
      // Escape key (close modals, help)
      if (e.key === 'Escape') {
        this.handleEscape();
        return;
      }
      
      // Sequence shortcuts (g + key)
      if (e.key === 'g' && !isInputFocused && !e.ctrlKey && !e.metaKey && !e.altKey) {
        this.startSequence('g');
        return;
      }
      
      // Navigation shortcuts (only when sequence started)
      if (this.sequenceBuffer.length > 0) {
        this.handleSequence(e);
        return;
      }
      
      // Number shortcuts for quick actions (1-9)
      if (!isInputFocused && e.key >= '1' && e.key <= '9' && !e.ctrlKey && !e.metaKey) {
        this.handleNumberShortcut(e.key);
      }
    });
    
    // Register shortcuts
    this.registerShortcuts();
  }

  isInputFocused(element) {
    if (!element) return false;
    const tagName = element.tagName.toLowerCase();
    const isContentEditable = element.contentEditable === 'true';
    return tagName === 'input' || tagName === 'textarea' || isContentEditable;
  }

  startSequence(key) {
    this.sequenceBuffer.push(key);
    this.sequenceTimeout = setTimeout(() => {
      this.sequenceBuffer = [];
    }, 1000); // 1 second to complete sequence
  }

  handleSequence(e) {
    clearTimeout(this.sequenceTimeout);
    
    if (this.sequenceBuffer[0] === 'g') {
      const navigationMap = {
        'd': '/dashboard/',
        'p': '/dashboard/projects/',
        'e': '/dashboard/events/',
        'm': '/dashboard/members/',
        's': '/dashboard/studio/',
        'r': '/dashboard/resources/',
        'a': '/dashboard/admin/users.html',
        'h': '/dashboard/help/',
        'u': '/dashboard/profile/',
      };
      
      if (navigationMap[e.key]) {
        e.preventDefault();
        window.location.href = navigationMap[e.key];
        this.sequenceBuffer = [];
        return;
      }
    }
    
    // Reset if sequence doesn't match
    this.sequenceBuffer = [];
  }

  handleEscape() {
    // Close help modal if open
    if (this.helpModal && this.helpModal.style.display !== 'none') {
      this.hideHelp();
      return;
    }
    
    // Close any open modals (Bootstrap modals)
    const modals = document.querySelectorAll('.modal.show');
    modals.forEach(modal => {
      const bsModal = bootstrap?.Modal?.getInstance(modal);
      if (bsModal) {
        bsModal.hide();
      }
    });
    
    // Close custom modals
    const customModals = document.querySelectorAll('[class*="modal"], [id*="modal"]');
    customModals.forEach(modal => {
      if (modal.style.display === 'block' || modal.style.display === 'flex') {
        modal.style.display = 'none';
      }
    });
  }

  handleNumberShortcut(key) {
    // Quick action shortcuts (can be customized per page)
    const number = parseInt(key);
    
    // On dashboard: focus quick action cards
    if (window.location.pathname === '/dashboard/' || window.location.pathname === '/dashboard/index.html') {
      const cards = document.querySelectorAll('.card');
      if (cards[number - 1]) {
        const link = cards[number - 1].querySelector('a.btn');
        if (link) {
          link.click();
        }
      }
    }
  }

  focusSearch() {
    // Try to find search input on current page
    const searchInputs = [
      document.getElementById('search-input'),
      document.querySelector('input[type="search"]'),
      document.querySelector('input[placeholder*="search" i]'),
      document.querySelector('input[placeholder*="Search" i]'),
    ];
    
    for (const input of searchInputs) {
      if (input) {
        input.focus();
        input.select();
        return;
      }
    }
    
    // If no search found, show toast
    if (typeof toast !== 'undefined') {
      toast.info('No search available on this page');
    }
  }

  showHelp() {
    if (!this.helpModal) {
      this.createHelpModal();
    }
    
    this.helpModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  hideHelp() {
    if (this.helpModal) {
      this.helpModal.style.display = 'none';
      document.body.style.overflow = '';
    }
  }

  createHelpModal() {
    const modal = document.createElement('div');
    modal.className = 'shortcuts-help-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(4px);
      z-index: 10000;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
      background: var(--bg-card, #1a1a1a);
      border: 1px solid var(--border-color, rgba(247, 147, 26, 0.15));
      border-radius: 16px;
      padding: 2rem;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      position: relative;
    `;
    
    content.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <h2 style="margin: 0; color: var(--text-primary, #ffffff);">Keyboard Shortcuts</h2>
        <button class="shortcuts-close" style="background: none; border: none; color: var(--text-secondary, #b0b0b0); font-size: 1.5rem; cursor: pointer; padding: 0.25rem; line-height: 1;">&times;</button>
      </div>
      
      <div style="color: var(--text-primary, #ffffff);">
        <div style="margin-bottom: 1.5rem;">
          <h3 style="color: var(--bitcoin-orange, #f7931a); margin-bottom: 0.75rem; font-size: 1.1rem;">Global Shortcuts</h3>
          <div style="display: grid; grid-template-columns: auto 1fr; gap: 0.75rem 1.5rem; font-size: 0.95rem;">
            <kbd style="background: var(--bg-darker, #000); padding: 0.25rem 0.5rem; border-radius: 4px; border: 1px solid var(--border-color, rgba(247, 147, 26, 0.15)); font-family: monospace;">/</kbd>
            <span>Focus search</span>
            <kbd style="background: var(--bg-darker, #000); padding: 0.25rem 0.5rem; border-radius: 4px; border: 1px solid var(--border-color, rgba(247, 147, 26, 0.15)); font-family: monospace;">?</kbd>
            <span>Show this help</span>
            <kbd style="background: var(--bg-darker, #000); padding: 0.25rem 0.5rem; border-radius: 4px; border: 1px solid var(--border-color, rgba(247, 147, 26, 0.15)); font-family: monospace;">Esc</kbd>
            <span>Close modals</span>
          </div>
        </div>
        
        <div style="margin-bottom: 1.5rem;">
          <h3 style="color: var(--bitcoin-orange, #f7931a); margin-bottom: 0.75rem; font-size: 1.1rem;">Navigation (g + key)</h3>
          <div style="display: grid; grid-template-columns: auto 1fr; gap: 0.75rem 1.5rem; font-size: 0.95rem;">
            <kbd style="background: var(--bg-darker, #000); padding: 0.25rem 0.5rem; border-radius: 4px; border: 1px solid var(--border-color, rgba(247, 147, 26, 0.15)); font-family: monospace;">g</kbd><kbd style="background: var(--bg-darker, #000); padding: 0.25rem 0.5rem; border-radius: 4px; border: 1px solid var(--border-color, rgba(247, 147, 26, 0.15)); font-family: monospace;">d</kbd>
            <span>Dashboard</span>
            <kbd style="background: var(--bg-darker, #000); padding: 0.25rem 0.5rem; border-radius: 4px; border: 1px solid var(--border-color, rgba(247, 147, 26, 0.15)); font-family: monospace;">g</kbd><kbd style="background: var(--bg-darker, #000); padding: 0.25rem 0.5rem; border-radius: 4px; border: 1px solid var(--border-color, rgba(247, 147, 26, 0.15)); font-family: monospace;">p</kbd>
            <span>Projects</span>
            <kbd style="background: var(--bg-darker, #000); padding: 0.25rem 0.5rem; border-radius: 4px; border: 1px solid var(--border-color, rgba(247, 147, 26, 0.15)); font-family: monospace;">g</kbd><kbd style="background: var(--bg-darker, #000); padding: 0.25rem 0.5rem; border-radius: 4px; border: 1px solid var(--border-color, rgba(247, 147, 26, 0.15)); font-family: monospace;">e</kbd>
            <span>Events</span>
            <kbd style="background: var(--bg-darker, #000); padding: 0.25rem 0.5rem; border-radius: 4px; border: 1px solid var(--border-color, rgba(247, 147, 26, 0.15)); font-family: monospace;">g</kbd><kbd style="background: var(--bg-darker, #000); padding: 0.25rem 0.5rem; border-radius: 4px; border: 1px solid var(--border-color, rgba(247, 147, 26, 0.15)); font-family: monospace;">m</kbd>
            <span>Members</span>
            <kbd style="background: var(--bg-darker, #000); padding: 0.25rem 0.5rem; border-radius: 4px; border: 1px solid var(--border-color, rgba(247, 147, 26, 0.15)); font-family: monospace;">g</kbd><kbd style="background: var(--bg-darker, #000); padding: 0.25rem 0.5rem; border-radius: 4px; border: 1px solid var(--border-color, rgba(247, 147, 26, 0.15)); font-family: monospace;">s</kbd>
            <span>Studio</span>
            <kbd style="background: var(--bg-darker, #000); padding: 0.25rem 0.5rem; border-radius: 4px; border: 1px solid var(--border-color, rgba(247, 147, 26, 0.15)); font-family: monospace;">g</kbd><kbd style="background: var(--bg-darker, #000); padding: 0.25rem 0.5rem; border-radius: 4px; border: 1px solid var(--border-color, rgba(247, 147, 26, 0.15)); font-family: monospace;">r</kbd>
            <span>Resources</span>
            <kbd style="background: var(--bg-darker, #000); padding: 0.25rem 0.5rem; border-radius: 4px; border: 1px solid var(--border-color, rgba(247, 147, 26, 0.15)); font-family: monospace;">g</kbd><kbd style="background: var(--bg-darker, #000); padding: 0.25rem 0.5rem; border-radius: 4px; border: 1px solid var(--border-color, rgba(247, 147, 26, 0.15)); font-family: monospace;">u</kbd>
            <span>Profile</span>
            <kbd style="background: var(--bg-darker, #000); padding: 0.25rem 0.5rem; border-radius: 4px; border: 1px solid var(--border-color, rgba(247, 147, 26, 0.15)); font-family: monospace;">g</kbd><kbd style="background: var(--bg-darker, #000); padding: 0.25rem 0.5rem; border-radius: 4px; border: 1px solid var(--border-color, rgba(247, 147, 26, 0.15)); font-family: monospace;">a</kbd>
            <span>Admin</span>
            <kbd style="background: var(--bg-darker, #000); padding: 0.25rem 0.5rem; border-radius: 4px; border: 1px solid var(--border-color, rgba(247, 147, 26, 0.15)); font-family: monospace;">g</kbd><kbd style="background: var(--bg-darker, #000); padding: 0.25rem 0.5rem; border-radius: 4px; border: 1px solid var(--border-color, rgba(247, 147, 26, 0.15)); font-family: monospace;">h</kbd>
            <span>Help</span>
          </div>
        </div>
        
        <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color, rgba(247, 147, 26, 0.15)); font-size: 0.85rem; color: var(--text-secondary, #b0b0b0);">
          <p style="margin: 0;">Shortcuts are disabled when typing in input fields.</p>
        </div>
      </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Close button
    content.querySelector('.shortcuts-close').addEventListener('click', () => {
      this.hideHelp();
    });
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.hideHelp();
      }
    });
    
    this.helpModal = modal;
  }

  registerShortcuts() {
    // Can be extended with custom shortcuts per page
  }

  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }
}

// Initialize shortcuts when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.shortcuts = new KeyboardShortcuts();
  });
} else {
  window.shortcuts = new KeyboardShortcuts();
}

