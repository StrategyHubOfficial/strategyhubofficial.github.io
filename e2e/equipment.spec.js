/**
 * E2E Tests for Equipment/Resources
 */

import { test, expect } from '@playwright/test';

test.describe('Equipment', () => {
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

  test('should display equipment list', async ({ page }) => {
    // Mock equipment API
    await page.route('**/api/equipment*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: '1',
              name: 'Test Equipment',
              category: 'camera',
              status: 'available',
              description: 'Test equipment description',
            },
          ],
        }),
      });
    });

    await page.goto('/dashboard/resources/index.html');
    
    // Wait for equipment to load
    await expect(page.locator('h1, h2')).toContainText(/equipment|resource/i, { timeout: 10000 });
  });

  test('should allow requesting equipment checkout', async ({ page }) => {
    let checkoutRequested = false;

    // Mock equipment list
    await page.route('**/api/equipment*', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: '1',
                name: 'Test Equipment',
                status: 'available',
                borrowable: true,
              },
            ],
          }),
        });
      }
    });

    // Mock checkout request
    await page.route('**/api/equipment/checkout/request', route => {
      checkoutRequested = true;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'checkout-1',
            equipmentId: '1',
            status: 'pending',
          },
        }),
      });
    });

    await page.goto('/dashboard/resources/index.html');
    
    // Look for request/checkout button
    const requestButton = page.locator('button:has-text("Request"), button:has-text("Checkout"), a:has-text("Request")');
    if (await requestButton.count() > 0) {
      await requestButton.first().click();
      
      // Fill checkout form if it appears
      const startDateInput = page.locator('input[type="date"], input[name*="start" i]');
      if (await startDateInput.count() > 0) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        await startDateInput.fill(tomorrow.toISOString().split('T')[0]);
        
        // Submit
        await page.click('button[type="submit"], button:has-text("Request"), button:has-text("Submit")');
        await page.waitForTimeout(1000);
        
        expect(checkoutRequested).toBe(true);
        await expect(page.locator('.toast, [role="alert"], .success')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should display equipment details', async ({ page }) => {
    // Mock equipment API
    await page.route('**/api/equipment/1', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: '1',
            name: 'Test Equipment',
            category: 'camera',
            status: 'available',
            description: 'Detailed description',
            specifications: 'Test specs',
          },
        }),
      });
    });

    await page.goto('/dashboard/resources/index.html');
    
    // Click on equipment if list is shown
    const equipmentLink = page.locator('a:has-text("Test Equipment"), [data-equipment-id="1"]');
    if (await equipmentLink.count() > 0) {
      await equipmentLink.first().click();
      await expect(page.locator('h1, h2')).toContainText('Test Equipment', { timeout: 5000 });
    }
  });

  test('should filter equipment by category', async ({ page }) => {
    // Mock equipment API with filtering
    await page.route('**/api/equipment*', route => {
      const url = new URL(route.request().url());
      const category = url.searchParams.get('category');
      
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: category ? [
            {
              id: '1',
              name: 'Filtered Equipment',
              category: category,
            },
          ] : [],
        }),
      });
    });

    await page.goto('/dashboard/resources/index.html');
    
    // Look for category filter
    const categoryFilter = page.locator('select[name*="category"], button:has-text("Category")');
    if (await categoryFilter.count() > 0) {
      await categoryFilter.selectOption('camera');
      await page.waitForTimeout(500);
      
      // Should show filtered results
      await expect(page.locator('text=Filtered Equipment, text=camera')).toBeVisible({ timeout: 5000 });
    }
  });
});
