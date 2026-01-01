/**
 * Test Data Factories
 * Generate consistent test data for tests
 */

/**
 * Create a test user object
 */
export function createTestUser(overrides = {}) {
  return {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'member',
    status: 'active',
    createdAt: new Date().toISOString(),
    ...overrides
  };
}

/**
 * Create a test admin user
 */
export function createTestAdmin(overrides = {}) {
  return createTestUser({
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    ...overrides
  });
}

/**
 * Create a test project
 */
export function createTestProject(overrides = {}) {
  return {
    id: 'project-123',
    name: 'Test Project',
    description: 'A test project',
    status: 'active',
    ownerId: 'user-123',
    createdAt: new Date().toISOString(),
    ...overrides
  };
}

/**
 * Create a test event
 */
export function createTestEvent(overrides = {}) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 7); // 7 days from now
  
  return {
    id: 'event-123',
    title: 'Test Event',
    description: 'A test event',
    startDate: startDate.toISOString(),
    endDate: new Date(startDate.getTime() + 3600000).toISOString(), // 1 hour later
    status: 'published',
    ...overrides
  };
}

/**
 * Create a test booking
 */
export function createTestBooking(overrides = {}) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 1);
  
  return {
    id: 'booking-123',
    userId: 'user-123',
    startTime: startDate.toISOString(),
    endTime: new Date(startDate.getTime() + 3600000).toISOString(),
    status: 'confirmed',
    ...overrides
  };
}

/**
 * Create a test equipment item
 */
export function createTestEquipment(overrides = {}) {
  return {
    id: 'equipment-123',
    name: 'Test Equipment',
    category: 'camera',
    status: 'available',
    ...overrides
  };
}

/**
 * Create a test announcement
 */
export function createTestAnnouncement(overrides = {}) {
  return {
    id: 'announcement-123',
    title: 'Test Announcement',
    content: 'Test content',
    status: 'published',
    priority: 'normal',
    ...overrides
  };
}

/**
 * Create a JWT token payload
 */
export function createTokenPayload(overrides = {}) {
  const now = Math.floor(Date.now() / 1000);
  return {
    userId: 'user-123',
    email: 'test@example.com',
    role: 'member',
    iat: now,
    exp: now + 3600, // 1 hour
    ...overrides
  };
}
