/**
 * API Mocking Utilities for Tests
 */

/**
 * Create a mock fetch function for testing
 * @param {Object} responses - Map of URL patterns to responses
 * @returns {Function} Mock fetch function
 */
export function createMockFetch(responses = {}) {
  return async (url, options = {}) => {
    // Find matching response
    const match = Object.keys(responses).find(pattern => {
      if (pattern instanceof RegExp) {
        return pattern.test(url);
      }
      return url.includes(pattern);
    });

    const response = match ? responses[match] : responses['*'] || {
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: {} })
    };

    // Handle function responses
    if (typeof response === 'function') {
      return response(url, options);
    }

    // Handle object responses
    return {
      ok: response.ok !== false,
      status: response.status || 200,
      statusText: response.statusText || 'OK',
      json: async () => response.body || response.json || { success: true, data: {} },
      text: async () => typeof response.body === 'string' ? response.body : JSON.stringify(response.body || {}),
      headers: new Headers(response.headers || {})
    };
  };
}

/**
 * Create a successful API response
 */
export function successResponse(data) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ success: true, data })
  };
}

/**
 * Create an error API response
 */
export function errorResponse(status, error, code = null) {
  return {
    ok: false,
    status,
    json: async () => ({
      success: false,
      error,
      code
    })
  };
}

/**
 * Create a 401 unauthorized response
 */
export function unauthorizedResponse() {
  return errorResponse(401, 'Unauthorized', 'UNAUTHORIZED');
}

/**
 * Create a 404 not found response
 */
export function notFoundResponse() {
  return errorResponse(404, 'Not Found', 'NOT_FOUND');
}

/**
 * Create a 400 bad request response
 */
export function badRequestResponse(error = 'Bad Request') {
  return errorResponse(400, error, 'BAD_REQUEST');
}
