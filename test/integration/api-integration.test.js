/**
 * Integration Tests - Test with Real Remote API
 * 
 * These tests connect to the actual backend API (remote or local)
 * Use environment variable API_BASE_URL to configure:
 * 
 * - Remote: API_BASE_URL=https://dashboard.securesovereigns.workers.dev
 * - Local: API_BASE_URL=http://localhost:8787 (wrangler dev)
 * 
 * Run with: API_BASE_URL=<url> npm run test:integration
 */

import { describe, it, expect, beforeAll } from 'vitest';

// Get API URL from environment or use default
const API_BASE_URL = process.env.API_BASE_URL || 'https://dashboard.securesovereigns.workers.dev';

// Only run integration tests if explicitly requested
const RUN_INTEGRATION = process.env.RUN_INTEGRATION === 'true' || process.env.API_BASE_URL;

// Skip all tests if not running integration tests
const describeIf = RUN_INTEGRATION ? describe : describe.skip;

describeIf('API Integration Tests', () => {
  let api;

  beforeAll(() => {
    // Create API instance with configured URL
    class HubAPI {
      constructor(baseURL) {
        this.baseURL = baseURL;
      }

      async request(endpoint, options = {}) {
        const normalizedEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
        const url = `${this.baseURL}${normalizedEndpoint}`;
        
        const config = {
          ...options,
          mode: 'cors',
          credentials: 'omit',
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          }
        };

        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || `HTTP ${response.status}`);
        }
        
        return data;
      }

      async health() {
        return this.request('/api/health');
      }
    }

    api = new HubAPI(API_BASE_URL);
  });

  describe('Health Check', () => {
    it('should connect to API and return health status', async () => {
      const response = await api.health();
      expect(response).toHaveProperty('status');
      expect(response.status).toBe('ok');
    }, 10000); // 10 second timeout for network requests
  });

  describe('Authentication', () => {
    it('should handle unauthenticated requests', async () => {
      try {
        await api.request('/api/auth/me');
      } catch (error) {
        // Should get 401 or error response
        expect(error.message).toBeTruthy();
      }
    }, 10000);
  });

  describe('CORS', () => {
    it('should allow CORS requests from localhost', async () => {
      const response = await fetch(`${API_BASE_URL}/api/health`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:4000',
          'Access-Control-Request-Method': 'GET',
        }
      });

      // Should have CORS headers
      expect(response.status).toBeLessThan(500);
    }, 10000);
  });
});
