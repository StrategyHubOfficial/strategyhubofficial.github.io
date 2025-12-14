/**
 * Authentication utilities with JWT token storage
 */

class AuthManager {
  constructor(api) {
    this.api = api;
    this.currentUser = null;
    this.token = localStorage.getItem('hub_token');
  }

  /**
   * Get stored token
   */
  getToken() {
    return this.token || localStorage.getItem('hub_token');
  }

  /**
   * Store token
   */
  setToken(token) {
    this.token = token;
    localStorage.setItem('hub_token', token);
  }

  /**
   * Remove token
   */
  clearToken() {
    this.token = null;
    localStorage.removeItem('hub_token');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.getToken();
  }

  /**
   * Get authorization header
   */
  getAuthHeader() {
    const token = this.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  /**
   * Verify token and get current user
   */
  async checkAuth() {
    if (!this.isAuthenticated()) {
      return false;
    }

    try {
      const response = await this.api.getCurrentUser();
      if (response.success && response.data) {
        this.currentUser = response.data;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Auth check failed:', error);
      this.clearToken();
      return false;
    }
  }

  /**
   * Require authentication, redirect to login if not authenticated
   */
  async requireAuth() {
    const isAuthenticated = await this.checkAuth();
    if (!isAuthenticated) {
      window.location.href = '/dashboard/login.html';
      return false;
    }
    return true;
  }

  /**
   * Login (handles 2FA flow)
   */
  async login(email, password) {
    try {
      const response = await this.api.login(email, password);
      if (response.success && response.data) {
        // Check if 2FA is required
        if (response.data.requires2FA) {
          return {
            success: true,
            requires2FA: true,
            tempToken: response.data.tempToken,
            userId: response.data.userId
          };
        }
        // Normal login (no 2FA)
        this.setToken(response.data.token);
        this.currentUser = response.data.user;
        return { success: true, user: response.data.user };
      }
      return { success: false, error: response.error || 'Login failed' };
    } catch (error) {
      return { success: false, error: error.message || 'Login failed' };
    }
  }

  /**
   * Verify 2FA code during login
   */
  async verify2FALogin(userId, code, tempToken) {
    try {
      const response = await this.api.verify2FALogin(userId, code, tempToken);
      if (response.success && response.data) {
        this.setToken(response.data.token);
        this.currentUser = response.data.user;
        return { success: true, user: response.data.user };
      }
      return { success: false, error: response.error || 'Invalid verification code' };
    } catch (error) {
      return { success: false, error: error.message || 'Verification failed' };
    }
  }

  /**
   * Logout
   */
  async logout() {
    this.clearToken();
    this.currentUser = null;
    window.location.href = '/dashboard/login.html';
  }

  /**
   * Check if user is admin
   */
  isAdmin() {
    return this.currentUser?.role === 'admin';
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.currentUser;
  }
}

window.AuthManager = AuthManager;
window.auth = new AuthManager(window.api);
