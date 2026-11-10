import { defineConfig } from '@playwright/test'

/**
 * Compares stories with the same components on Spree's running screens
 * (`compare.spec.ts`), captures those screens in each state a batch maps
 * (`screens.spec.ts`), and records how the server answers requests a role does
 * not allow (`refusals.spec.ts`). Start the screens first (see
 * compare.spec.ts). The comparison only opens them; the other two add their
 * own roles and teammates through the Admin API first. `setup.spec.ts`
 * captures first-run setup on its own server, started apart from the others
 * (see that file). `mail.spec.ts` follows
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
 * failing against a stand-in server (see each file). For step P8,
 * `catalog-behaviours.spec.ts` drives the catalog behaviours that part 1 of the
 * catalog and pricing batch captured but no browser test drives (see that
 * file). For batch 5 part 1,
 * `fl-04-storefront.spec.ts` follows a product published in the dashboard to
 * the storefront, built against the same server (see that file). For part 2,
 * `fl-21.spec.ts` imports a product file and exports the catalog from the
 * product list, reading both staff emails, against a server started as for
 * `mail.spec.ts` (see that file). Batch 7's captures and comparison keep their
 * own files, `screens-batch-7.spec.ts` and `compare-batch-7.spec.ts`, as do
 * catalog part 3's, `screens-catalog-3.spec.ts` and `compare-catalog-3.spec.ts`,
 * and batch 6's (inventory), `screens-batch-6.spec.ts` and `compare-batch-6.spec.ts`;
 * batch 6's `g-78-stock-hold.spec.ts` holds stock in one storefront checkout and
 * sees a second refused it (see that file). For the multi-store administration batch, `multi-store.spec.ts` walks one teammate
 * with different roles in two stores through its states (see that file).
 * For step P9, `getting-started-tasks.spec.ts` drives Getting Started's store
 * address, storefront and payment method tasks, and `settings-actions.spec.ts`
 * the payment, delivery and tax actions batch 7 captured, against a server
 * started with `LIQUORIFY_TAX_ENGINE=1` (see each file and `p9.ts`).
 * `multi-store-actions.spec.ts` joins, works in and switches between two
 * stores as one teammate (see that file), and `catalog-actions.spec.ts` drives
 * the catalog actions catalog part 2 captured, and `loyalty-actions.spec.ts`
 * the promotion, gift card and store credit behaviours catalog part 3 captured
 * (see each file). Batch 8 (orders, returns and fulfilment) keeps its captures
 * and comparisons in `screens-batch-8.spec.ts` and `compare-batch-8.spec.ts`,
 * with `-part-2` files for part 2. Its settings checks are
 * `orders-settings.spec.ts` and `orders-settings-part-2.spec.ts`, its emails
 * are captured by `order-emails.spec.ts`, and `payment-link.spec.ts` and
 * `fl-06-storefront.spec.ts` follow an order to the storefront;
 * `sd-31-gift-card.spec.ts`, `sd-36-canceled-fulfilment.spec.ts` and
 * `digital-delivery.spec.ts` check single findings (see each file).
 * Batch 11 (home figures, reports and email templates) keeps its captures and
 * comparison in `screens-batch-11.spec.ts` and `compare-batch-11.spec.ts`,
 * which open the email templates on the emails gem's test app that
 * `emails-stack.spec.ts` holds open (its own config). `fl-22.spec.ts` builds
 * and exports a report and checks the home and report figures against the
 * orders, against a server started as for `mail.spec.ts`; `fl-18.spec.ts`
 * edits, publishes and reverts an email template and its settings on the
 * emails app, and `sf-dev-emails.spec.ts` captures the storefront's development
 * email previews (see each file).
 * `FIDELITY_BASE_URL` points the scripts at a dashboard served on another
 * port, beside a server started with `E2E_RAILS_PORT`.
 */
export default defineConfig({
  testDir: '.',
  testMatch: [
    'compare.spec.ts',
    'screens.spec.ts',
    'screens-batch-7.spec.ts',
    'compare-batch-7.spec.ts',
    'screens-batch-8.spec.ts',
    'compare-batch-8.spec.ts',
    'screens-batch-8-part-2.spec.ts',
    'compare-batch-8-part-2.spec.ts',
    'screens-batch-11.spec.ts',
    'compare-batch-11.spec.ts',
    'fl-22.spec.ts',
    'fl-18.spec.ts',
    'sf-dev-emails.spec.ts',
    'sd-31-gift-card.spec.ts',
    'sd-36-canceled-fulfilment.spec.ts',
    'payment-link.spec.ts',
    'orders-settings.spec.ts',
    'orders-settings-part-2.spec.ts',
    'fl-06-storefront.spec.ts',
    'order-emails.spec.ts',
    'digital-delivery.spec.ts',
    'screens-catalog-3.spec.ts',
    'compare-catalog-3.spec.ts',
    'screens-batch-6.spec.ts',
    'compare-batch-6.spec.ts',
    'g-78-stock-hold.spec.ts',
    'setup.spec.ts',
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
    'fl-04-storefront.spec.ts',
    'fl-21.spec.ts',
    'agent.spec.ts',
    'webhook-tracing.spec.ts',
    'one-store-admin.spec.ts',
    'one-store-accounts.spec.ts',
    'one-store-storefront.spec.ts',
    'one-store-checks.spec.ts',
    'p10-admin.spec.ts',
    'p10-shoppers.spec.ts',
    'p12-admin.spec.ts',
    'catalog-behaviours.spec.ts',
    'multi-store.spec.ts',
    'getting-started-tasks.spec.ts',
    'settings-actions.spec.ts',
    'multi-store-actions.spec.ts',
    'catalog-actions.spec.ts',
    'loyalty-actions.spec.ts',
    'inventory-actions.spec.ts',
    'order-actions.spec.ts',
  ],
  outputDir: './results/test-output',
  workers: 1,
  timeout: 180_000,
  reporter: 'list',
  use: {
    browserName: 'chromium',
    baseURL: process.env.FIDELITY_BASE_URL ?? 'http://localhost:5174',
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    locale: 'en-US',
    timezoneId: 'UTC',
    reducedMotion: 'reduce',
  },
})
