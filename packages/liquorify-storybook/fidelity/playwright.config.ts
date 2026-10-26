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
 * test app (see each file). `shell.spec.ts` drives the five shell behaviours
 * step P6 tests, and `plugin.spec.ts` opens the dashboard built with the plugin
 * example, for step P3 (see each file). `json-drawer.spec.ts` reproduces B16,
 * the JSON drawer's reversed Expand all and Collapse all, on the running
 * screens. For step P2, `keys.spec.ts` creates API keys on the running
 * screens and uses them from outside the browser, `oauth.spec.ts` takes an
 * OAuth client registered there through consent, `webhooks.spec.ts`
 * delivers to a local receiver, `storefront-webhooks.spec.ts` delivers to the
 * storefront's receiver, `agent.spec.ts` connects an agent to the agent
 * server gem's test app, and `webhook-tracing.spec.ts` traces deliveries on
 * the tracing gem's test app (see each file). For step P7, `one-store-admin.spec.ts`,
 * `one-store-accounts.spec.ts` and `one-store-storefront.spec.ts` send requests
 * within one store as callers who may not make them, each beside an allowed
 * caller, and `one-store-checks.spec.ts` shows their judge (`one-store.ts`)
 * failing against a stand-in server (see each file).
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
    'shell.spec.ts',
    'plugin.spec.ts',
    'json-drawer.spec.ts',
    'keys.spec.ts',
    'oauth.spec.ts',
    'webhooks.spec.ts',
    'storefront-webhooks.spec.ts',
    'agent.spec.ts',
    'webhook-tracing.spec.ts',
    'one-store-admin.spec.ts',
    'one-store-accounts.spec.ts',
    'one-store-storefront.spec.ts',
    'one-store-checks.spec.ts',
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
