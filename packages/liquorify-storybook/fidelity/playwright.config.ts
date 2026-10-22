import { defineConfig } from '@playwright/test'

/**
 * Compares stories with the same components on Spree's running screens
 * (`compare.spec.ts`), captures those screens in each state a batch maps
 * (`screens.spec.ts`), and records how the server answers requests a role does
 * not allow (`refusals.spec.ts`). Start the screens first (see
 * compare.spec.ts). The comparison only opens them; the other two add their
 * own roles and teammates through the Admin API first.
 */
export default defineConfig({
  testDir: '.',
  testMatch: ['compare.spec.ts', 'screens.spec.ts', 'refusals.spec.ts'],
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
