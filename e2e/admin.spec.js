/**
 * E2E Tests for Admin Features
 */

import { test, expect } from '@playwright/test';

test.describe('Admin Features', () => {
  test.beforeEach(async ({ page }) => {
    // Mock admin authentication
    await page.goto('/dashboard/login.html');
    await page.evaluate(() => {
      localStorage.setItem('hub_token', 'admin-token');
    });

    // Mock admin user
    await page.route('**/api/auth/me', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { id: 'admin-1', email: 'admin@example.com', role: 'admin' },
        }),
      });
    });
  });

  test('should display admin users page', async ({ page }) => {
    // Mock users API
    await page.route('**/api/users*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: '1',
              email: 'user@example.com',
              name: 'Test User',
              role: 'member',
              status: 'active',
            },
          ],
        }),
      });
    });

    await page.goto('/dashboard/admin/users.html');
    
    // Wait for users page to load
    await expect(page.locator('h1, h2')).toContainText(/user|admin/i, { timeout: 10000 });
  });

  test('should allow creating a new user', async ({ page }) => {
    let userCreated = false;

    // Mock create user API
    await page.route('**/api/users*', route => {
      if (route.request().method() === 'POST') {
        userCreated = true;
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'new-user',
              email: 'new@example.com',
              name: 'New User',
            },
          }),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: [] }),
        });
      }
    });

    await page.goto('/dashboard/admin/users.html');
    
    // Look for create user button
    const createButton = page.locator('button:has-text("Create"), button:has-text("Add User"), a:has-text("New User")');
    if (await createButton.count() > 0) {
      await createButton.first().click();
      
      // Fill user form if it appears
      const emailInput = page.locator('input[type="email"], input[name*="email" i]');
      if (await emailInput.count() > 0) {
        await emailInput.fill('new@example.com');
        await page.fill('input[name*="name" i], input[placeholder*="name" i]', 'New User');
        await page.fill('input[type="password"], input[name*="password" i]', 'password123');
        
        // Submit
        await page.click('button[type="submit"], button:has-text("Create"), button:has-text("Save")');
        await page.waitForTimeout(1000);
        
        expect(userCreated).toBe(true);
        await expect(page.locator('.toast, [role="alert"], .success')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should display roles management page', async ({ page }) => {
    // Mock roles API
    await page.route('**/api/roles*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: '1',
              name: 'Member',
              permissions: ['read'],
            },
          ],
        }),
      });
    });

    await page.goto('/dashboard/admin/roles.html');
    
    // Wait for roles page to load
    await expect(page.locator('h1, h2')).toContainText(/role/i, { timeout: 10000 });
  });

  test('should display audit logs', async ({ page }) => {
    // Mock audit API
    await page.route('**/api/audit*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: '1',
              userId: 'admin-1',
              action: 'user.created',
              resourceType: 'user',
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });
    });

    await page.goto('/dashboard/admin/audit.html');
    
    // Wait for audit logs to load
    await expect(page.locator('h1, h2')).toContainText(/audit|log/i, { timeout: 10000 });
  });

  test('should display financial dashboard', async ({ page }) => {
    // Mock financial API
    await page.route('**/api/admin/financial*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            totalDonations: 1000000,
            totalProjects: 10,
            recentTransactions: [],
          },
        }),
      });
    });

    await page.goto('/dashboard/admin/financial.html');
    
    // Wait for financial dashboard to load
    await expect(page.locator('h1, h2')).toContainText(/financial|dashboard/i, { timeout: 10000 });
  });

  test('should display settings page', async ({ page }) => {
    // Mock settings API
    await page.route('**/api/settings*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            hubName: 'StrategyHub',
            address: 'Test Address',
          },
        }),
      });
    });

    await page.goto('/dashboard/admin/settings.html');
    
    // Wait for settings page to load
    await expect(page.locator('h1, h2')).toContainText(/setting/i, { timeout: 10000 });
  });

  test('should display announcements management', async ({ page }) => {
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
              status: 'published',
            },
          ],
        }),
      });
    });

    await page.goto('/dashboard/admin/announcements.html');
    
    // Wait for announcements page to load
    await expect(page.locator('h1, h2')).toContainText(/announcement/i, { timeout: 10000 });
  });

  test('should display invites management', async ({ page }) => {
    // Mock invites API
    await page.route('**/api/invites*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: '1',
              email: 'invite@example.com',
              status: 'pending',
            },
          ],
        }),
      });
    });

    await page.goto('/dashboard/admin/invites.html');
    
    // Wait for invites page to load
    await expect(page.locator('h1, h2')).toContainText(/invite/i, { timeout: 10000 });
  });
});
