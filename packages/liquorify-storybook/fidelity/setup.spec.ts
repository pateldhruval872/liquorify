import { randomBytes } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { expect, type Page, request, test } from '@playwright/test'
import { FIRST_RUN_VITE_PORT } from '../../dashboard/e2e/first-run/global-setup'
import { FIRST_RUN_CREDENTIALS_FILE } from '../../dashboard/e2e/paths'

/**
 * First-run setup (DA-SETUP-01) and the sign-in page's pointer to it, captured
 * on the first-run browser test's own server, which starts with no admin
 * (`stack.spec.ts`, "Spree first-run server"), with the dashboard served on
 * its port. Completing setup closes it for good, so the states before it run
 * first, setup completes once, and the server is started afresh for the next
 * run. Setup runs without sample data (batch 3, §7).
 *
 * The setup link's token is read from the file the server's setup writes and
 * only ever opened, never written down; the merchant's password is made up for
 * the run and kept in memory. Once setup completes, the new store is read
 * through the Admin API and compared with what Spree's two provisioning
 * services give it, into `results/provisioning/first-run.json`.
 */

const results = new URL('./results/', import.meta.url).pathname
const revision = process.env.FIDELITY_REVISION ?? null

/** The setup link's path and query, read when a test needs it, so listing the tests needs no server. */
function setupPath() {
  const { setup_url: link } = JSON.parse(readFileSync(FIRST_RUN_CREDENTIALS_FILE, 'utf-8')) as {
    setup_url: string
  }
  const url = new URL(link)
  return `${url.pathname}${url.search}`
}

const wrongTokenPath = '/setup?token=not-the-token'

const merchant = {
  storeName: 'Fidelity First Run',
  firstName: 'Ada',
  lastName: 'Merchant',
  email: 'owner@example.com',
  password: randomBytes(12).toString('hex'),
}

const country = { name: 'Poland', code: 'PL', currency: 'PLN', language: 'Polish' }

test.use({
  baseURL: `http://localhost:${FIRST_RUN_VITE_PORT}`,
  viewport: { width: 1280, height: 960 },
})

/** Blocks every request that would leave the local servers, as the other captures do. */
async function blockOutside(page: Page) {
  const outside: string[] = []
  await page.context().route(
    (url) =>
      !['data:', 'blob:'].includes(url.protocol) &&
      !['localhost', '127.0.0.1'].includes(url.hostname),
    (route) => {
      outside.push(route.request().url())
      return route.abort()
    },
  )
  return outside
}

async function save(
  page: Page,
  capture: { screen: string; state: string; intercepted?: string },
  theme: 'light' | 'dark',
  outside: string[],
) {
  const folder = `${results}screens/${capture.screen}/${capture.state}/`
  mkdirSync(folder, { recursive: true })
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${folder}installer-${theme}.png` })
  writeFileSync(
    `${folder}installer-${theme}.json`,
    JSON.stringify(
      {
        screen: capture.screen,
        state: capture.state,
        variant: 'installer',
        role: null,
        theme,
        revision,
        // The path alone: the setup link's token is in its query.
        path: new URL(page.url()).pathname,
        viewport: page.viewportSize(),
        intercepted: capture.intercepted ?? null,
        masked: null,
        outside,
      },
      null,
      2,
    ),
  )
}

async function chooseCountry(page: Page) {
  await page.getByLabel('Country').click()
  await page.getByPlaceholder('Search countries').fill(country.name)
  await page.getByRole('option', { name: new RegExp(country.name) }).click()
  await expect(page.getByLabel('Currency')).toContainText(country.currency)
}

/**
 * Fills the form as a merchant in Poland who keeps the dashboard in English,
 * without sample data. `confirmation` differs from the password only to show
 * the form refusing it.
 */
async function fillForm(page: Page, confirmation = merchant.password) {
  await expect(page.getByRole('heading', { name: 'Set up Spree' })).toBeVisible()
  await page.getByLabel('Store name').fill(merchant.storeName)
  await chooseCountry(page)
  await page.getByLabel('Language').click()
  await page.getByRole('option', { name: 'English' }).click()
  await page.getByLabel('First name').fill(merchant.firstName)
  await page.getByLabel('Last name').fill(merchant.lastName)
  await page.getByLabel('Email').fill(merchant.email)
  await page.getByLabel('Password', { exact: true }).fill(merchant.password)
  await page.getByLabel('Confirm password').fill(confirmation)
  await page.getByRole('checkbox', { name: 'Load sample data' }).uncheck()
}

const failWith = (status: number) => (page: Page, pathname: string) =>
  page.route(
    (url) => url.pathname === pathname,
    (route) =>
      route.request().method() === 'GET'
        ? route.fulfill({
            status,
            json: {
              error: { code: status === 429 ? 'rate_limited' : 'internal_error', message: 'Error' },
            },
          })
        : route.fallback(),
  )

interface Capture {
  screen: string
  state: string
  intercepted?: string
  reach: (page: Page) => Promise<void>
}

const beforeSetup: Capture[] = [
  {
    screen: 'DA-AUTH-01',
    state: 'installation-not-set-up',
    reach: async (page) => {
      await page.goto('/login')
      await expect(page.getByText("This installation isn't set up yet")).toBeVisible()
    },
  },
  {
    screen: 'DA-SETUP-01',
    state: 'no-token',
    reach: async (page) => {
      await page.goto('/setup')
      await expect(page.getByRole('heading', { name: 'Setup link required' })).toBeVisible()
    },
  },
  {
    screen: 'DA-SETUP-01',
    state: 'form',
    reach: async (page) => {
      await page.goto(setupPath())
      await expect(page.getByRole('heading', { name: 'Set up Spree' })).toBeVisible()
      await expect(page.getByLabel('Country')).toBeEnabled()
    },
  },
  {
    screen: 'DA-SETUP-01',
    state: 'country-list',
    reach: async (page) => {
      await page.goto(setupPath())
      await page.getByLabel('Country').click()
      await page.getByPlaceholder('Search countries').fill('Pol')
      await expect(page.getByRole('option', { name: new RegExp(country.name) })).toBeVisible()
    },
  },
  {
    screen: 'DA-SETUP-01',
    state: 'country-chosen',
    reach: async (page) => {
      await page.goto(setupPath())
      await chooseCountry(page)
      await expect(page.getByLabel('Language')).toContainText(country.language)
    },
  },
  {
    screen: 'DA-SETUP-01',
    state: 'field-errors',
    reach: async (page) => {
      await page.goto(setupPath())
      await expect(page.getByRole('heading', { name: 'Set up Spree' })).toBeVisible()
      await page.getByRole('button', { name: 'Complete setup' }).click()
      await expect(page.locator('[aria-invalid="true"]').first()).toBeVisible()
    },
  },
  {
    screen: 'DA-SETUP-01',
    state: 'passwords-differ',
    reach: async (page) => {
      await page.goto(setupPath())
      await fillForm(page, `${merchant.password}x`)
      await page.getByRole('button', { name: 'Complete setup' }).click()
      await expect(page.getByLabel('Confirm password')).toHaveAttribute('aria-invalid', 'true')
    },
  },
  {
    screen: 'DA-SETUP-01',
    state: 'countries-failed',
    intercepted: 'The country list request is answered with a server error',
    reach: async (page) => {
      await failWith(500)(page, '/api/v3/admin/auth/setup/countries')
      await page.goto(setupPath())
      await expect(page.getByText("Couldn't load the list of countries.")).toBeVisible({
        timeout: 15_000,
      })
    },
  },
  {
    screen: 'DA-SETUP-01',
    state: 'status-failed',
    intercepted: 'The setup status request is answered with a server error',
    reach: async (page) => {
      await failWith(500)(page, '/api/v3/admin/auth/setup')
      await page.goto(setupPath())
      await expect(page.getByRole('heading', { name: "Couldn't check setup" })).toBeVisible({
        timeout: 15_000,
      })
    },
  },
  {
    screen: 'DA-SETUP-01',
    state: 'status-rate-limited',
    intercepted: 'The setup status request is answered as rate limited',
    reach: async (page) => {
      await failWith(429)(page, '/api/v3/admin/auth/setup')
      await page.goto(setupPath())
      await expect(page.getByRole('heading', { name: 'Too many attempts' })).toBeVisible({
        timeout: 15_000,
      })
    },
  },
  {
    screen: 'DA-SETUP-01',
    state: 'wrong-token',
    reach: async (page) => {
      await page.goto(wrongTokenPath)
      await fillForm(page)
      await page.getByRole('button', { name: 'Complete setup' }).click()
      await expect(
        page.getByText(
          'This installation is already set up. Sign in with your admin account instead.',
        ),
      ).toBeVisible()
    },
  },
  {
    screen: 'DA-SETUP-01',
    state: 'completing',
    intercepted: 'The setup request is held and never reaches the server',
    reach: async (page) => {
      await page.route(
        (url) => url.pathname === '/api/v3/admin/auth/setup',
        (route) => (route.request().method() === 'POST' ? undefined : route.fallback()),
      )
      await page.goto(setupPath())
      await fillForm(page)
      await page.getByRole('button', { name: 'Complete setup' }).click()
      await expect(page.getByRole('button', { name: 'Setting up…' })).toBeDisabled()
    },
  },
]

const afterSetup: Capture[] = [
  {
    screen: 'DA-SETUP-01',
    state: 'closed',
    reach: async (page) => {
      await page.goto(setupPath())
      await expect(page.getByRole('heading', { name: 'Setup is not available' })).toBeVisible()
    },
  },
  {
    screen: 'DA-AUTH-01',
    state: 'installation-set-up',
    reach: async (page) => {
      await page.goto('/login')
      await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
      await expect(page.getByText("This installation isn't set up yet")).toBeHidden()
    },
  },
]

const capture = (item: Capture, theme: 'light' | 'dark') =>
  test(`${item.screen} ${item.state} installer ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    const outside = await blockOutside(page)
    await item.reach(page)
    await save(page, item, theme, outside)
  })

let storeId = ''

test.describe
  .serial('first-run setup', () => {
    for (const theme of ['light', 'dark'] as const) {
      for (const item of beforeSetup) capture(item, theme)
    }

    // Once only: the welcome is captured in light, then the same page in dark.
    test('DA-SETUP-01 completed, and the welcome on getting started', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
      const outside = await blockOutside(page)
      await page.goto(setupPath())
      await fillForm(page)
      await page.getByRole('button', { name: 'Complete setup' }).click()
      await expect(page.getByText('Welcome, your store is now ready!')).toBeVisible({
        timeout: 20_000,
      })
      await expect(page.getByRole('heading', { name: 'Getting Started' })).toBeVisible()
      storeId = new URL(page.url()).pathname.split('/')[1]
      const welcome = { screen: 'DA-SETUP-01', state: 'welcome' }
      await save(page, welcome, 'light', outside)
      await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
      await expect(page.getByText('Welcome, your store is now ready!')).toBeVisible()
      await save(page, welcome, 'dark', outside)
    })

    for (const theme of ['light', 'dark'] as const) {
      for (const item of afterSetup) capture(item, theme)
    }

    test('what setup gave the new store', async ({ baseURL }) => {
      expect(storeId, 'setup completed').not.toBe('')
      const api = await request.newContext({ baseURL })
      try {
        const login = await api.post('/api/v3/admin/auth/login', {
          data: { email: merchant.email, password: merchant.password },
        })
        expect(login.ok(), `signing in: ${login.status()}`).toBeTruthy()
        const { token } = (await login.json()) as { token: string }
        const headers = { Authorization: `Bearer ${token}`, 'X-Spree-Store-Id': storeId }
        const read = async (path: string) => {
          const res = await api.get(`/api/v3/admin/${path}`, { headers })
          expect(res.ok(), `reading ${path}: ${res.status()}`).toBeTruthy()
          return (await res.json()) as Record<string, unknown>
        }
        const list = async (path: string) =>
          ((await read(`${path}${path.includes('?') ? '&' : '?'}limit=100`)) as { data: Row[] })
            .data

        const store = (await read('store')) as Row
        const records = {
          markets: await list('markets'),
          stockLocations: await list('stock_locations'),
          deliveryProfiles: await list('delivery_profiles'),
          deliveryZones: await list('delivery_zones?expand=members'),
          deliveryMethods: await list('delivery_methods?expand=calculator'),
          packageTypes: await list('package_types'),
          taxCategories: await list('tax_categories'),
          taxExemptionReasons: await list('tax_exemption_reasons'),
          channels: await list('channels'),
          roles: await list('roles'),
          paymentMethods: await list('payment_methods'),
          productTypes: await list('product_types'),
          customerGroups: await list('customer_groups'),
          returnReasons: await list('return_reasons'),
          claimReasons: await list('claim_reasons'),
          refundReasons: await list('refund_reasons'),
          cancellationReasons: await list('order_cancellation_reasons'),
          commissionRates: await list('commission_rates'),
          sellerRequirements: await list('seller_requirements'),
          apiKeys: await list('api_keys'),
          savedReports: await list('reporting/saved_reports'),
          allowedOrigins: await list('allowed_origins'),
        }
        const checks = provisioning(store, records)
        mkdirSync(`${results}provisioning/`, { recursive: true })
        writeFileSync(
          `${results}provisioning/first-run.json`,
          JSON.stringify({ revision, country, checks }, null, 2),
        )
      } finally {
        await api.dispose()
      }
    })
  })

type Row = Record<string, unknown>

interface Check {
  /** The service and step that should have given the store this. */
  source: string
  what: string
  status: 'present' | 'gap'
  /** What the store has, with no key, token or address. */
  found: unknown
}

const names = (rows: Row[]) => rows.map((row) => row.name)
const countriesOf = (zone: Row | undefined) =>
  ((zone?.members ?? []) as Row[])
    .filter((member) => member.member_type === 'country')
    .map((member) => member.country_code as string)
const amount = (method: Row | undefined) =>
  (method?.calculator as { preferences?: { amount?: string; currency?: string } } | undefined)
    ?.preferences

/**
 * Each default the two services give a new store, as `Spree::Seeds::StoreResources`
 * (run before setup) and `Spree::Stores::ProvisionDefaults` (run by setup, from
 * the merchant's country, currency and language) build it.
 */
function provisioning(store: Row, records: Record<string, Row[]>): Check[] {
  const check = (source: string, what: string, present: boolean, found: unknown): Check => ({
    source,
    what,
    status: present ? 'present' : 'gap',
    found,
  })
  const market = records.markets.find((row) => row.default)
  const location = records.stockLocations.find((row) => row.default)
  const zone = (name: string) => records.deliveryZones.find((row) => row.name === name)
  const method = (match: (row: Row) => boolean) => records.deliveryMethods.find(match)
  const standard = method((row) => row.name === 'Standard')
  const international = method((row) => row.name === 'International Shipping')
  const pickup = method((row) => row.fulfillment_provider === 'pickup')
  const digital = method((row) => row.digital === true)
  const packageType = records.packageTypes.find((row) => row.default)
  const metric = store.unit_system === 'metric'
  const provision = 'ProvisionDefaults'
  const seed = 'StoreResources'

  return [
    check(
      provision,
      "The store's country, currency and language",
      store.default_country_code === country.code &&
        store.default_currency === country.currency &&
        store.default_locale === 'en',
      {
        name: store.name,
        default_country_code: store.default_country_code,
        default_currency: store.default_currency,
        default_locale: store.default_locale,
      },
    ),
    check(provision, "The dashboard's language for the store", store.admin_locale === 'en', {
      admin_locale: store.admin_locale,
    }),
    check(
      provision,
      'The default market, named after the country, in its currency and the chosen language',
      market?.name === country.name &&
        market?.currency === country.currency &&
        market?.default_locale === 'en' &&
        JSON.stringify(market?.country_codes) === JSON.stringify([country.code]),
      market && {
        name: market.name,
        currency: market.currency,
        default_locale: market.default_locale,
        country_codes: market.country_codes,
      },
    ),
    check(
      provision,
      'The default stock location, in the country, active and open for pickup',
      location?.country_code === country.code &&
        location?.active === true &&
        location?.pickup_enabled === true,
      location && {
        name: location.name,
        country_code: location.country_code,
        active: location.active,
        pickup_enabled: location.pickup_enabled,
      },
    ),
    check(
      provision,
      'The default shipping profile',
      records.deliveryProfiles.some((row) => row.default && row.kind === 'shipping'),
      records.deliveryProfiles.map((row) => ({
        name: row.name,
        kind: row.kind,
        default: row.default,
      })),
    ),
    check(
      provision,
      'A domestic delivery zone for the country and an international one for everywhere else',
      JSON.stringify(countriesOf(zone('Domestic'))) === JSON.stringify([country.code]) &&
        countriesOf(zone('International')).length > 1 &&
        !countriesOf(zone('International')).includes(country.code),
      records.deliveryZones.map((row) => ({
        name: row.name,
        description: row.description,
        countries: row.name === 'Domestic' ? countriesOf(row) : countriesOf(row).length,
      })),
    ),
    check(
      provision,
      `Standard delivery at 5 and international at 20, in ${country.currency}`,
      amount(standard)?.amount === '5.00' &&
        amount(standard)?.currency === country.currency &&
        amount(international)?.amount === '20.00' &&
        amount(international)?.currency === country.currency,
      [standard, international].map((row) => row && { name: row.name, ...amount(row) }),
    ),
    check(
      provision,
      `Store pickup, free, in ${country.currency}, shown on the storefront`,
      amount(pickup)?.currency === country.currency && pickup?.storefront_visible === true,
      pickup && {
        name: pickup.name,
        storefront_visible: pickup.storefront_visible,
        ...amount(pickup),
      },
    ),
    check(
      provision,
      `The seeded digital delivery restated in ${country.currency}`,
      amount(digital)?.currency === country.currency,
      digital && { name: digital.name, ...amount(digital) },
    ),
    check(
      provision,
      `A default box, sized in the store's ${metric ? 'metric' : 'imperial'} units`,
      packageType?.kind === 'box' && packageType?.dimensions_unit === (metric ? 'cm' : 'in'),
      packageType && {
        name: packageType.name,
        kind: packageType.kind,
        length: packageType.length,
        width: packageType.width,
        height: packageType.height,
        dimensions_unit: packageType.dimensions_unit,
        weight: packageType.weight,
        weight_unit: packageType.weight_unit,
        unit_system: store.unit_system,
      },
    ),
    check(seed, 'Tax categories', records.taxCategories.length > 0, names(records.taxCategories)),
    check(
      seed,
      'Tax exemption reasons',
      records.taxExemptionReasons.length > 0,
      names(records.taxExemptionReasons),
    ),
    check(
      seed,
      'The wholesale channel',
      records.channels.some((row) => row.code === 'wholesale'),
      names(records.channels),
    ),
    check(seed, 'The admin role', records.roles.length > 0, names(records.roles)),
    check(seed, 'Digital delivery', digital !== undefined, digital?.name),
    check(
      seed,
      'Store credit as a payment method',
      records.paymentMethods.length > 0,
      records.paymentMethods.map((row) => ({ name: row.name, type: row.type })),
    ),
    check(seed, 'Product types', records.productTypes.length > 0, names(records.productTypes)),
    check(
      seed,
      'The wholesale customer group',
      records.customerGroups.length > 0,
      names(records.customerGroups),
    ),
    check(
      seed,
      'Return, claim and cancellation reasons',
      [records.returnReasons, records.claimReasons, records.cancellationReasons].every(
        (rows) => rows.length > 0,
      ),
      {
        return: records.returnReasons.length,
        claim: records.claimReasons.length,
        refund: records.refundReasons.length,
        cancellation: records.cancellationReasons.length,
      },
    ),
    check(
      seed,
      "The marketplace's catch-all commission rate",
      records.commissionRates.length > 0,
      records.commissionRates.map((row) => ({
        name: row.name,
        code: row.code,
        enabled: row.enabled,
      })),
    ),
    check(
      seed,
      'Seller requirements',
      records.sellerRequirements.length > 0,
      records.sellerRequirements.length,
    ),
    check(
      seed,
      'Publishable keys for the storefront and the wholesale channel',
      records.apiKeys.filter((row) => row.key_type === 'publishable').length >= 2,
      records.apiKeys.map((row) => ({ name: row.name, key_type: row.key_type })),
    ),
    check(seed, 'Saved reports', records.savedReports.length > 0, records.savedReports.length),
    // The seeded origin is a local address, so only the count is kept.
    check(
      seed,
      'An allowed origin',
      records.allowedOrigins.length > 0,
      records.allowedOrigins.length,
    ),
  ]
}
