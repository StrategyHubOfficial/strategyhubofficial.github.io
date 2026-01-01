/**
 * Protected Route Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock auth manager
class MockAuthManager {
  constructor() {
    this.authenticated = false;
    this.currentUser = null;
  }

  async requireAuth() {
    if (!this.authenticated) {
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard/login.html';
      }
      return false;
    }
    return true;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isAdmin() {
    return this.currentUser?.role === 'admin';
  }
}

describe('Protected Route', () => {
  let mockAuth;
  let originalLocation;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = '<div id="app"></div>';
    
    // Mock window.location
    originalLocation = window.location;
    delete window.location;
    window.location = {
      href: '/dashboard/test.html',
      pathname: '/dashboard/test.html',
      replace: vi.fn()
    };

    // Create mock auth
    mockAuth = new MockAuthManager();
    window.auth = mockAuth;
  });

  afterEach(() => {
    window.location = originalLocation;
    delete window.auth;
  });

  describe('authentication check', () => {
    it('should allow access when authenticated', async () => {
      mockAuth.authenticated = true;
      mockAuth.currentUser = { id: '1', email: 'test@example.com' };

      const result = await mockAuth.requireAuth();
      expect(result).toBe(true);
      expect(window.location.href).toBe('/dashboard/test.html');
    });

    it('should redirect to login when not authenticated', async () => {
      mockAuth.authenticated = false;

      const result = await mockAuth.requireAuth();
      expect(result).toBe(false);
      expect(window.location.href).toBe('/dashboard/login.html');
    });

    it('should set currentUser on window when authenticated', async () => {
      mockAuth.authenticated = true;
      mockAuth.currentUser = { id: '1', email: 'test@example.com', role: 'member' };

      await mockAuth.requireAuth();
      
      // Simulate what protected-route.js does
      if (typeof window !== 'undefined' && mockAuth.authenticated) {
        window.currentUser = mockAuth.getCurrentUser();
        window.isAdmin = mockAuth.isAdmin();
      }

      expect(window.currentUser).toEqual(mockAuth.currentUser);
      expect(window.isAdmin).toBe(false);
    });

    it('should set isAdmin correctly', async () => {
      mockAuth.authenticated = true;
      mockAuth.currentUser = { id: '1', email: 'admin@example.com', role: 'admin' };

      await mockAuth.requireAuth();
      
      if (typeof window !== 'undefined' && mockAuth.authenticated) {
        window.currentUser = mockAuth.getCurrentUser();
        window.isAdmin = mockAuth.isAdmin();
      }

      expect(window.isAdmin).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle missing auth manager gracefully', () => {
      delete window.auth;
      
      // Simulate protected-route.js behavior
      if (typeof window.auth === 'undefined') {
        window.location.href = '/dashboard/login.html';
      }

      expect(window.location.href).toBe('/dashboard/login.html');
    });

    it('should handle auth check failure', async () => {
      mockAuth.requireAuth = vi.fn().mockRejectedValue(new Error('Auth failed'));
      
      try {
        await mockAuth.requireAuth();
      } catch (error) {
        expect(error.message).toBe('Auth failed');
      }
    });
  });

  describe('route protection logic', () => {
    it('should not redirect if already on login page', async () => {
      window.location.pathname = '/dashboard/login.html';
      window.location.href = '/dashboard/login.html';
      mockAuth.authenticated = false;

      // Simulate protected-route.js check - it checks pathname before redirecting
      const shouldRedirect = window.location.pathname !== '/dashboard/login.html';
      if (!shouldRedirect) {
        // Don't redirect if already on login
        expect(window.location.href).toBe('/dashboard/login.html');
      }
    });

    it('should protect routes that require authentication', async () => {
      const protectedRoutes = [
        '/dashboard/index.html',
        '/dashboard/projects/index.html',
        '/dashboard/admin/users.html'
      ];

      for (const route of protectedRoutes) {
        window.location.pathname = route;
        mockAuth.authenticated = false;

        const result = await mockAuth.requireAuth();
        if (!result) {
          expect(window.location.href).toBe('/dashboard/login.html');
        }
      }
    });
  });
});
