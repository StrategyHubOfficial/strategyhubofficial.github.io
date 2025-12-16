/**
 * Hub API Client
 */

class HubAPI {
  constructor(baseURL) {
    this.baseURL = baseURL || (window.HUB_CONFIG?.apiBaseUrl || 'https://dashboard.securesovereigns.workers.dev');
    this.abortControllers = new Map(); // Track active requests for cancellation
  }

  async request(endpoint, options = {}) {
    // Cancel previous request for same endpoint if it exists
    const existingController = this.abortControllers.get(endpoint);
    if (existingController) {
      existingController.abort();
    }

    // Create new AbortController for this request
    const controller = new AbortController();
    this.abortControllers.set(endpoint, controller);
    
    // Retry logic with exponential backoff
    const maxRetries = options.retries !== undefined ? options.retries : 3;
    const retryDelay = options.retryDelay !== undefined ? options.retryDelay : 1000;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Ensure endpoint starts with /api
        const normalizedEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
        const url = `${this.baseURL}${normalizedEndpoint}`;
        
        // Get auth token from localStorage if available
        const token = localStorage.getItem('hub_token');
        const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        const config = {
          ...options,
          mode: 'cors',
          credentials: 'omit',
          signal: controller.signal, // Add abort signal for request cancellation
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
            ...options.headers
          }
        };

        const response = await fetch(url, config);
        
        // Remove controller on success
        this.abortControllers.delete(endpoint);
        
        // Handle blocked requests (browser extensions, CORS, etc.)
        if (!response.ok && response.status === 0) {
          const error = new Error('Request blocked by browser. This may be caused by an ad blocker or privacy extension. Please disable extensions for this site or check network settings.');
          error.name = 'BlockedRequestError';
          throw error;
        }
        
        const data = await response.json();
        
        if (!response.ok) {
          // If unauthorized, try token refresh first (except for auth endpoints)
          if (response.status === 401 && !endpoint.includes('/auth/')) {
            const refreshed = await this.refreshToken();
            if (refreshed && attempt < maxRetries) {
              // Retry with new token
              await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
              continue;
            }
            // Token refresh failed or max retries reached
            localStorage.removeItem('hub_token');
            if (window.location.pathname !== '/dashboard/login.html') {
              window.location.href = '/dashboard/login.html';
            }
          }
          throw new Error(data.error || `HTTP ${response.status}`);
        }
        
        return data;
      } catch (error) {
        // Remove controller on error (unless it was aborted)
        if (error.name !== 'AbortError') {
          this.abortControllers.delete(endpoint);
        }
        
        // Don't throw for aborted requests (they're intentional)
        if (error.name === 'AbortError') {
          return null;
        }
        
        // Retry on network errors (not 4xx/5xx)
        const isNetworkError = error.name === 'TypeError' || error.message.includes('fetch');
        const isRetryable = isNetworkError && attempt < maxRetries;
        
        if (isRetryable) {
          // Exponential backoff
          const delay = retryDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // Last attempt or non-retryable error
        if (attempt === maxRetries || !isRetryable) {
          console.error('API Error:', error);
          throw error;
        }
      }
    }
  }

  // Token refresh mechanism
  async refreshToken() {
    const token = localStorage.getItem('hub_token');
    if (!token) return false;
    
    try {
      // Decode token to check expiration
      const parts = token.split('.');
      if (parts.length !== 3) {
        // Invalid token format
        return false;
      }
      
      let payload;
      try {
        payload = JSON.parse(atob(parts[1]));
      } catch (e) {
        // Invalid token payload
        return false;
      }
      
      const expiresAt = payload.exp * 1000;
      const now = Date.now();
      
      // Check if token is already expired (with 5 minute buffer)
      if (expiresAt - now < -300000) {
        // Token expired more than 5 minutes ago, can't refresh
        return false;
      }
      
      // Only refresh if expires in less than 1 hour
      if (expiresAt - now > 3600000) {
        return true; // Token still valid
      }
      
      // Call refresh endpoint
      const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ token })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.token) {
          localStorage.setItem('hub_token', data.data.token);
          // Update auth manager if available
          if (window.auth && window.auth.setToken) {
            window.auth.setToken(data.data.token);
            if (data.data.user) {
              window.auth.currentUser = data.data.user;
            }
          }
          return true;
        }
      } else if (response.status === 401) {
        // Refresh failed, token is invalid - clear it
        localStorage.removeItem('hub_token');
        if (window.auth && window.auth.clearToken) {
          window.auth.clearToken();
        }
        return false;
      }
      
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // On network error, don't clear token (might be temporary)
      // Only clear on parsing/format errors
      if (error.name !== 'TypeError' && !error.message.includes('fetch')) {
        localStorage.removeItem('hub_token');
        if (window.auth && window.auth.clearToken) {
          window.auth.clearToken();
        }
      }
      return false;
    }
  }

  // Cancel all pending requests
  cancelAll() {
    this.abortControllers.forEach((controller) => {
      controller.abort();
    });
    this.abortControllers.clear();
  }

  // Cancel specific request
  cancel(endpoint) {
    const controller = this.abortControllers.get(endpoint);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(endpoint);
    }
  }

  // Health check
  async health() {
    return this.request('/api/health');
  }

  // Authentication
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

  // 2FA Methods
  async setup2FA(userId) {
    return this.request('/api/auth/2fa/setup', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }

  async verify2FASetup(userId, code) {
    return this.request('/api/auth/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({ userId, code })
    });
  }

  async enable2FA(userId) {
    return this.request('/api/auth/2fa/enable', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }

  async disable2FA(userId, password) {
    return this.request('/api/auth/2fa/disable', {
      method: 'POST',
      body: JSON.stringify({ userId, password })
    });
  }

  async verify2FALogin(userId, code, tempToken) {
    return this.request('/api/auth/2fa/verify-login', {
      method: 'POST',
      body: JSON.stringify({ userId, code, tempToken })
    });
  }

  async get2FAStatus() {
    return this.request('/api/auth/2fa/status');
  }

  // Studio
  async getStudioAvailability(start, end) {
    return this.request(`/api/studio/availability?start=${start}&end=${end}`);
  }

  async createBooking(booking) {
    return this.request('/api/studio/bookings', {
      method: 'POST',
      body: JSON.stringify(booking)
    });
  }

  async getBookings(userId) {
    return this.request(`/api/studio/bookings${userId ? `?user=${userId}` : ''}`);
  }

  // Members
  async getMembers() {
    return this.request('/api/members');
  }

  async getMyProfile() {
    return this.request('/api/members/me');
  }

  async updateProfile(memberId, profileData) {
    return this.request(`/api/members/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  // Invites (admin only)
  async createInvite(email, expiresInDays) {
    return this.request('/api/invites', {
      method: 'POST',
      body: JSON.stringify({ email, expiresInDays })
    });
  }

  async getInvites() {
    return this.request('/api/invites');
  }

  async deleteInvite(inviteId) {
    return this.request(`/api/invites/${inviteId}`, {
      method: 'DELETE'
    });
  }

  async verifyInviteToken(token) {
    return this.request(`/api/invites/verify/${token}`);
  }

  async registerWithInvite(inviteData) {
    return this.request('/api/invites/register', {
      method: 'POST',
      body: JSON.stringify(inviteData)
    });
  }

  async getMember(id) {
    return this.request(`/api/members/${id}`);
  }

  async searchMembers(query, skills) {
    const params = new URLSearchParams();
    if (query) {params.append('q', query);}
    if (skills) {params.append('skills', skills);}
    return this.request(`/api/members/search?${params.toString()}`);
  }

  async updateMember(id, data) {
    return this.request(`/api/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // Projects
  async getProjects(includePrivate = false) {
    const params = includePrivate ? '?includePrivate=true' : '';
    return this.request(`/api/projects${params}`);
  }

  async getProject(id) {
    return this.request(`/api/projects/${id}`);
  }

  async createProject(project) {
    return this.request('/api/projects', {
      method: 'POST',
      body: JSON.stringify(project)
    });
  }

  async updateProject(id, project) {
    return this.request(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(project)
    });
  }

  async deleteProject(id) {
    return this.request(`/api/projects/${id}`, {
      method: 'DELETE'
    });
  }

  async addProjectMember(projectId, memberId) {
    return this.request(`/api/projects/${projectId}/members`, {
      method: 'POST',
      body: JSON.stringify({ memberId })
    });
  }

  async removeProjectMember(projectId, memberId) {
    return this.request(`/api/projects/${projectId}/members/${memberId}`, {
      method: 'DELETE'
    });
  }

  // Events
  async getEvents(start, end) {
    const params = start && end ? `?start=${start}&end=${end}` : '';
    return this.request(`/api/events${params}`);
  }

  async createEvent(event) {
    return this.request('/api/events', {
      method: 'POST',
      body: JSON.stringify(event)
    });
  }

  async updateEvent(eventId, updates) {
    return this.request(`/api/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async deleteEvent(eventId) {
    return this.request(`/api/events/${eventId}`, {
      method: 'DELETE'
    });
  }

  async rsvpToEvent(eventId) {
    return this.request(`/api/events/${eventId}/rsvp`, {
      method: 'POST'
    });
  }

  async cancelRSVP(eventId) {
    return this.request(`/api/events/${eventId}/rsvp`, {
      method: 'DELETE'
    });
  }

  async addEventGuest(eventId, guest) {
    return this.request(`/api/events/${eventId}/guests`, {
      method: 'POST',
      body: JSON.stringify(guest)
    });
  }

  async removeEventGuest(eventId, guestEmail) {
    return this.request(`/api/events/${eventId}/guests/${encodeURIComponent(guestEmail)}`, {
      method: 'DELETE'
    });
  }

  async addStudioGuest(bookingId, guest) {
    return this.request(`/api/studio/bookings/${bookingId}/guests`, {
      method: 'POST',
      body: JSON.stringify(guest)
    });
  }

  async removeStudioGuest(bookingId, guestEmail) {
    return this.request(`/api/studio/bookings/${bookingId}/guests/${encodeURIComponent(guestEmail)}`, {
      method: 'DELETE'
    });
  }

  async updateStudioBooking(bookingId, updates) {
    return this.request(`/api/studio/bookings/${bookingId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  // Equipment
  async getEquipment() {
    return this.request('/api/equipment');
  }

  async requestEquipmentCheckout(data) {
    return this.request('/api/equipment/checkout/request', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Subscriptions
  async getEventSubscriptions() {
    return this.request('/api/subscriptions/events');
  }

  async updateEventSubscriptions(subscriptions) {
    return this.request('/api/subscriptions/events', {
      method: 'PUT',
      body: JSON.stringify(subscriptions)
    });
  }

  // Generic request methods for convenience
  async get(endpoint) {
    return this.request(endpoint);
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
    return this.request(endpoint, {
      method: 'DELETE'
    });
  }

  // Sponsorships
  async getMySponsorship() {
    return this.request('/api/sponsorships/me');
  }

  async getSponsorships() {
    return this.request('/api/sponsorships');
  }

  async createSponsorship(tier) {
    return this.request('/api/sponsorships', {
      method: 'POST',
      body: JSON.stringify({ tier })
    });
  }

  // Approval endpoints
  async approveProject(projectId) {
    return this.request(`/api/projects/${projectId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ action: 'approve' })
    });
  }

  async rejectProject(projectId) {
    return this.request(`/api/projects/${projectId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ action: 'reject' })
    });
  }

  async getPendingProjects() {
    return this.request('/api/projects/pending');
  }

  async approveEvent(eventId) {
    return this.request(`/api/events/${eventId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ action: 'approve' })
    });
  }

  async rejectEvent(eventId) {
    return this.request(`/api/events/${eventId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ action: 'reject' })
    });
  }

  async getPendingEvents() {
    return this.request('/api/events/pending');
  }

  async cancelSponsorship(id) {
    return this.request(`/api/sponsorships/${id}/cancel`, {
      method: 'POST'
    });
  }

  // ACL methods
  async getRoles() {
    return this.get('/api/roles');
  }

  async getRole(roleId) {
    return this.get(`/api/roles/${roleId}`);
  }

  async createRole(roleData) {
    return this.post('/api/roles', roleData);
  }

  async updateRole(roleId, roleData) {
    return this.put(`/api/roles/${roleId}`, roleData);
  }

  async updateRolePermissions(roleId, permissions) {
    return this.put(`/api/roles/${roleId}/permissions`, { permissions });
  }

  async deleteRole(roleId) {
    return this.delete(`/api/roles/${roleId}`);
  }

  async getPermissions() {
    return this.get('/api/permissions');
  }

  async getUserRoles(userId) {
    return this.get(`/api/users/${userId}/roles`);
  }

  async assignRole(userId, roleId) {
    return this.post(`/api/users/${userId}/roles`, { roleId });
  }

  async removeRole(userId, roleId) {
    return this.delete(`/api/users/${userId}/roles/${roleId}`);
  }

  async getUserPermissions(userId) {
    return this.get(`/api/users/${userId}/permissions`);
  }

  // Supporters (includes sponsorships and guest donors)
  async getSupporters() {
    return this.get('/api/supporters');
  }

  // Create guest employee account (admin only)
  async createGuestEmployee(data) {
    return this.post('/api/members/guest-employee', data);
  }

  // Bulk operations
  async bulkProjects(projectIds, action) {
    return this.post('/api/projects/bulk', { projectIds, action });
  }

  async bulkEvents(eventIds, action) {
    return this.post('/api/events/bulk', { eventIds, action });
  }

  async bulkUsers(userIds, action) {
    return this.post('/api/users/bulk', { userIds, action });
  }
}

// Export for use
window.HubAPI = HubAPI;
window.api = new HubAPI();

