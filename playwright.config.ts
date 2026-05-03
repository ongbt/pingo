import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

// Global setup to reset test environment before the suite runs
const globalSetup = require.resolve('./global-setup');

/**
 * Playwright configuration with increased reliability:
 * - Retries: 2 on CI, 1 locally to mitigate flaky network/backend delays.
 * - Global setup: clears Convex tables and ensures a clean state.
 */

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  globalSetup,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
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
  webServer: {
    command: 'pnpm exec convex dev --run-sh "pnpm run dev"',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000,
    env: {
      CONVEX_AGENT_MODE: 'anonymous',
    },
  },
});
