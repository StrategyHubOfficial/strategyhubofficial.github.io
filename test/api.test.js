/**
 * Frontend API Client Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Import HubAPI - it's a global class, so we'll create it from the file
// For testing, we'll create a mock or import the class definition
let HubAPI;

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
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result.success).toBe(true);
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
        expect.objectContaining({ method: 'GET' })
      );
      expect(result.success).toBe(true);
    });
  });
});

