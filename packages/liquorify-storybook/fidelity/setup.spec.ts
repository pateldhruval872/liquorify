import { randomBytes } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { expect, type Page, request, test } from '@playwright/test'
import { FIRST_RUN_VITE_PORT } from '../../dashboard/e2e/first-run/global-setup'
import { FIRST_RUN_CREDENTIALS_FILE } from '../../dashboard/e2e/paths'
import {
  assertProvisioned,
  failures,
  type ProvisioningCheck,
  provisioningChecks,
  type Records,
  type Row,
} from './provisioning'

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
 * services give it (`provisioning.ts`): the comparison is written to
 * `results/provisioning/first-run.json`, and the test then fails if any
 * default is missing or wrong. A last test changes copies of the records it
 * read, to show the comparison refusing a missing default, a payment method
 * of the wrong type and a pickup that costs money
 * (`results/provisioning/refusals.json`).
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
let provisioned: { store: Row; records: Records } | null = null

const answers = {
  storeName: merchant.storeName,
  country: { name: country.name, code: country.code, currency: country.currency },
  locale: 'en',
}

/** Each change a refusal makes to a copy of the records, and the check it should fail. */
const refusals: {
  name: string
  change: string
  check: string
  status: ProvisioningCheck['status']
  apply: (records: Records) => void
}[] = [
  {
    name: 'missing default',
    change: "Removes the refund reason 'Return processing'",
    check: 'refund-reasons',
    status: 'missing',
    apply: (records) => {
      records.refundReasons = records.refundReasons.filter(
        (row) => row.name !== 'Return processing',
      )
    },
  },
  {
    name: 'wrong payment method type',
    change: "Gives the 'Store Credit' payment method the type 'check'",
    check: 'payment-methods',
    status: 'incorrect',
    apply: (records) => {
      for (const row of records.paymentMethods) {
        if (row.name === 'Store Credit') row.type = 'check'
      }
    },
  },
  {
    name: 'pickup above zero',
    change: "Prices 'Store Pickup' at 1.00",
    check: 'pickup',
    status: 'incorrect',
    apply: (records) => {
      for (const row of records.deliveryMethods) {
        if (row.fulfillment_provider === 'pickup') {
          const calculator = row.calculator as { preferences: { amount: string } }
          calculator.preferences.amount = '1.00'
        }
      }
    },
  },
]

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
        // The largest page the Admin API serves; a list longer than that would fail here.
        const list = async (path: string) => {
          const { data, meta } = (await read(
            `${path}${path.includes('?') ? '&' : '?'}limit=100`,
          )) as { data: Row[]; meta: { count: number } }
          expect(data.length, `every row of ${path}`).toBe(meta.count)
          return data
        }

        const store = (await read('store')) as Row
        const records: Records = {
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
          countries: await list('countries'),
        }
        provisioned = { store, records }
        const checks = provisioningChecks(store, records, answers)
        mkdirSync(`${results}provisioning/`, { recursive: true })
        writeFileSync(
          `${results}provisioning/first-run.json`,
          JSON.stringify(
            {
              revision,
              answers,
              summary: summary(checks),
              checks,
            },
            byName(records),
            2,
          ),
        )
        assertProvisioned(checks)
      } finally {
        await api.dispose()
      }
    })

    test('the provisioning check refuses a missing or wrong default', () => {
      expect(provisioned, 'the new store was read').not.toBeNull()
      const { store, records } = provisioned as { store: Row; records: Records }
      const cases = refusals.map((refusal) => {
        const copy = structuredClone(records)
        refusal.apply(copy)
        const checks = provisioningChecks(store, copy, answers)
        const failing = checks.filter((check) => check.status !== 'correct')
        let refusedWith = ''
        try {
          assertProvisioned(checks)
        } catch (error) {
          refusedWith = (error as Error).message
        }
        return { ...refusal, failing, refusedWith, summary: summary(checks) }
      })
      mkdirSync(`${results}provisioning/`, { recursive: true })
      writeFileSync(
        `${results}provisioning/refusals.json`,
        JSON.stringify(
          {
            revision,
            note: 'Each case changes a copy of the records read from the newly set-up store; the store itself is not changed.',
            cases: cases.map((item) => ({
              name: item.name,
              change: item.change,
              expectedToFail: item.check,
              summary: item.summary,
              failing: item.failing.map(({ id, status, problems }) => ({ id, status, problems })),
              refusedWith: item.refusedWith,
            })),
          },
          byName(records),
          2,
        ),
      )
      for (const item of cases) {
        expect(
          item.failing.map(({ id, status }) => ({ id, status })),
          item.name,
        ).toEqual([{ id: item.check, status: item.status }])
        expect(item.refusedWith, item.name).toContain(`${item.check} (${item.status})`)
      }
    })
  })

/**
 * Writes the profiles, zones and channels records point to by name, as
 * `<delivery profile "General">`, so a report says which record a link names.
 * The checks compare the ids themselves.
 */
function byName(records: Records) {
  const names = new Map<string, string>()
  for (const [kind, rows] of [
    ['delivery profile', records.deliveryProfiles],
    ['delivery zone', records.deliveryZones],
    ['channel', records.channels],
  ] as const) {
    for (const row of rows) names.set(row.id as string, `<${kind} "${row.name}">`)
  }
  return (_key: string, value: unknown) =>
    typeof value === 'string'
      ? [...names].reduce((text, [id, name]) => text.replaceAll(id, name), value)
      : value
}

const summary = (checks: ProvisioningCheck[]) => ({
  checks: checks.length,
  correct: checks.filter((check) => check.status === 'correct').length,
  failing: failures(checks),
})
