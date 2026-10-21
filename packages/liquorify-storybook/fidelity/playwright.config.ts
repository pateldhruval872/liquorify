import { defineConfig } from '@playwright/test'

/**
 * Compares the pilot's stories with the same components on Spree's running
 * screens. Start the screens first (see compare.spec.ts); this run only opens
 * them, so it does not change what they show.
 */
export default defineConfig({
  testDir: '.',
  testMatch: 'compare.spec.ts',
  outputDir: './results/test-output',
  workers: 1,
  timeout: 180_000,
  reporter: 'list',
  use: {
    browserName: 'chromium',
    baseURL: 'http://localhost:5174',
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    locale: 'en-US',
    timezoneId: 'UTC',
    reducedMotion: 'reduce',
  },
})
