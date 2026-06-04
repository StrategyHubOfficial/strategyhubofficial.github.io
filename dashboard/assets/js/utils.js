/**
 * Utility functions for the dashboard
 */

/**
 * Debounce function - delays execution until after wait time has passed
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {boolean} immediate - Execute immediately on first call
 * @returns {Function} Debounced function
 */
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

/**
 * Throttle function - limits execution to once per wait time
 * @param {Function} func - Function to throttle
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Throttled function
 */
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

/**
 * Create a debounced search handler
 * @param {Function} searchFunction - Function to call for search
 * @param {number} delay - Delay in milliseconds (default: 300ms)
 * @returns {Function} Debounced search handler
 */
function createDebouncedSearch(searchFunction, delay = 300) {
  return debounce(searchFunction, delay);
}

/**
 * Escape text for safe HTML insertion
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text === null || text === undefined ? '' : String(text);
  return div.innerHTML;
}

/**
 * Escape for HTML attribute values (e.g. onclick handlers)
 */
function escapeAttr(text) {
  return String(text === null || text === undefined ? '' : text)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;');
}

/**
 * Allow only http(s) URLs for user-provided links
 */
function safeHttpUrl(url) {
  try {
    const u = new URL(String(url));
    if (u.protocol === 'http:' || u.protocol === 'https:') {
      return u.href;
    }
  } catch (_) {
    /* invalid */
  }
  return '';
}

// Export to global scope
window.debounce = debounce;
window.throttle = throttle;
window.createDebouncedSearch = createDebouncedSearch;
window.escapeHtml = escapeHtml;
window.escapeAttr = escapeAttr;
window.safeHttpUrl = safeHttpUrl;

