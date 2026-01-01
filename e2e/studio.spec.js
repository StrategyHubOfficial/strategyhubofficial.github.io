/**
 * E2E Tests for Studio Booking
 */

import { test, expect } from '@playwright/test';

test.describe('Studio Booking', () => {
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

  test('should display studio booking page', async ({ page }) => {
    // Mock studio availability
    await page.route('**/api/studio/availability*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            available: [
              {
                start: new Date(Date.now() + 86400000).toISOString(),
                end: new Date(Date.now() + 86400000 + 3600000).toISOString(),
              },
            ],
          },
        }),
      });
    });

    await page.goto('/dashboard/studio/index.html');
    
    // Wait for studio page to load
    await expect(page.locator('h1, h2')).toContainText(/studio/i, { timeout: 10000 });
  });

  test('should allow creating a booking', async ({ page }) => {
    let bookingCreated = false;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    // Mock availability
    await page.route('**/api/studio/availability*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            available: [
              {
                start: tomorrow.toISOString(),
                end: new Date(tomorrow.getTime() + 3600000).toISOString(),
              },
            ],
          },
        }),
      });
    });

    // Mock create booking
    await page.route('**/api/studio/bookings', route => {
      if (route.request().method() === 'POST') {
        bookingCreated = true;
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'booking-123',
              startTime: tomorrow.toISOString(),
              endTime: new Date(tomorrow.getTime() + 3600000).toISOString(),
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

    await page.goto('/dashboard/studio/index.html');
    
    // Look for booking form or button
    const bookButton = page.locator('button:has-text("Book"), button:has-text("Create Booking"), a:has-text("Book")');
    if (await bookButton.count() > 0) {
      await bookButton.first().click();
      
      // Fill booking form if it appears
      const startInput = page.locator('input[type="datetime-local"], input[name*="start" i]');
      if (await startInput.count() > 0) {
        await startInput.fill(tomorrow.toISOString().slice(0, 16));
        
        // Submit
        await page.click('button[type="submit"], button:has-text("Book"), button:has-text("Confirm")');
        await page.waitForTimeout(1000);
        
        expect(bookingCreated).toBe(true);
        await expect(page.locator('.toast, [role="alert"], .success')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should display existing bookings', async ({ page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Mock bookings API
    await page.route('**/api/studio/bookings*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'booking-1',
              startTime: tomorrow.toISOString(),
              endTime: new Date(tomorrow.getTime() + 3600000).toISOString(),
              status: 'confirmed',
            },
          ],
        }),
      });
    });

    await page.goto('/dashboard/studio/index.html');
    
    // Should show booking in list
    await expect(page.locator('text=booking, text=Booking')).toBeVisible({ timeout: 5000 });
  });
});
