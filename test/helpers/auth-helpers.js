/**
 * Authentication Test Helpers
 */

/**
 * Set up authenticated state in localStorage
 */
export function setupAuthenticatedUser(user = null) {
  const testUser = user || {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'member'
  };
  
  localStorage.setItem('hub_token', 'test-token-123');
  localStorage.setItem('hub_user', JSON.stringify(testUser));
  
  return testUser;
}

/**
 * Clear authentication state
 */
export function clearAuth() {
  localStorage.removeItem('hub_token');
  localStorage.removeItem('hub_user');
}

/**
 * Mock authenticated API responses
 */
export function mockAuthenticatedUser(mockFetch, user = null) {
  const testUser = user || {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'member'
  };

  mockFetch.mockImplementation(async (url) => {
    if (url.includes('/api/auth/me')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: testUser })
      };
    }
    // Default response
    return {
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: {} })
    };
  });
}
