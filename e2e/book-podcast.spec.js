/**
 * E2E: unlisted podcast guest booking page (no auth).
 */
import { test, expect } from '@playwright/test';

test.describe('Book podcast guest (public)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/podcast-shows/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            slug: 'bitcoin-district',
            displayName: 'Bitcoin District',
            heroBlurb: 'Test show blurb.',
            defaultSlotMinutes: 60,
          },
        }),
      });
    });
    await page.route('**/api/studio/schedule/check**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { slotOpen: true, conflicts: [] },
        }),
      });
    });
    await page.route('**/api/studio/podcast-guest-config', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { turnstileSiteKey: null, turnstileEnabled: false },
        }),
      });
    });
    await page.route('**/api/studio/podcast-guest-requests', (route) => {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { requestId: 'test-req', createdAt: new Date().toISOString() } }),
      });
    });
  });

  test('has noindex and main form fields', async ({ page }) => {
    await page.goto('/book-podcast/?podcast=bitcoin-district');
    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(robots).toMatch(/noindex/i);

    await expect(page.locator('#show-title')).toContainText('Bitcoin District');
    await expect(page.locator('#guest-email')).toBeVisible();
    await expect(page.locator('#guest-message')).toBeVisible();
    await expect(page.locator('#start-time')).toBeVisible();
    await expect(page.locator('#end-time')).toBeVisible();
  });

  test('submit sends POST with podcast slug', async ({ page }) => {
    let posted;
    await page.route('**/api/studio/podcast-guest-requests', async (route) => {
      posted = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { requestId: 'e2e-1', createdAt: new Date().toISOString() },
        }),
      });
    });

    await page.goto('/book-podcast/?podcast=bitcoin-district');
    await page.waitForSelector('#guest-form');

    await page.evaluate(() => {
      document.getElementById('guest-email').value = 'guest@example.com';
      document.getElementById('guest-message').value = 'E2E test message about the episode.';
      document.getElementById('start-time').value = '2099-01-15 14:00';
      document.getElementById('end-time').value = '2099-01-15 15:00';
    });

    await page.locator('#guest-form').evaluate((el) => el.requestSubmit());

    await expect(page.locator('#guest-status')).toContainText(/Request sent/i, { timeout: 10000 });
    expect(posted.podcastSlug).toBe('bitcoin-district');
    expect(posted.guestEmail).toBe('guest@example.com');
    expect(posted.message).toContain('E2E test');
  });

  test('pretty path redirects toward booking query', async ({ page }) => {
    await page.goto('/book-podcast/bitcoin-district/', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/podcast=bitcoin-district/, { timeout: 8000 });
    expect(page.url()).toContain('book-podcast');
  });
});
