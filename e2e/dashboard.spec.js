/**
 * E2E Tests for Dashboard
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/dashboard/index.html');
    await page.evaluate(() => {
      localStorage.setItem('hub_token', 'test-token');
    });

    // Mock API responses
    await page.route('**/api/auth/me', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { id: '1', email: 'test@example.com', role: 'member' },
        }),
      });
    });
  });

  test('should load dashboard for authenticated user', async ({ page }) => {
    await page.goto('/dashboard/index.html');
    
    // Wait for dashboard content to load
    await expect(page.locator('h1, h2')).toContainText(/dashboard|welcome/i, { timeout: 10000 });
  });

  test('should redirect to login if not authenticated', async ({ page }) => {
    // Clear token
    await page.evaluate(() => {
      localStorage.removeItem('hub_token');
    });

    // Mock 401 response
    await page.route('**/api/auth/me', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Unauthorized' }),
      });
    });

    await page.goto('/dashboard/index.html');

    // Should redirect to login
    await expect(page).toHaveURL(/\/dashboard\/login\.html/, { timeout: 5000 });
  });
});

