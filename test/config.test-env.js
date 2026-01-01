/**
 * Test Environment Configuration
 * 
 * Allows testing against different API endpoints:
 * - Remote production API
 * - Local development API (wrangler dev)
 * - Mock API (default for unit tests)
 */

// Get API URL from environment
export function getApiBaseUrl() {
  // Priority: Environment variable > Local dev > Production
  if (process.env.API_BASE_URL) {
    return process.env.API_BASE_URL;
  }
  
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:8787'; // wrangler dev default
  }
  
  return 'https://dashboard.securesovereigns.workers.dev';
}

// Check if we should use real API
export function shouldUseRealApi() {
  return process.env.RUN_INTEGRATION === 'true' || !!process.env.API_BASE_URL;
}

// Get test mode
export function getTestMode() {
  if (shouldUseRealApi()) {
    return 'integration';
  }
  return 'unit'; // Mocked tests
}
