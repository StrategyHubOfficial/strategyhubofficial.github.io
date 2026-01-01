/**
 * E2E Tests for Authentication
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/dashboard/login.html');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    // Mock API response
    await page.route('**/api/auth/login', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Invalid credentials',
        }),
      });
    });

    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Wait for error message
    await expect(page.locator('.error, [role="alert"]')).toBeVisible({ timeout: 5000 });
  });

  test('should redirect to dashboard on successful login', async ({ page }) => {
    // Mock API response
    await page.route('**/api/auth/login', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            token: 'test-token',
            user: { id: '1', email: 'test@example.com', role: 'member' },
          },
        }),
      });
    });

    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard\/index\.html/, { timeout: 5000 });
  });

  test('should handle 2FA login flow', async ({ page }) => {
    // Mock initial login response with 2FA requirement
    await page.route('**/api/auth/login', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            requires2FA: true,
            tempToken: 'temp-token',
            userId: '1',
          },
        }),
      });
    });

    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should show 2FA input
    await expect(page.locator('#2fa-code, input[name="2fa"], input[placeholder*="code" i]')).toBeVisible({ timeout: 5000 });
  });

  test('should handle password reset flow', async ({ page }) => {
    await page.goto('/dashboard/forgot-password.html');
    
    // Mock forgot password API
    await page.route('**/api/auth/forgot-password', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Password reset email sent',
        }),
      });
    });

    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.count() > 0) {
      await emailInput.fill('test@example.com');
      await page.click('button[type="submit"], button:has-text("Send")');
      
      // Should show success message
      await expect(page.locator('.success, [role="alert"], .toast')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should validate login form', async ({ page }) => {
    await page.goto('/dashboard/login.html');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Should show validation errors
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.count() > 0) {
      const isRequired = await emailInput.evaluate(el => el.validity.valueMissing);
      expect(isRequired).toBe(true);
    }
  });
});



