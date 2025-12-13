/**
 * Hub API Client
 */

class HubAPI {
  constructor(baseURL) {
    this.baseURL = baseURL || (window.HUB_CONFIG?.apiBaseUrl || 'https://dashboard.securesovereigns.workers.dev');
  }

  async request(endpoint, options = {}) {
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
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, config);
      
      // Handle blocked requests (browser extensions, CORS, etc.)
      if (!response.ok && response.status === 0) {
        const error = new Error('Request blocked by browser. This may be caused by an ad blocker or privacy extension. Please disable extensions for this site or check network settings.');
        error.name = 'BlockedRequestError';
        throw error;
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        // If unauthorized, clear token and redirect to login
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
    if (query) params.append('q', query);
    if (skills) params.append('skills', skills);
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
}

// Export for use
window.HubAPI = HubAPI;
window.api = new HubAPI();

