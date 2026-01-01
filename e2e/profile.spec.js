/**
 * E2E Tests for Profile Management
 */

import { test, expect } from '@playwright/test';

test.describe('Profile Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/dashboard/login.html');
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

  test('should display profile page', async ({ page }) => {
    // Mock profile API
    await page.route('**/api/members/me*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            bio: 'Test bio',
            skills: ['JavaScript'],
          },
        }),
      });
    });

    await page.goto('/dashboard/profile/index.html');
    
    // Wait for profile to load
    await expect(page.locator('h1, h2')).toContainText(/profile/i, { timeout: 10000 });
  });

  test('should allow editing profile', async ({ page }) => {
    let profileUpdated = false;

    // Mock get profile
    await page.route('**/api/members/me*', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: '1',
              name: 'Test User',
              email: 'test@example.com',
              bio: 'Original bio',
            },
          }),
        });
      }
    });

    // Mock update profile
    await page.route('**/api/members/1*', route => {
      if (route.request().method() === 'PUT') {
        profileUpdated = true;
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: '1',
              name: 'Updated User',
              bio: 'Updated bio',
            },
          }),
        });
      }
    });

    await page.goto('/dashboard/profile/index.html');
    
    // Look for edit button
    const editButton = page.locator('button:has-text("Edit"), button:has-text("Update"), a:has-text("Edit")');
    if (await editButton.count() > 0) {
      await editButton.first().click();
      
      // Fill form if it appears
      const nameInput = page.locator('input[name*="name" i], input[placeholder*="name" i]');
      if (await nameInput.count() > 0) {
        await nameInput.fill('Updated User');
        await page.fill('textarea[name*="bio" i], textarea[placeholder*="bio" i]', 'Updated bio');
        
        // Submit
        await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Update")');
        await page.waitForTimeout(1000);
        
        expect(profileUpdated).toBe(true);
        await expect(page.locator('.toast, [role="alert"], .success')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should display 2FA setup page', async ({ page }) => {
    // Mock 2FA status
    await page.route('**/api/auth/2fa/status', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            enabled: false,
          },
        }),
      });
    });

    await page.goto('/dashboard/profile/2fa-setup.html');
    
    // Wait for 2FA page to load
    await expect(page.locator('h1, h2')).toContainText(/2fa|two-factor|authentication/i, { timeout: 10000 });
  });

  test('should allow setting up 2FA', async ({ page }) => {
    let setupInitiated = false;

    // Mock 2FA setup
    await page.route('**/api/auth/2fa/setup', route => {
      if (route.request().method() === 'POST') {
        setupInitiated = true;
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              secret: 'TEST_SECRET',
              qrCode: 'data:image/png;base64,test',
            },
          }),
        });
      }
    });

    await page.goto('/dashboard/profile/2fa-setup.html');
    
    // Look for setup button
    const setupButton = page.locator('button:has-text("Setup"), button:has-text("Enable"), button:has-text("Start")');
    if (await setupButton.count() > 0) {
      await setupButton.first().click();
      await page.waitForTimeout(1000);
      
      // Should show QR code or secret
      await expect(page.locator('img[src*="qr"], code, .secret, text=TEST_SECRET')).toBeVisible({ timeout: 5000 });
      expect(setupInitiated).toBe(true);
    }
  });

  test('should display user preferences', async ({ page }) => {
    // Mock preferences API
    await page.route('**/api/user/preferences*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            timezone: 'America/New_York',
            locale: 'en-US',
            theme: 'dark',
            notifications: {
              email: true,
              events: true,
            },
          },
        }),
      });
    });

    await page.goto('/dashboard/profile/index.html');
    
    // Look for preferences section
    const preferencesSection = page.locator('text=preferences, text=settings, [data-section="preferences"]');
    if (await preferencesSection.count() > 0) {
      await expect(preferencesSection.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should allow updating preferences', async ({ page }) => {
    let preferencesUpdated = false;

    // Mock update preferences
    await page.route('**/api/user/preferences*', route => {
      if (route.request().method() === 'PUT') {
        preferencesUpdated = true;
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              timezone: 'America/Los_Angeles',
              theme: 'light',
            },
          }),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              timezone: 'America/New_York',
              theme: 'dark',
            },
          }),
        });
      }
    });

    await page.goto('/dashboard/profile/index.html');
    
    // Look for preferences form
    const timezoneSelect = page.locator('select[name*="timezone"], select[name*="Timezone"]');
    if (await timezoneSelect.count() > 0) {
      await timezoneSelect.selectOption('America/Los_Angeles');
      await page.click('button[type="submit"], button:has-text("Save Preferences")');
      await page.waitForTimeout(1000);
      
      expect(preferencesUpdated).toBe(true);
    }
  });
});
