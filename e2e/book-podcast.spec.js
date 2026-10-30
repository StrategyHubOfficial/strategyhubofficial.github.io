/**
 * E2E: unlisted podcast guest booking page (no auth).
 */
import { test, expect } from '@playwright/test';
import fs from 'fs';

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
          data: { turnstileSiteKey: null, turnstileEnabled: false, emailEnabled: false },
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
    await expect(page.locator('#guest-name')).toBeVisible();
    await expect(page.locator('#guest-message')).toBeVisible();
    await expect(page.locator('#guest-email-note')).toContainText(/save the time from this page/i);
    await expect(page.getByText('Direct link only')).toHaveCount(0);
    await expect(page.locator('input[placeholder="Tuesday–Thursday"]:visible')).toBeVisible();
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
          data: {
            requestId: 'e2e-1',
            createdAt: new Date().toISOString(),
            calendarFiles: [
              { filename: 'calendar.ics', content: 'BEGIN:VCALENDAR\r\nMETHOD:PUBLISH\r\nEND:VCALENDAR' },
              { filename: 'invite.ics', content: 'BEGIN:VCALENDAR\r\nMETHOD:REQUEST\r\nEND:VCALENDAR' },
            ],
          },
        }),
      });
    });

    await page.goto('/book-podcast/?podcast=bitcoin-district');
    await page.waitForSelector('#guest-form');
    await page.waitForFunction(
      () => {
        const el = document.getElementById('booking-date');
        return el && el._flatpickr;
      },
      null,
      { timeout: 15000 }
    );

    await page.evaluate(() => {
      document.getElementById('guest-email').value = 'guest@example.com';
      document.getElementById('guest-name').value = 'Ada Guest';
      document.getElementById('guest-message').value = 'E2E test message about the episode.';
      document.getElementById('booking-date')._flatpickr.setDate('2099-06-09', true);
    });

    await page.waitForSelector('.time-slot-btn:not([disabled])', { timeout: 15000 });
    await page.locator('.time-slot-btn:not([disabled])').first().click();
    await expect(page.locator('#selected-slot')).toContainText(/Selected:.*2099/i);
    await expect(page.locator('#selected-slot')).toContainText(/AM|PM/);

    await page.locator('#guest-form').evaluate((el) => el.requestSubmit());

    await expect(page.locator('#guest-status')).toContainText(/host still has to confirm/i, { timeout: 10000 });
    await expect(page.locator('#guest-calendar-downloads')).toContainText(/Save these before you leave this page/i);
    await expect(page.getByRole('link', { name: /Add to your calendar/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Download the invite/i })).toBeVisible();
    await expect(page.locator('#guest-calendar-downloads a[download="calendar.ics"]')).toBeVisible();
    await expect(page.locator('#guest-calendar-downloads a[download="invite.ics"]')).toBeVisible();
    const calendarDownload = page.waitForEvent('download');
    await page.locator('#guest-calendar-downloads a[download="calendar.ics"]').click();
    const calendarFile = await calendarDownload;
    expect(calendarFile.suggestedFilename()).toBe('calendar.ics');
    const savedPath = await calendarFile.path();
    expect(fs.readFileSync(savedPath, 'utf8')).toContain('METHOD:PUBLISH');
    await expect(page.locator('#guest-form-wrap')).toBeHidden();
    expect(posted.podcastSlug).toBe('bitcoin-district');
    expect(posted.guestEmail).toBe('guest@example.com');
    expect(posted.guestName).toBe('Ada Guest');
    expect(posted.description).toContain('E2E test');
    expect(posted.message).toContain('E2E test');
    expect(posted.startTime).toBeTruthy();
    expect(posted.endTime).toBeTruthy();
    expect(posted.startTime).toMatch(/^2099-06-09T/);
  });

  test('pretty path redirects toward booking query', async ({ page }) => {
    await page.goto('/book-podcast/bitcoin-district/', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/podcast=bitcoin-district/, { timeout: 8000 });
    expect(page.url()).toContain('book-podcast');
  });
});
