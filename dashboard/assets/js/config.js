/**
 * Frontend Configuration
 * This is the organization-specific branding
 */
(function () {
  var HUB_DEFAULT_API_BASE = 'https://dashboard.securesovereigns.workers.dev';
  var HUB_DEFAULT_FRONTEND = 'https://strategyhubofficial.github.io';

  window.HUB_CONFIG = {
    name: 'StrategyHub',
    apiBaseUrl: HUB_DEFAULT_API_BASE,
    /** Match Worker FRONTEND_URL; used for links that should not depend on the current tab origin */
    frontendUrl: HUB_DEFAULT_FRONTEND,
    address: '1850 Towers Cres Plaza, Tysons, VA 22182',
    coordinates: '38.91581192758401,-77.22079580284824',
    sentryDsn: '', // Optional: Sentry DSN for error monitoring (set via environment/config)
  };

  /** Worker API origin (no trailing slash) — same default as HubAPI */
  window.getHubApiBaseUrl = function () {
    return (window.HUB_CONFIG && window.HUB_CONFIG.apiBaseUrl) || HUB_DEFAULT_API_BASE;
  };

  /** Public site origin (GitHub Pages or custom domain) — no trailing slash */
  window.getHubFrontendBaseUrl = function () {
    var u = window.HUB_CONFIG && window.HUB_CONFIG.frontendUrl;
    if (u) return String(u).replace(/\/+$/, '');
    if (typeof window.location !== 'undefined' && window.location.origin) {
      return window.location.origin;
    }
    return HUB_DEFAULT_FRONTEND;
  };
})();
