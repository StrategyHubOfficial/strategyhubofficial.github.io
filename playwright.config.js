import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for end-to-end testing
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4000', // Jekyll default port
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  // Note: E2E tests require Jekyll server running
  // Start manually with: bundle exec jekyll serve --port 4000
  // Or install Jekyll: gem install bundler jekyll
  // webServer: {
  //   command: 'bundle exec jekyll serve --port 4000',
  //   url: 'http://localhost:4000',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000,
  // },
});

