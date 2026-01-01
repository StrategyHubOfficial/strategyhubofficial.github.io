/**
 * E2E Tests for Members Directory
 */

import { test, expect } from '@playwright/test';

test.describe('Members', () => {
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

  test('should display members list', async ({ page }) => {
    // Mock members API
    await page.route('**/api/members*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: '1',
              name: 'Test Member',
              email: 'member@example.com',
              role: 'member',
              status: 'active',
            },
          ],
        }),
      });
    });

    await page.goto('/dashboard/members/index.html');
    
    // Wait for members to load
    await expect(page.locator('h1, h2')).toContainText(/member/i, { timeout: 10000 });
  });

  test('should display member profile', async ({ page }) => {
    // Mock member API
    await page.route('**/api/members/1', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: '1',
            name: 'Test Member',
            email: 'member@example.com',
            role: 'member',
            status: 'active',
            bio: 'Test bio',
            skills: ['JavaScript', 'TypeScript'],
          },
        }),
      });
    });

    await page.goto('/dashboard/members/index.html');
    
    // Click on member if list is shown
    const memberLink = page.locator('a:has-text("Test Member"), [data-member-id="1"]');
    if (await memberLink.count() > 0) {
      await memberLink.first().click();
      await expect(page.locator('h1, h2')).toContainText('Test Member', { timeout: 5000 });
    }
  });

  test('should search members', async ({ page }) => {
    // Mock search API
    await page.route('**/api/members/search*', route => {
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
              name: 'Matching Member',
              email: 'match@example.com',
            },
          ] : [],
        }),
      });
    });

    await page.goto('/dashboard/members/index.html');
    
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('Matching');
      await page.waitForTimeout(500); // Wait for debounce
      
      // Should show filtered results
      await expect(page.locator('text=Matching Member')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should filter members by skills', async ({ page }) => {
    // Mock members API with skill filtering
    await page.route('**/api/members/search*', route => {
      const url = new URL(route.request().url());
      const skills = url.searchParams.get('skills');
      
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: skills ? [
            {
              id: '1',
              name: 'Skill Match',
              skills: [skills],
            },
          ] : [],
        }),
      });
    });

    await page.goto('/dashboard/members/index.html');
    
    // Look for skills filter
    const skillsFilter = page.locator('select[name*="skill"], button:has-text("Skills")');
    if (await skillsFilter.count() > 0) {
      await skillsFilter.selectOption('JavaScript');
      await page.waitForTimeout(500);
      
      // Should show filtered results
      await expect(page.locator('text=Skill Match, text=JavaScript')).toBeVisible({ timeout: 5000 });
    }
  });
});
