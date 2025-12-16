/**
 * Test setup for Vitest
 * Configures DOM environment and global mocks
 */

import { expect, afterEach } from 'vitest';

// Cleanup after each test (simplified - no DOM library needed for basic tests)
afterEach(() => {
  // Clear any test state if needed
});

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

global.sessionStorage = sessionStorageMock;

// Mock window.HUB_CONFIG
global.window = global.window || {};
global.window.HUB_CONFIG = {
  name: 'StrategyHub',
  apiBaseUrl: 'https://dashboard.securesovereigns.workers.dev',
  sentryDsn: '',
};

// Mock fetch
global.fetch = global.fetch || (() => {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: async () => ({ success: true, data: {} }),
    text: async () => '',
  });
});

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: () => {},
  warn: () => {},
  error: () => {},
};

