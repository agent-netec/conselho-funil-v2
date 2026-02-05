import { defineConfig } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'https://app-rho-flax-25.vercel.app';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  reporter: 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
