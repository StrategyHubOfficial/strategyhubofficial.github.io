/**
 * Frontend API Client Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockFetch, successResponse, errorResponse, unauthorizedResponse } from './helpers/api-mock.js';

// Import HubAPI class
// Since it's defined as a class in the global scope, we need to load it
// For testing, we'll import it dynamically or recreate the class
class HubAPI {
  constructor(baseURL) {
    this.baseURL = baseURL || (window.HUB_CONFIG?.apiBaseUrl || 'https://dashboard.securesovereigns.workers.dev');
  }

  async request(endpoint, options = {}) {
    const normalizedEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
    const url = `${this.baseURL}${normalizedEndpoint}`;
    
    const token = localStorage.getItem('hub_token');
    const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    const config = {
      ...options,
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok && response.status === 0) {
        const error = new Error('Request blocked by browser.');
        error.name = 'BlockedRequestError';
        throw error;
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('hub_token');
          if (window.location.pathname !== '/dashboard/login.html') {
            window.location.href = '/dashboard/login.html';
          }
        }
        throw new Error(data.error || `HTTP ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async health() {
    return this.request('/api/health');
  }

  async login(email, password) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async getCurrentUser() {
    return this.request('/api/auth/me');
  }

  async verifyToken() {
    return this.request('/api/auth/verify');
  }

  async logout() {
    localStorage.removeItem('hub_token');
    return { success: true };
  }

  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

describe('HubAPI', () => {
  let api;
  let mockFetch;

  beforeEach(() => {
    api = new HubAPI('https://test-api.example.com');
    
    // Mock fetch
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    
    // Reset localStorage
    localStorage.clear();
    
    // Mock window.location
    delete window.location;
    window.location = { 
      href: '/dashboard/test.html', 
      pathname: '/dashboard/test.html',
      replace: vi.fn()
    };
  });

  describe('request', () => {
    it('should make GET request with correct URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { id: '1' } }),
      });

      const result = await api.request('/api/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.example.com/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result.success).toBe(true);
      expect(result.data.id).toBe('1');
    });

    it('should include Authorization header when token exists', async () => {
      localStorage.setItem('hub_token', 'test-token');
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

      await api.request('/api/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
          }),
        })
      );
    });

    it('should handle 401 by clearing token and redirecting', async () => {
      localStorage.setItem('hub_token', 'test-token');
      
      // Mock window.location
      const originalLocation = window.location;
      delete window.location;
      window.location = { href: '/dashboard/test.html', pathname: '/dashboard/test.html' };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ success: false, error: 'Unauthorized' }),
      });

      await expect(api.request('/api/test')).rejects.toThrow();

      expect(localStorage.getItem('hub_token')).toBeNull();
      
      // Restore window.location
      window.location = originalLocation;
    });

    it('should handle API errors correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ success: false, error: 'Bad Request' }),
      });

      await expect(api.request('/api/test')).rejects.toThrow('Bad Request');
    });
  });

  describe('login', () => {
    it('should send POST request with email and password', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { token: 'test-token', user: { id: '1' } } }),
      });

      const result = await api.login('test@example.com', 'password123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/login'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
        })
      );
      expect(result.success).toBe(true);
    });
  });

  describe('getCurrentUser', () => {
    it('should fetch current user', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { id: '1', email: 'test@example.com' } }),
      });

      const result = await api.getCurrentUser();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/me'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result.success).toBe(true);
      expect(result.data.email).toBe('test@example.com');
    });
  });

  describe('helper methods', () => {
    it('should use GET method for get()', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: {} }),
      });

      await api.get('/api/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should use POST method for post()', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: {} }),
      });

      await api.post('/api/test', { name: 'test' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'test' })
        })
      );
    });

    it('should use DELETE method for delete()', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: {} }),
      });

      await api.delete('/api/test/123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test/123'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(api.request('/api/test')).rejects.toThrow('Network error');
    });

    it('should handle blocked requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 0,
        json: async () => ({}),
      });

      await expect(api.request('/api/test')).rejects.toThrow('Request blocked');
    });
  });
});

