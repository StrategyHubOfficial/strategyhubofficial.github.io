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

  test('should display dashboard stats', async ({ page }) => {
    // Mock stats APIs
    await page.route('**/api/studio/bookings*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    });

    await page.route('**/api/events*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    });

    await page.route('**/api/projects*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    });

    await page.route('**/api/equipment*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    });

    await page.goto('/dashboard/index.html');
    
    // Wait for stats to load
    await expect(page.locator('#stats-grid, .stats-grid, .stat-card')).toBeVisible({ timeout: 10000 });
  });

  test('should display announcements', async ({ page }) => {
    // Mock announcements API
    await page.route('**/api/announcements*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: '1',
              title: 'Test Announcement',
              content: 'Test content',
              status: 'published',
            },
          ],
        }),
      });
    });

    await page.goto('/dashboard/index.html');
    
    // Wait for announcements to load
    await expect(page.locator('#announcements-section, .announcement')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to different sections', async ({ page }) => {
    await page.goto('/dashboard/index.html');
    
    // Test navigation links
    const studioLink = page.locator('a:has-text("Studio"), a[href*="studio"]');
    if (await studioLink.count() > 0) {
      await studioLink.first().click();
      await expect(page).toHaveURL(/\/dashboard\/studio/, { timeout: 5000 });
    }
  });
});



