import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, type Locator, type Page, test } from '@playwright/test'
import { login, rowButton } from '../../dashboard/e2e/helpers'
import { paintOut } from './developers'
import {
  deliveryNames,
  ensurePaymentMethods,
  type PaymentsDelivery,
  packageNames,
  paymentNames,
  removeNamed,
  removePaymentMethods,
  removeSplitGroups,
  seedPaymentsDelivery,
  setPickup,
  taxNames,
} from './payments-delivery'
import { admin, openRowMenu, PASSWORD, roles, type Seeded, seed, teammates } from './staff'

/**
 * Captures batch 7's six screens (DA-SET-12, 13, 14, 16, 17 and 19) in each
 * state and permission variant the work item maps, and the two Getting
 * Started tasks that lead to them (FL-01), as `screens.spec.ts` captures the
 * earlier batches'. It gathers evidence for a person to review and passes
 * whenever it can capture a screen; it compares nothing.
 *
 * Start the screens as `compare.spec.ts` describes. Before the first capture
 * it adds the staff and roles (`staff.ts`) and the payment methods, taxes,
 * delivery records and package types (`payments-delivery.ts`) the states need;
 * running it again reuses them. A capture that needs the store without its
 * test gateway, or makes a record through the screen, puts the data back.
 *
 * Each capture is saved as `results/screens/<screen ID>/<state>/<variant>-<theme>.png`
 * with a `.json` that records how the state was reached. The test gateway's
 * secret setting is painted out of every capture that could show it.
 */

const results = new URL('./results/screens/', import.meta.url).pathname
const revision = process.env.FIDELITY_REVISION ?? null

type Variant = 'admin' | 'deliveryViewer' | 'deliveryEditor' | 'orderManager'

let seeded: Seeded
let baseURL: string
let records: PaymentsDelivery

interface Capture {
  screen: string
  state: string
  variant: Variant
  /** How the state was reached when the browser answered or held a request, for the record. */
  intercepted?: string
  /** A loading state: captured as soon as it shows, without waiting for skeletons to clear. */
  loading?: true
  /** Captured at a phone's width instead of the desktop's. */
  phone?: true
  reach: (page: Page) => Promise<void>
  masked?: { what: string; selector: string }
  /** Puts back what the capture changed, once it is saved. */
  after?: () => Promise<void>
}

const phone = { width: 390, height: 844 }

async function signIn(page: Page, variant: Variant) {
  if (variant === 'admin') {
    await login(page)
    return
  }
  const res = await page.request.post('/api/v3/admin/auth/login', {
    data: { email: teammates[variant].email, password: PASSWORD },
  })
  expect(res.ok(), await res.text()).toBeTruthy()
  await page.goto('/')
  await expect(page).toHaveURL(new RegExp(`/${seeded.storeId}`), { timeout: 15_000 })
}

async function openStore(page: Page, path: string) {
  await page.goto(`/${seeded.storeId}${path}`)
  await page.waitForLoadState('networkidle')
}

async function settle(page: Page) {
  try {
    await expect(page.locator('[data-slot="skeleton"]:visible')).toHaveCount(0, { timeout: 20_000 })
    return true
  } catch {
    return false
  }
}

const sheet = (page: Page) => page.getByRole('dialog')
const confirmation = (page: Page) => page.getByRole('alertdialog').or(page.getByRole('dialog'))

/** Holds every GET to an Admin API path open, so its screen stays loading. */
const holdList = (page: Page, path: string) =>
  page.route(
    (url) => url.pathname === `/api/v3/admin/${path}`,
    (route) => (route.request().method() === 'GET' ? new Promise(() => {}) : route.fallback()),
  )

/** The real answer to a list request, with its records taken out. */
const emptied = (page: Page, path: string) =>
  page.route(
    (url) => url.pathname === `/api/v3/admin/${path}`,
    async (route) => {
      if (route.request().method() !== 'GET') return route.fallback()
      const response = await route.fetch()
      const body = (await response.json()) as { meta?: Record<string, unknown> }
      await route.fulfill({
        response,
        json: {
          ...body,
          data: [],
          ...(body.meta && { meta: { ...body.meta, count: 0, pages: 1, from: 0, to: 0, in: 0 } }),
        },
      })
    },
  )

/** Scrolls an element to the middle of its scrolling area, for a state lower on a page. */
const toMiddle = (target: Locator) =>
  target.evaluate((element) => element.scrollIntoView({ block: 'center' }))

/** The nearest box around an element that also holds a button with this name. */
const around = (target: Locator, button: string) =>
  target.locator(`xpath=ancestor::*[.//button[contains(normalize-space(.), "${button}")]][1]`)

const optionIn = async (page: Page, field: Locator, option: string | RegExp) => {
  await field.click()
  await page.getByRole('option', { name: option }).first().click()
}

/** The select in a method form field, found by its visible label (as the browser tests do). */
const fieldSelect = (scope: Locator, label: string) =>
  scope
    .locator('[data-slot="field"]')
    .filter({ has: scope.page().getByText(label, { exact: true }) })
    .getByRole('combobox')

const directVisit = (screen: string, path: string): Capture => ({
  screen,
  state: 'direct-visit',
  variant: 'orderManager',
  reach: (page) => openStore(page, path),
})

// DA-SET-12 Payment methods

const paymentsPath = '/settings/payment-methods'
const secret = {
  what: "The test gateway's secret setting",
  selector: '#preference-dummy_secret_key',
}

const openPayments = async (page: Page) => {
  await openStore(page, paymentsPath)
  await expect(page.getByText('Store Credit').first()).toBeVisible({ timeout: 15_000 })
}

/** Opens the add sheet with the test gateway and cheque method gone, so it offers both. */
const openAddPayment = async (page: Page) => {
  await removePaymentMethods(baseURL)
  await openPayments(page)
  await page.getByRole('button', { name: /add payment method/i }).click()
  await expect(page.getByRole('heading', { name: /add payment method/i })).toBeVisible()
}

const chooseProvider = (page: Page, label: string) => optionIn(page, page.locator('#type'), label)

const putPaymentsBack = () => ensurePaymentMethods(baseURL)

const paymentCaptures: Capture[] = [
  ...(['admin', 'deliveryViewer'] as const).map(
    (variant): Capture => ({
      screen: 'DA-SET-12',
      state: 'listed',
      variant,
      reach: async (page) => {
        await ensurePaymentMethods(baseURL)
        await openPayments(page)
        await expect(rowButton(page, paymentNames.cheque)).toBeVisible()
      },
    }),
  ),
  {
    screen: 'DA-SET-12',
    state: 'loading',
    variant: 'admin',
    intercepted: 'The payment methods request is held open',
    loading: true,
    reach: async (page) => {
      await holdList(page, 'payment_methods')
      await page.goto(`/${seeded.storeId}${paymentsPath}`)
      await expect(page.locator('[data-slot="skeleton"]').first()).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-12',
    state: 'none',
    variant: 'admin',
    intercepted: 'The payment methods answer has its records taken out',
    reach: async (page) => {
      await emptied(page, 'payment_methods')
      await openStore(page, paymentsPath)
      await expect(page.getByText('No payment methods configured')).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-12',
    state: 'add-sheet-providers',
    variant: 'admin',
    reach: async (page) => {
      await openAddPayment(page)
      await page.locator('#type').click()
      await expect(page.getByRole('option', { name: 'Bogus' })).toBeVisible()
    },
    after: putPaymentsBack,
  },
  {
    screen: 'DA-SET-12',
    state: 'add-sheet-test-gateway',
    variant: 'admin',
    masked: secret,
    reach: async (page) => {
      await openAddPayment(page)
      await chooseProvider(page, 'Bogus')
      await expect(page.locator('#preference-dummy_secret_key')).toBeVisible()
    },
    after: putPaymentsBack,
  },
  {
    screen: 'DA-SET-12',
    state: 'add-sheet-cheque',
    variant: 'admin',
    reach: async (page) => {
      await openAddPayment(page)
      await chooseProvider(page, 'Check')
      await expect(page.locator('#name')).toBeVisible()
    },
    after: putPaymentsBack,
  },
  {
    screen: 'DA-SET-12',
    state: 'provider-changed',
    variant: 'admin',
    reach: async (page) => {
      await openAddPayment(page)
      await chooseProvider(page, 'Bogus')
      await page.locator('#preference-dummy_key').fill('FIDELITYPUBLIC')
      await chooseProvider(page, 'Check')
      await expect(page.getByText(/dummy key/i)).toHaveCount(0)
    },
    after: putPaymentsBack,
  },
  {
    screen: 'DA-SET-12',
    state: 'provider-required',
    variant: 'admin',
    reach: async (page) => {
      await openAddPayment(page)
      await page.locator('#name').fill('Fidelity unnamed provider')
      await page.getByRole('button', { name: /create payment method/i }).click()
      await expect(page.locator('#type')).toHaveAttribute('aria-invalid', 'true')
    },
    after: putPaymentsBack,
  },
  {
    // Spree takes a blank name and saves the method under its provider's
    // name, so the refusal shown is of a name the store already uses.
    screen: 'DA-SET-12',
    state: 'save-refused',
    variant: 'admin',
    reach: async (page) => {
      await openAddPayment(page)
      await chooseProvider(page, 'Check')
      await page.locator('#name').fill('Store Credit')
      await page.getByRole('button', { name: /create payment method/i }).click()
      await expect(page.locator('#name')).toHaveAttribute('aria-invalid', 'true', {
        timeout: 15_000,
      })
    },
    after: async () => {
      await removeNamed(baseURL, 'payment_methods', 'Store Credit ')
      await putPaymentsBack()
    },
  },
  ...(['admin', 'deliveryViewer'] as const).map(
    (variant): Capture => ({
      screen: 'DA-SET-12',
      state: 'edit-secret-kept',
      variant,
      masked: secret,
      reach: async (page) => {
        await ensurePaymentMethods(baseURL)
        await openPayments(page)
        await rowButton(page, paymentNames.gateway).click()
        await expect(page.locator('#preference-dummy_secret_key')).toHaveText(/^•+/, {
          timeout: 15_000,
        })
      },
    }),
  ),
  {
    screen: 'DA-SET-12',
    state: 'edit-inactive-admin-only',
    variant: 'admin',
    reach: async (page) => {
      await ensurePaymentMethods(baseURL)
      await openPayments(page)
      await rowButton(page, paymentNames.cheque).click()
      await expect(page.locator('#name')).toHaveValue(paymentNames.cheque, { timeout: 15_000 })
    },
  },
  {
    screen: 'DA-SET-12',
    state: 'delete-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await ensurePaymentMethods(baseURL)
      await openPayments(page)
      await openRowMenu(page, paymentNames.cheque)
      await page.getByRole('menuitem', { name: /^delete$/i }).click()
      await expect(page.getByRole('heading', { name: /delete payment method\?/i })).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-12',
    state: 'row-menu',
    variant: 'deliveryViewer',
    reach: async (page) => {
      await ensurePaymentMethods(baseURL)
      await openPayments(page)
      await openRowMenu(page, paymentNames.cheque)
      await expect(page.getByRole('menu')).toBeVisible()
    },
  },
  directVisit('DA-SET-12', paymentsPath),
]

// DA-SET-13 Tax categories and DA-SET-14 Tax rates, inside the taxes layout

const categoriesPath = '/settings/taxes/categories'
const ratesPath = '/settings/taxes/rates'

const openCategories = async (page: Page) => {
  await openStore(page, categoriesPath)
  await expect(rowButton(page, taxNames.category)).toBeVisible({ timeout: 15_000 })
}

const openRates = async (page: Page) => {
  await openStore(page, ratesPath)
  await expect(rowButton(page, taxNames.country)).toBeVisible({ timeout: 15_000 })
}

const openNewRate = async (page: Page) => {
  await openRates(page)
  await page.getByRole('button', { name: /add tax rate/i }).click()
  await expect(page.getByRole('heading', { name: /new tax rate/i })).toBeVisible()
}

const chooseCountry = async (page: Page, name: string) => {
  await page.getByRole('combobox', { name: /^country$/i }).click()
  await page.getByPlaceholder(/^search countries/i).fill(name)
  await page.getByRole('option', { name }).first().click()
}

/** The real answers, with one market, or every market, working out tax with an engine. */
const answerEngine = async (page: Page, everywhere: boolean) => {
  await page.route(
    (url) => url.pathname === '/api/v3/admin/tax_providers',
    async (route) => {
      const response = await route.fetch()
      const body = (await response.json()) as { data: object[] }
      await route.fulfill({
        response,
        json: {
          ...body,
          data: [
            ...body.data,
            { id: 'sample_engine', name: 'Sample tax engine', available: true, default: false },
          ],
        },
      })
    },
  )
  await page.route(
    (url) => url.pathname === '/api/v3/admin/markets',
    async (route) => {
      if (route.request().method() !== 'GET') return route.fallback()
      const response = await route.fetch()
      const body = (await response.json()) as { data: { currency: string }[] }
      await route.fulfill({
        response,
        json: {
          ...body,
          data: body.data.map((market) =>
            everywhere || market.currency === 'EUR'
              ? { ...market, tax_provider: 'sample_engine' }
              : market,
          ),
        },
      })
    },
  )
}

const taxCaptures: Capture[] = [
  ...(['admin', 'deliveryViewer'] as const).map(
    (variant): Capture => ({
      screen: 'DA-SET-13',
      state: 'listed',
      variant,
      reach: openCategories,
    }),
  ),
  {
    screen: 'DA-SET-13',
    state: 'none',
    variant: 'admin',
    intercepted: 'The tax categories answer has its records taken out',
    reach: async (page) => {
      await emptied(page, 'tax_categories')
      await openStore(page, categoriesPath)
      await expect(page.getByText('No tax categories yet')).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-13',
    state: 'create-sheet',
    variant: 'admin',
    reach: async (page) => {
      await openCategories(page)
      await page.getByRole('button', { name: /add tax category/i }).click()
      await expect(page.getByRole('heading', { name: /add tax category/i })).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-13',
    state: 'save-refused',
    variant: 'admin',
    reach: async (page) => {
      await openCategories(page)
      await page.getByRole('button', { name: /add tax category/i }).click()
      await page.locator('#name').fill('Default')
      await page.getByRole('button', { name: /create tax category/i }).click()
      await expect(page.locator('#name')).toHaveAttribute('aria-invalid', 'true', {
        timeout: 15_000,
      })
    },
    after: () => removeNamed(baseURL, 'tax_categories', 'Default '),
  },
  ...(['admin', 'deliveryViewer'] as const).map(
    (variant): Capture => ({
      screen: 'DA-SET-13',
      state: 'edit',
      variant,
      reach: async (page) => {
        await openCategories(page)
        await rowButton(page, taxNames.category).click()
        await expect(page.locator('#name')).toHaveValue(taxNames.category, { timeout: 15_000 })
      },
    }),
  ),
  {
    screen: 'DA-SET-13',
    state: 'delete-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await openCategories(page)
      await openRowMenu(page, taxNames.category)
      await page.getByRole('menuitem', { name: /^delete$/i }).click()
      await expect(page.getByRole('heading', { name: /delete tax category\?/i })).toBeVisible()
    },
  },
  directVisit('DA-SET-13', categoriesPath),

  ...(['admin', 'deliveryViewer'] as const).map(
    (variant): Capture => ({
      screen: 'DA-SET-14',
      state: 'listed',
      variant,
      reach: async (page) => {
        await openRates(page)
        await expect(page.getByText('4.375%')).toBeVisible()
      },
    }),
  ),
  {
    screen: 'DA-SET-14',
    state: 'none',
    variant: 'admin',
    intercepted: 'The tax rates answer has its records taken out',
    reach: async (page) => {
      await emptied(page, 'tax_rates')
      await openStore(page, ratesPath)
      await expect(page.getByText('No tax rates yet')).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-14',
    state: 'external-service-one-market',
    variant: 'admin',
    intercepted:
      "The tax providers answer adds an engine, and the markets answer puts the euro market on it; the browser-test server registers Spree's own rates only",
    reach: async (page) => {
      await answerEngine(page, false)
      await openRates(page)
      await expect(page.getByText(/These rates are not used in/)).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-14',
    state: 'external-service-every-market',
    variant: 'admin',
    intercepted:
      'The tax providers answer adds an engine, and the markets answer puts every market on it',
    reach: async (page) => {
      await answerEngine(page, true)
      await openRates(page)
      await expect(page.getByText(/None of your markets use these rates/)).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-14',
    state: 'category-required',
    variant: 'admin',
    reach: async (page) => {
      await openNewRate(page)
      await page.locator('#name').fill('Fidelity uncategorised')
      await page.getByRole('button', { name: /create tax rate/i }).click()
      await expect(page.locator('#tax_category_id')).toHaveAttribute('aria-invalid', 'true')
    },
  },
  {
    screen: 'DA-SET-14',
    state: 'create-for-a-country',
    variant: 'admin',
    reach: async (page) => {
      await openNewRate(page)
      await page.locator('#name').fill('Fidelity VAT')
      await page.locator('#rate_percent').fill('20')
      await optionIn(page, page.locator('#tax_category_id'), /^default$/i)
      await chooseCountry(page, 'Germany')
    },
  },
  {
    screen: 'DA-SET-14',
    state: 'create-for-a-state',
    variant: 'admin',
    reach: async (page) => {
      await openNewRate(page)
      await page.locator('#name').fill('Fidelity state tax')
      await page.locator('#rate_percent').fill('6.25')
      await optionIn(page, page.locator('#tax_category_id'), /^default$/i)
      await chooseCountry(page, 'United States')
      await page.getByRole('combobox', { name: /^state$/i }).click()
      await page
        .getByPlaceholder(/^search/i)
        .last()
        .fill('Texas')
      await page.getByRole('option', { name: 'Texas' }).first().click()
    },
  },
  {
    screen: 'DA-SET-14',
    state: 'fourth-decimal-refused',
    variant: 'admin',
    reach: async (page) => {
      await openNewRate(page)
      await page.locator('#name').fill('Fidelity overprecise')
      await page.locator('#rate_percent').fill('7.1255')
      await optionIn(page, page.locator('#tax_category_id'), /^default$/i)
      await page.getByRole('button', { name: /create tax rate/i }).click()
      await expect(page.getByText(/at most 3 decimal places/i)).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-14',
    state: 'blank-rate-refused',
    variant: 'admin',
    reach: async (page) => {
      await openNewRate(page)
      await page.locator('#name').fill('Fidelity blank rate')
      await optionIn(page, page.locator('#tax_category_id'), /^default$/i)
      await page.getByRole('button', { name: /create tax rate/i }).click()
      await expect(page.locator('#rate_percent')).toHaveAttribute('aria-invalid', 'true')
    },
  },
  ...(['admin', 'deliveryViewer'] as const).map(
    (variant): Capture => ({
      screen: 'DA-SET-14',
      state: 'edit-three-decimals',
      variant,
      reach: async (page) => {
        await openRates(page)
        await rowButton(page, taxNames.precise).click()
        await expect(page.locator('#rate_percent')).toHaveValue('4.375', { timeout: 15_000 })
      },
    }),
  ),
  {
    screen: 'DA-SET-14',
    state: 'delete-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await openRates(page)
      await openRowMenu(page, taxNames.state)
      await page.getByRole('menuitem', { name: /^delete$/i }).click()
      await expect(page.getByRole('heading', { name: /delete tax rate\?/i })).toBeVisible()
    },
  },
  directVisit('DA-SET-14', ratesPath),
]

// FL-01's payment method and taxes tasks on Getting Started (DA-HOME-02)

const openTask = async (page: Page, title: string) => {
  await openStore(page, '/getting-started')
  await expect(page.getByRole('heading', { name: 'Getting Started' })).toBeVisible()
  const task = page.getByRole('button', { name: title })
  if ((await task.getAttribute('aria-expanded')) !== 'true') await task.click()
  await expect(page.getByRole('region', { name: title })).toBeVisible()
}

const paymentTask = 'Set up payment methods'
const taxesTask = 'Set up taxes collection'

const taskCaptures: Capture[] = [
  {
    screen: 'DA-HOME-02',
    state: 'payment-task-not-done',
    variant: 'admin',
    reach: async (page) => {
      await removePaymentMethods(baseURL)
      await openTask(page, paymentTask)
    },
    after: putPaymentsBack,
  },
  {
    screen: 'DA-SET-12',
    state: 'from-payment-task',
    variant: 'admin',
    reach: async (page) => {
      await removePaymentMethods(baseURL)
      await openTask(page, paymentTask)
      await page.getByRole('region', { name: paymentTask }).getByRole('link').click()
      await expect(page).toHaveURL(new RegExp(`${paymentsPath}$`))
      await expect(page.getByRole('button', { name: /add payment method/i })).toBeVisible()
    },
    after: putPaymentsBack,
  },
  {
    screen: 'DA-HOME-02',
    state: 'payment-task-done',
    variant: 'admin',
    reach: async (page) => {
      await ensurePaymentMethods(baseURL)
      await openTask(page, paymentTask)
    },
  },
  {
    // ISO-6: the server counts every store's tax rates, so this shows the
    // task done for this store only, where the rates were added.
    screen: 'DA-HOME-02',
    state: 'taxes-task-done',
    variant: 'admin',
    reach: (page) => openTask(page, taxesTask),
  },
]

// DA-SET-16 Delivery profiles

const profilesPath = '/settings/delivery-profiles'

const openProfiles = async (page: Page) => {
  await openStore(page, profilesPath)
  await expect(page.getByText(deliveryNames.profile)).toBeVisible({ timeout: 15_000 })
}

const openNewProfile = async (page: Page) => {
  await openProfiles(page)
  await page.getByRole('button', { name: /add profile/i }).click()
  await expect(page.getByRole('heading', { name: /new delivery profile/i })).toBeVisible()
}

const profileListCaptures: Capture[] = [
  ...(['admin', 'deliveryViewer'] as const).map(
    (variant): Capture => ({
      screen: 'DA-SET-16',
      state: 'listed',
      variant,
      reach: openProfiles,
    }),
  ),
  {
    screen: 'DA-SET-16',
    state: 'create-sheet',
    variant: 'admin',
    reach: openNewProfile,
  },
  {
    screen: 'DA-SET-16',
    state: 'create-sheet-digital',
    variant: 'admin',
    reach: async (page) => {
      await openNewProfile(page)
      await page.locator('#name').fill('Fidelity downloads')
      await optionIn(page, fieldSelect(sheet(page), 'Kind'), /^digital$/i)
    },
  },
  directVisit('DA-SET-16', profilesPath),
]

// DA-SET-17 Delivery profile

const profilePath = (id: string) => `${profilesPath}/${id}`

const openProfile = async (page: Page, id: string, name: string) => {
  await openStore(page, profilePath(id))
  await expect(page.locator('h1', { hasText: name })).toBeVisible({ timeout: 15_000 })
}

const openHomeGoods = (page: Page) => openProfile(page, records.profileId, deliveryNames.profile)
const openGeneral = (page: Page) => openProfile(page, records.generalProfileId, 'General')

/** A zone's card, by the name in its title. */
const zoneBox = (page: Page, name: string) =>
  page.locator('[data-slot="card"]').filter({
    has: page.locator('[data-slot="card-title"]', { hasText: new RegExp(`^${name}$`) }),
  })
const methodRow = (page: Page, name: string) =>
  around(page.getByRole('button', { name, exact: true }), 'Open actions')

const openMethod = async (page: Page, name: string) => {
  await openHomeGoods(page)
  await page.getByRole('button', { name, exact: true }).click()
  await expect(page.getByRole('heading', { name: /edit delivery method/i })).toBeVisible({
    timeout: 15_000,
  })
  await expect(sheet(page).locator('#name')).toHaveValue(name, { timeout: 15_000 })
}

const temporaryGroup = 'Fidelity temporary group'

const profileVariants = ['admin', 'deliveryViewer', 'deliveryEditor'] as const

const profileCaptures: Capture[] = [
  ...profileVariants.map(
    (variant): Capture => ({
      screen: 'DA-SET-17',
      state: 'split-origins',
      variant,
      reach: async (page) => {
        await openHomeGoods(page)
        await expect(page.getByText(deliveryNames.splitGroup)).toBeVisible()
      },
    }),
  ),
  {
    screen: 'DA-SET-17',
    state: 'split-origins',
    variant: 'admin',
    phone: true,
    reach: async (page) => {
      await openHomeGoods(page)
      await expect(page.getByText(deliveryNames.domestic).first()).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-17',
    state: 'second-group',
    variant: 'admin',
    reach: async (page) => {
      await openHomeGoods(page)
      await toMiddle(page.getByText(deliveryNames.splitGroup, { exact: true }))
    },
  },
  {
    screen: 'DA-SET-17',
    state: 'second-group',
    variant: 'admin',
    phone: true,
    reach: async (page) => {
      await openHomeGoods(page)
      await toMiddle(page.getByText(deliveryNames.splitGroup, { exact: true }))
    },
  },
  ...(['admin', 'deliveryViewer'] as const).map(
    (variant): Capture => ({
      screen: 'DA-SET-17',
      state: 'no-zones',
      variant,
      reach: async (page) => {
        await openGeneral(page)
        await expect(page.getByText(/No zones yet/)).toBeVisible()
      },
    }),
  ),
  {
    screen: 'DA-SET-17',
    state: 'split-dialog',
    variant: 'admin',
    reach: async (page) => {
      await openGeneral(page)
      await page.getByRole('button', { name: /split shipping origins/i }).click()
      await expect(page.getByRole('heading', { name: /split shipping origins/i })).toBeVisible()
      await page.locator('#origin-group-name').fill('Fidelity second warehouse')
    },
  },
  {
    screen: 'DA-SET-17',
    state: 'group-delete-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await openHomeGoods(page)
      const group = page
        .getByText(deliveryNames.splitGroup, { exact: true })
        .locator('xpath=ancestor::section[1]')
      await group.getByRole('button', { name: 'Open actions' }).first().click()
      await page.getByRole('menuitem', { name: /delete/i }).click()
      await expect(confirmation(page).getByText(/Delete origin group/)).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-17',
    state: 'collapsed-back',
    variant: 'admin',
    reach: async (page) => {
      const { headers } = await admin(page.request)
      const created = await page.request.post(
        `/api/v3/admin/delivery_profiles/${records.generalProfileId}/origin_groups`,
        { headers, data: { name: temporaryGroup, stock_location_ids: [records.shopLocationId] } },
      )
      expect(created.status(), await created.text()).toBe(201)
      await openGeneral(page)
      const group = page
        .getByText(temporaryGroup, { exact: true })
        .locator('xpath=ancestor::section[1]')
      await group.getByRole('button', { name: 'Open actions' }).first().click()
      await page.getByRole('menuitem', { name: /delete/i }).click()
      await confirmation(page)
        .getByRole('button', { name: /^delete$/i })
        .click()
      await expect(page.getByText(temporaryGroup)).toHaveCount(0, { timeout: 15_000 })
    },
    after: () =>
      removeSplitGroups(baseURL, records.generalProfileId, [records.generalFirstGroupId]),
  },
  {
    screen: 'DA-SET-17',
    state: 'zone-sheet-new',
    variant: 'admin',
    reach: async (page) => {
      await openGeneral(page)
      await page
        .getByRole('button', { name: /add delivery zone/i })
        .first()
        .click()
      await expect(page.getByRole('heading', { name: /new delivery zone/i })).toBeVisible()
      await sheet(page).locator('#name').fill('Fidelity mountain states')
      await sheet(page)
        .getByPlaceholder(/search countries and regions/i)
        .fill('Colorado')
      await sheet(page)
        .getByRole('checkbox', { name: /colorado/i })
        .first()
        .check()
      await sheet(page)
        .getByPlaceholder(/search countries and regions/i)
        .fill('Utah')
      await sheet(page).getByRole('checkbox', { name: /utah/i }).first().check()
      await sheet(page)
        .getByPlaceholder(/search countries and regions/i)
        .fill('')
    },
  },
  ...(['admin', 'deliveryViewer'] as const).map(
    (variant): Capture => ({
      screen: 'DA-SET-17',
      state: 'zone-sheet-states-and-postal-codes',
      variant,
      reach: async (page) => {
        await openHomeGoods(page)
        await zoneBox(page, deliveryNames.westCoast)
          .getByRole('button', { name: 'Open actions' })
          .first()
          .click()
        await page.getByRole('menuitem', { name: /^(edit|view)$/i }).click()
        await expect(sheet(page).locator('#name')).toHaveValue(deliveryNames.westCoast, {
          timeout: 15_000,
        })
      },
    }),
  ),
  {
    screen: 'DA-SET-17',
    state: 'zone-delete-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await openHomeGoods(page)
      await zoneBox(page, deliveryNames.germany)
        .getByRole('button', { name: 'Open actions' })
        .first()
        .click()
      await page.getByRole('menuitem', { name: /^delete$/i }).click()
      await expect(confirmation(page).getByText(/Delete delivery zone/)).toBeVisible()
    },
  },
  ...(['admin', 'deliveryViewer', 'deliveryEditor'] as const).map(
    (variant): Capture => ({
      screen: 'DA-SET-17',
      state: 'method-flat-rate-per-currency',
      variant,
      reach: (page) => openMethod(page, deliveryNames.standard),
    }),
  ),
  {
    screen: 'DA-SET-17',
    state: 'method-conditions',
    variant: 'admin',
    reach: async (page) => {
      await openMethod(page, deliveryNames.express)
      await toMiddle(sheet(page).getByRole('button', { name: /^add condition$/i }))
    },
  },
  {
    screen: 'DA-SET-17',
    state: 'calculator-changed',
    variant: 'admin',
    reach: async (page) => {
      await openMethod(page, deliveryNames.standard)
      await optionIn(page, sheet(page).locator('#calculator-type'), /^flexi rate$/i)
      await expect(sheet(page).locator('#preference-first_item')).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-17',
    state: 'method-freight-markup',
    variant: 'admin',
    reach: async (page) => {
      await openMethod(page, deliveryNames.freight)
      await expect(sheet(page).locator('#markup_percent')).toHaveValue('7.5')
    },
  },
  {
    screen: 'DA-SET-17',
    state: 'method-sheet-from-its-address',
    variant: 'admin',
    reach: async (page) => {
      await openStore(
        page,
        `${profilePath(records.profileId)}/methods/${records.methodIds.express}`,
      )
      await expect(sheet(page).locator('#name')).toHaveValue(deliveryNames.express, {
        timeout: 15_000,
      })
    },
  },
  {
    screen: 'DA-SET-17',
    state: 'new-method-in-a-zone',
    variant: 'admin',
    reach: async (page) => {
      await openHomeGoods(page)
      await zoneBox(page, deliveryNames.germany).getByRole('button', { name: 'Add method' }).click()
      await expect(page.getByRole('heading', { name: /new delivery method/i })).toBeVisible({
        timeout: 15_000,
      })
    },
  },
  {
    screen: 'DA-SET-17',
    state: 'method-delete-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await openHomeGoods(page)
      await methodRow(page, deliveryNames.germanyTracked)
        .getByRole('button', { name: 'Open actions' })
        .click()
      await page.getByRole('menuitem', { name: /^delete$/i }).click()
      await expect(confirmation(page).getByText(/Delete delivery method/)).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-17',
    state: 'pickup-not-offered',
    variant: 'admin',
    reach: async (page) => {
      await openGeneral(page)
      await toMiddle(page.getByText(/customers cannot collect orders/i))
    },
  },
  {
    screen: 'DA-SET-17',
    state: 'pickup-sheet-from-a-fresh-profile',
    variant: 'admin',
    reach: async (page) => {
      await openGeneral(page)
      await page.getByRole('button', { name: /offer pickup/i }).click()
      await expect(sheet(page).getByText(/collection locations/i)).toBeVisible({
        timeout: 15_000,
      })
    },
  },
  ...(['admin', 'deliveryViewer'] as const).map(
    (variant): Capture => ({
      screen: 'DA-SET-17',
      state: 'pickup-offered',
      variant,
      reach: async (page) => {
        await setPickup(baseURL, records.shopLocationId, true)
        await openHomeGoods(page)
        await toMiddle(page.getByText(deliveryNames.pickup, { exact: true }).first())
      },
      after: () => setPickup(baseURL, records.shopLocationId, false),
    }),
  ),
  {
    screen: 'DA-SET-17',
    state: 'digital-profile',
    variant: 'admin',
    reach: (page) => openProfile(page, records.digitalProfileId, 'Digital'),
  },
  {
    screen: 'DA-SET-17',
    state: 'digital-method',
    variant: 'admin',
    reach: async (page) => {
      await openProfile(page, records.digitalProfileId, 'Digital')
      await page.getByRole('button', { name: 'Digital Delivery', exact: true }).click()
      await expect(fieldSelect(sheet(page), 'Fulfillment provider')).toContainText(/digital/i, {
        timeout: 15_000,
      })
    },
  },
  {
    screen: 'DA-SET-17',
    state: 'load-failed',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, profilePath('fp_doesnotexist'))
      await expect(page.getByText('Could not load this shipping profile')).toBeVisible({
        timeout: 20_000,
      })
    },
  },
  directVisit('DA-SET-17', profilePath('<profile>')),
]

// DA-SET-19 Package types

const packageTypesPath = '/settings/package-types'

const openPackageTypes = async (page: Page) => {
  await openStore(page, packageTypesPath)
  await expect(rowButton(page, packageNames.carton)).toBeVisible({ timeout: 15_000 })
}

const packageCaptures: Capture[] = [
  ...profileVariants.map(
    (variant): Capture => ({
      screen: 'DA-SET-19',
      state: 'listed',
      variant,
      reach: openPackageTypes,
    }),
  ),
  {
    screen: 'DA-SET-19',
    state: 'none',
    variant: 'admin',
    intercepted: 'The package types answer has its records taken out',
    reach: async (page) => {
      await emptied(page, 'package_types')
      await openStore(page, packageTypesPath)
      await expect(page.getByText(/No packaging yet/)).toBeVisible()
    },
  },
  {
    screen: 'DA-SET-19',
    state: 'add-sheet',
    variant: 'admin',
    reach: async (page) => {
      await openPackageTypes(page)
      await page.getByRole('button', { name: /add package type/i }).click()
      await expect(page.locator('#package-type-name')).toBeVisible()
    },
  },
  ...(['admin', 'deliveryViewer', 'deliveryEditor'] as const).map(
    (variant): Capture => ({
      screen: 'DA-SET-19',
      state: 'edit',
      variant,
      reach: async (page) => {
        await openPackageTypes(page)
        await rowButton(page, packageNames.carton).click()
        await expect(page.locator('#package-type-name')).toHaveValue(packageNames.carton, {
          timeout: 15_000,
        })
      },
    }),
  ),
  {
    screen: 'DA-SET-19',
    state: 'delete-confirmation',
    variant: 'admin',
    reach: async (page) => {
      await openPackageTypes(page)
      await openRowMenu(page, packageNames.pallet)
      await page.getByRole('menuitem', { name: /^delete$/i }).click()
      await expect(page.getByRole('heading', { name: /delete package type\?/i })).toBeVisible()
    },
  },
  directVisit('DA-SET-19', packageTypesPath),
]

test.beforeAll(async ({ baseURL: configured }) => {
  baseURL = configured ?? 'http://localhost:5174'
  seeded = await seed(baseURL)
  records = await seedPaymentsDelivery(baseURL)
  // The direct visit to a profile opens the seeded one.
  for (const item of profileCaptures) {
    if (item.state === 'direct-visit') {
      item.reach = (page) => openStore(page, profilePath(records.profileId))
    }
  }
})

test.use({ viewport: { width: 1280, height: 960 } })

async function blockOutside(page: Page): Promise<string[]> {
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
  item: Capture,
  theme: 'light' | 'dark',
  settled: boolean | null,
  outside: string[],
) {
  const folder = `${results}${item.screen}/${item.state}/`
  const name = `${item.variant}${item.phone ? '-phone' : ''}-${theme}`
  mkdirSync(folder, { recursive: true })
  await page.screenshot({
    path: `${folder}${name}.png`,
    style: item.masked ? paintOut(item.masked.selector) : undefined,
  })
  writeFileSync(
    `${folder}${name}.json`,
    JSON.stringify(
      {
        screen: item.screen,
        state: item.state,
        variant: item.variant,
        role: item.variant === 'admin' ? null : roles[teammates[item.variant].role],
        theme,
        revision,
        path: new URL(page.url()).pathname.replace(seeded.storeId, '<store>'),
        viewport: page.viewportSize(),
        intercepted: item.intercepted ?? null,
        masked: item.masked?.what ?? null,
        settled,
        outside,
      },
      null,
      2,
    ),
  )
}

for (const theme of ['light', 'dark'] as const) {
  for (const item of [
    ...paymentCaptures,
    ...taxCaptures,
    ...taskCaptures,
    ...profileListCaptures,
    ...profileCaptures,
    ...packageCaptures,
  ]) {
    const label = `${item.screen} ${item.state} ${item.variant}${item.phone ? ' phone' : ''} ${theme}`
    test(label, async ({ page }) => {
      if (item.phone) await page.setViewportSize(phone)
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
      const outside = await blockOutside(page)
      try {
        await signIn(page, item.variant)
        await item.reach(page)
        const settled = item.loading ? null : await settle(page)
        await page.waitForTimeout(400)
        await save(page, item, theme, settled, outside)
      } finally {
        await item.after?.()
      }
    })
  }
}
