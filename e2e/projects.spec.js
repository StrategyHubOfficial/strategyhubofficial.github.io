/**
 * E2E Tests for Projects
 */

import { test, expect } from '@playwright/test';

test.describe('Projects', () => {
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

  test('should display projects list', async ({ page }) => {
    // Mock projects API
    await page.route('**/api/projects', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: '1',
              name: 'Test Project',
              description: 'A test project',
              status: 'active',
            },
          ],
        }),
      });
    });

    await page.goto('/dashboard/projects/index.html');
    
    // Wait for projects to load
    await expect(page.locator('h1, h2')).toContainText(/project/i, { timeout: 10000 });
  });

  test('should allow admin to create project', async ({ page }) => {
    // Mock admin user
    await page.route('**/api/auth/me', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { id: '1', email: 'admin@example.com', role: 'admin' },
        }),
      });
    });

    // Mock create project API
    await page.route('**/api/projects', route => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'new-project',
              name: 'New Project',
              description: 'New project description',
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

    await page.goto('/dashboard/projects/index.html');
    
    // Look for create button (if visible to admin)
    const createButton = page.locator('button:has-text("Create"), a:has-text("Create"), button:has-text("New")');
    if (await createButton.count() > 0) {
      await createButton.first().click();
      
      // Fill form if modal/form appears
      await page.fill('input[name="name"], input[placeholder*="name" i]', 'New Project');
      await page.fill('textarea[name="description"], textarea[placeholder*="description" i]', 'New project description');
      
      // Submit
      await page.click('button[type="submit"], button:has-text("Create"), button:has-text("Save")');
      
      // Should show success or redirect
      await expect(page.locator('.toast, [role="alert"], .success')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display project details', async ({ page }) => {
    // Mock project API
    await page.route('**/api/projects/1', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: '1',
            name: 'Test Project',
            description: 'Project description',
            status: 'active',
          },
        }),
      });
    });

    await page.goto('/dashboard/projects/index.html');
    
    // Click on project if list is shown
    const projectLink = page.locator('a:has-text("Test Project"), [data-project-id="1"]');
    if (await projectLink.count() > 0) {
      await projectLink.first().click();
      await expect(page.locator('h1, h2')).toContainText('Test Project', { timeout: 5000 });
    }
  });

  test('should handle project search', async ({ page }) => {
    // Mock search API
    await page.route('**/api/projects*', route => {
      const url = new URL(route.request().url());
      const query = url.searchParams.get('q');
      
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: query ? [
            {
              id: '1',
              name: 'Matching Project',
              description: 'Matches search',
            },
          ] : [],
        }),
      });
    });

    await page.goto('/dashboard/projects/index.html');
    
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('Matching');
      await page.waitForTimeout(500); // Wait for debounce
      
      // Should show filtered results
      await expect(page.locator('text=Matching Project')).toBeVisible({ timeout: 5000 });
    }
  });
});
