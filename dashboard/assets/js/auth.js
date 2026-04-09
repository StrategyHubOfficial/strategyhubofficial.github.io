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
   * Verify token and get current user.
   * Single-flight: concurrent callers share one /api/auth/me request (avoids refresh storms).
   */
  async checkAuth() {
    if (!this.isAuthenticated()) {
      return false;
    }

    if (this._checkAuthPromise) {
      return this._checkAuthPromise;
    }

    this._checkAuthPromise = (async () => {
      try {
        const response = await this.api.getCurrentUser();
        if (response.success && response.data) {
          this.currentUser = response.data;
          return true;
        }
        return false;
      } catch (error) {
        // 401: api.request clears token + may redirect. 404: user removed from server.
        if (error.status === 404) {
          this.clearToken();
        }
        console.error('Auth check failed:', error);
        return false;
      } finally {
        this._checkAuthPromise = null;
      }
    })();

    return this._checkAuthPromise;
  }

  /**
   * Require authentication, redirect to login if not authenticated
   */
  async requireAuth() {
    let ok = await this.checkAuth();
    if (ok) {
      return true;
    }
    // One retry: multiple parallel checkAuth calls used to N-tuple /api/auth/me; transient
    // failures or rate limits should not immediately boot the user when the token is still valid.
    if (this.getToken()) {
      await new Promise((r) => setTimeout(r, 400));
      ok = await this.checkAuth();
    }
    if (ok) {
      return true;
    }
    if (!this.getToken()) {
      window.location.href = '/dashboard/login.html';
      return false;
    }
    // Token still present but verification failed without 401 (e.g. network/429). Let the page load.
    console.warn('Session could not be verified (temporary). Keeping local token; retry on next action.');
    return true;
  }

  /**
   * Login (handles 2FA flow)
   */
  async login(email, password, rememberMe = false) {
    try {
      const response = await this.api.login(email, password, rememberMe);
      if (response.success && response.data) {
        // Check if 2FA is required
        if (response.data.requires2FA) {
          return {
            success: true,
            requires2FA: true,
            tempToken: response.data.tempToken,
            userId: response.data.userId,
            rememberMe: rememberMe
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
    const u = this.currentUser;
    if (!u) return false;
    if (u.role === 'admin') return true;
    return Array.isArray(u.roles) && u.roles.includes('admin');
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
