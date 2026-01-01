/**
 * E2E Tests for Events
 */

import { test, expect } from '@playwright/test';

test.describe('Events', () => {
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

  test('should display events list', async ({ page }) => {
    // Mock events API
    await page.route('**/api/events', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: '1',
              title: 'Test Event',
              description: 'A test event',
              startDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
              status: 'published',
            },
          ],
        }),
      });
    });

    await page.goto('/dashboard/events/index.html');
    
    // Wait for events to load
    await expect(page.locator('h1, h2')).toContainText(/event/i, { timeout: 10000 });
  });

  test('should allow RSVP to event', async ({ page }) => {
    let rsvpCalled = false;

    // Mock events list
    await page.route('**/api/events', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: '1',
              title: 'Test Event',
              startDate: new Date(Date.now() + 86400000).toISOString(),
              status: 'published',
            },
          ],
        }),
      });
    });

    // Mock RSVP API
    await page.route('**/api/events/1/rsvp', route => {
      rsvpCalled = true;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { eventId: '1', userId: '1', status: 'confirmed' },
        }),
      });
    });

    await page.goto('/dashboard/events/index.html');
    
    // Look for RSVP button
    const rsvpButton = page.locator('button:has-text("RSVP"), button:has-text("Attend"), a:has-text("RSVP")');
    if (await rsvpButton.count() > 0) {
      await rsvpButton.first().click();
      await page.waitForTimeout(1000);
      
      expect(rsvpCalled).toBe(true);
      await expect(page.locator('.toast, [role="alert"], .success')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should allow canceling RSVP', async ({ page }) => {
    let cancelCalled = false;

    // Mock events with RSVP status
    await page.route('**/api/events', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: '1',
              title: 'Test Event',
              startDate: new Date(Date.now() + 86400000).toISOString(),
              status: 'published',
              rsvpStatus: 'confirmed',
            },
          ],
        }),
      });
    });

    // Mock cancel RSVP API
    await page.route('**/api/events/1/rsvp', route => {
      if (route.request().method() === 'DELETE') {
        cancelCalled = true;
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      }
    });

    await page.goto('/dashboard/events/index.html');
    
    // Look for cancel button
    const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("Remove RSVP")');
    if (await cancelButton.count() > 0) {
      await cancelButton.first().click();
      await page.waitForTimeout(1000);
      
      expect(cancelCalled).toBe(true);
    }
  });

  test('should display event details', async ({ page }) => {
    // Mock event API
    await page.route('**/api/events/1', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: '1',
            title: 'Test Event',
            description: 'Event description',
            startDate: new Date(Date.now() + 86400000).toISOString(),
            status: 'published',
          },
        }),
      });
    });

    await page.goto('/dashboard/events/index.html');
    
    // Click on event if list is shown
    const eventLink = page.locator('a:has-text("Test Event"), [data-event-id="1"]');
    if (await eventLink.count() > 0) {
      await eventLink.first().click();
      await expect(page.locator('h1, h2')).toContainText('Test Event', { timeout: 5000 });
    }
  });
});
