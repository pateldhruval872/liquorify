import { defineConfig } from '@playwright/test'

/**
 * Compares stories with the same components on Spree's running screens
 * (`compare.spec.ts`), captures those screens in each state a batch maps
 * (`screens.spec.ts`), and records how the server answers requests a role does
 * not allow (`refusals.spec.ts`). Start the screens first (see
 * compare.spec.ts). The comparison only opens them; the other two add their
 * own roles and teammates through the Admin API first. `mail.spec.ts` follows
 * the staff emails' links, and runs only against a server started to write its
 * mail to a folder (see that file); `customer-mail.spec.ts` reads Spree's own
 * customer reset email on the emails gem's test app, which it starts itself. `kits.spec.ts` calls the Admin and Seller
 * kits' read methods against the server alone, and `records.spec.ts` writes and
 * reads external references and price history through the Admin kit.
 * `hosted.spec.ts` signs in to the dashboard and seller panel Spree serves at
 * `/dashboard` and `/sellers`, on the hosting gem's own test app, and
 * `tracing.spec.ts` collects the trace of a request from the tracing gem's own
 * test app (see each file).
 */
export default defineConfig({
  testDir: '.',
  testMatch: [
    'compare.spec.ts',
    'screens.spec.ts',
    'refusals.spec.ts',
    'mail.spec.ts',
    'customer-mail.spec.ts',
    'kits.spec.ts',
    'records.spec.ts',
    'hosted.spec.ts',
    'tracing.spec.ts',
  ],
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
