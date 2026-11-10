import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { expect, type Locator, type Page, test } from '@playwright/test'
import {
  addListFilter,
  addRecordFilter,
  addTextFilter,
  login,
  searchList,
  sortList,
} from '../../dashboard/e2e/helpers'
import {
  customerField,
  customerImportFile,
  newcomer,
  placeDefaults,
  removeTaxNumber,
  type SeededCustomers,
  seedCustomers,
  vipGroupName,
} from './customers'
import { type Json, orderCustomerEmail, seedOrders } from './orders'
import { PASSWORD, roles, type Seeded, seed, teammates } from './staff'

/**
 * Captures batch 10's screens (DA-CUS-01 to DA-CUS-03) in each state the work
 * item maps (§2.1), each of its five permission variants (§2.2) and the
 * hand-offs it shows (§2.3), as `screens-batch-8.spec.ts` captures batch 8's.
 * It gathers evidence for a person to review and passes whenever it can
 * capture a screen; it compares nothing.
 *
 * Start the screens as `compare.spec.ts` describes, with Spree's sample
 * catalog and customers loaded into the browser-test database. Before the
 * first capture it adds the staff and roles (`staff.ts`), batch 8's orders
 * (`orders.ts`) and the customers the states need (`customers.ts`), all in the
 * default store; running it again reuses them. A capture that saves through
 * the screen saves on a customer made for it, or saves what is already there.
 * No capture opens another store or its customers.
 *
 * Each capture is saved as `results/screens/<screen ID>/<state>/<variant>-<theme>.png`
 * with a `.json` that records how the state was reached. A state reached by
 * answering a request in the browser says so in `intercepted`, and claims
 * nothing about the server.
 */

const results = new URL('./results/screens/', import.meta.url).pathname
const revision = process.env.FIDELITY_REVISION ?? null

type Variant = 'admin' | 'orderManager' | 'support' | 'customerManager' | 'merchandiser'
type Theme = 'light' | 'dark'

let seeded: Seeded
let customers: SeededCustomers

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
  /** Captured down the whole page, for a page taller than the window. */
  fullPage?: true
  /** A hand-off from an earlier batch (§2.3) that this capture shows. */
  handOff?: string
  reach: (page: Page, theme: Theme) => Promise<void>
  /** Restores what the capture changed through the screen. */
  after?: () => Promise<void>
}

const phone = { width: 390, height: 844 }
const roleVariants: Variant[] = ['orderManager', 'support', 'customerManager']

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

const dialog = (page: Page) => page.getByRole('alertdialog').or(page.getByRole('dialog'))

/** Holds every GET to an Admin API path open, so its screen stays loading. */
const hold = (page: Page, match: (path: string) => boolean) =>
  page.route(
    (url) => match(url.pathname),
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

/** A card on the customer page, found by its title. */
const card = (page: Page, title: RegExp) =>
  page
    .locator('[data-slot="card"]')
    .filter({ has: page.locator('[data-slot="card-title"]', { hasText: title }) })
    .first()

const directVisit = (screen: string, path: () => string): Capture => ({
  screen,
  state: 'direct-visit',
  variant: 'merchandiser',
  reach: async (page) => {
    await openStore(page, path())
    await expect(
      page
        .getByRole('heading')
        .first()
        .or(page.getByRole('button', { name: /try again/i })),
    ).toBeVisible({ timeout: 30_000 })
  },
})

// DA-CUS-01 Customers

const listPath = '/customers'
const searchBox = /search by email or name/i
const row = (page: Page, email: string) => page.getByRole('row').filter({ hasText: email })

// The list shows the newest first, so the batch's own customer is on its
// first page however many the captures add; Spree's sample customer is not.
const openList = async (page: Page) => {
  await openStore(page, listPath)
  await expect(page.getByRole('heading', { name: /^customers$/i })).toBeVisible({ timeout: 15_000 })
  await expect(row(page, newcomer.email)).toBeVisible({ timeout: 15_000 })
}

/** Ticks the first two rows, the newest customers. */
async function selectTwo(page: Page) {
  await openList(page)
  const ticks = page.getByRole('checkbox', { name: /^select row$/i })
  for (const index of [0, 1]) await ticks.nth(index).check()
  await expect(page.getByText(/2 selected/i)).toBeVisible()
}

async function openImport(page: Page) {
  await openList(page)
  await page.getByRole('button', { name: /^import$/i }).click()
  await expect(page.getByRole('heading', { name: /import from csv/i })).toBeVisible()
  await dialog(page)
    .locator('input[type="file"]')
    .setInputFiles({
      name: 'fidelity-customers.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(customerImportFile),
    })
  await page.getByRole('button', { name: /^continue$/i }).click()
  await expect(page.getByText('Map columns')).toBeVisible({ timeout: 15_000 })
}

const listCaptures: Capture[] = [
  ...(['admin', ...roleVariants] as Variant[]).map(
    (variant): Capture => ({ screen: 'DA-CUS-01', state: 'listed', variant, reach: openList }),
  ),
  {
    screen: 'DA-CUS-01',
    state: 'loading',
    variant: 'admin',
    intercepted: 'The customers request is held open',
    loading: true,
    reach: async (page) => {
      await hold(page, (path) => path === '/api/v3/admin/customers')
      await page.goto(`/${seeded.storeId}${listPath}`)
      await expect(page.locator('[data-slot="skeleton"]').first()).toBeVisible()
    },
  },
  {
    screen: 'DA-CUS-01',
    state: 'none',
    variant: 'admin',
    intercepted: 'The customers answer has its records taken out',
    reach: async (page) => {
      await emptied(page, 'customers')
      await openStore(page, listPath)
    },
  },
  {
    screen: 'DA-CUS-01',
    state: 'searched-name',
    variant: 'admin',
    reach: async (page) => {
      await openList(page)
      await searchList(page, searchBox, 'Johnson')
      await expect(row(page, newcomer.email)).toBeHidden({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-CUS-01',
    state: 'searched-email',
    variant: 'admin',
    reach: async (page) => {
      await openList(page)
      await searchList(page, searchBox, newcomer.email)
      await expect(row(page, orderCustomerEmail)).toBeHidden({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-CUS-01',
    state: 'filtered-group',
    variant: 'admin',
    reach: async (page) => {
      await openList(page)
      await addRecordFilter(page, /^groups$/i, vipGroupName)
      await expect(row(page, newcomer.email)).toBeHidden({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-CUS-01',
    state: 'filtered-company-panel',
    variant: 'admin',
    reach: async (page) => {
      await openList(page)
      await page.getByRole('button', { name: /add filter/i }).click()
      await page
        .locator('[data-slot="filter-panel-item"]')
        .getByText(/^companies$/i)
        .click()
    },
  },
  {
    screen: 'DA-CUS-01',
    state: 'filtered-tags',
    variant: 'admin',
    reach: async (page) => {
      await openList(page)
      await page.getByRole('button', { name: /add filter/i }).click()
      await page
        .locator('[data-slot="filter-panel-item"]')
        .getByText(/^tags$/i)
        .click()
      await page.getByRole('button', { name: 'VIP', exact: true }).click()
      await page.keyboard.press('Escape')
      await expect(row(page, newcomer.email)).toBeHidden({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-CUS-01',
    state: 'filtered-newsletter',
    variant: 'admin',
    reach: async (page) => {
      await openList(page)
      await addListFilter(page, /^newsletter$/i, /^yes$/i)
      await expect(row(page, newcomer.email)).toBeHidden({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-CUS-01',
    state: 'filtered-phone',
    variant: 'admin',
    reach: async (page) => {
      await openList(page)
      await addTextFilter(page, /^phone$/i, /^contains$/i, '0142')
      await expect(row(page, newcomer.email)).toBeHidden({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-CUS-01',
    state: 'erased-shown',
    variant: 'admin',
    reach: async (page) => {
      await openList(page)
      // The field and its first choice share the word, so the choice is the last match.
      await page.getByRole('button', { name: /add filter/i }).click()
      await page
        .locator('[data-slot="filter-panel-item"]')
        .getByText(/^erased$/i)
        .click()
      await page
        .getByRole('dialog')
        .getByRole('button', { name: /^erased$/i })
        .last()
        .click()
      await page.keyboard.press('Escape')
      await expect(page.getByRole('cell', { name: '(erased)' }).first()).toBeVisible({
        timeout: 15_000,
      })
    },
  },
  {
    screen: 'DA-CUS-01',
    state: 'sorted-email',
    variant: 'admin',
    reach: async (page) => {
      await openList(page)
      await sortList(page, /^email$/i, 'ascending')
    },
  },
  {
    screen: 'DA-CUS-01',
    state: 'columns',
    variant: 'admin',
    reach: async (page) => {
      await openList(page)
      await page
        .getByRole('button', { name: /columns|view/i })
        .first()
        .click()
      await expect(page.getByRole('menuitemcheckbox').first()).toBeVisible()
    },
  },
  {
    screen: 'DA-CUS-01',
    state: 'selected',
    variant: 'admin',
    reach: selectTwo,
  },
  ...(
    [
      ['bulk-add-group', /add to group/i, /add to groups/i],
      ['bulk-remove-group', /remove from group/i, /remove from groups/i],
      ['bulk-add-tags', /^add tags…$/i, /^add tags$/i],
      ['bulk-remove-tags', /^remove tags…$/i, /^remove tags$/i],
    ] as const
  ).map(
    ([state, button, heading]): Capture => ({
      screen: 'DA-CUS-01',
      state,
      variant: 'admin',
      reach: async (page) => {
        await selectTwo(page)
        await page.getByRole('button', { name: button }).click()
        await expect(page.getByRole('heading', { name: heading })).toBeVisible()
      },
    }),
  ),
  {
    screen: 'DA-CUS-01',
    state: 'new-empty',
    variant: 'admin',
    reach: async (page) => {
      await openList(page)
      await page.getByRole('button', { name: /new customer/i }).click()
      await expect(page.getByRole('heading', { name: /^new customer$/i })).toBeVisible()
    },
  },
  {
    screen: 'DA-CUS-01',
    state: 'new-filled',
    variant: 'admin',
    reach: async (page) => {
      await openList(page)
      await page.getByRole('button', { name: /new customer/i }).click()
      const sheet = dialog(page)
      await sheet.getByLabel(/^email/i).fill('fidelity-not-saved@example.com')
      await sheet.getByLabel(/^first name/i).fill('Robin')
      await sheet.getByLabel(/^last name/i).fill('Ashby')
    },
  },
  {
    screen: 'DA-CUS-01',
    state: 'new-refused',
    variant: 'admin',
    reach: async (page) => {
      await openList(page)
      await page.getByRole('button', { name: /new customer/i }).click()
      const sheet = dialog(page)
      await sheet.getByLabel(/^email/i).fill(newcomer.email)
      await sheet.getByRole('button', { name: /^create customer$/i }).click()
      await expect(sheet.getByText(/taken/i).first()).toBeVisible({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-CUS-01',
    state: 'export',
    variant: 'admin',
    reach: async (page) => {
      await openList(page)
      await page.getByRole('button', { name: /^export$/i }).click()
      await expect(dialog(page)).toBeVisible()
    },
  },
  {
    screen: 'DA-CUS-01',
    state: 'import-mapping',
    variant: 'admin',
    handOff: 'Catalog part 2, FL-21: the customer import opened from the list',
    reach: openImport,
  },
  {
    screen: 'DA-CUS-01',
    state: 'import-results',
    variant: 'admin',
    handOff: 'Catalog part 2, FL-21: what the customer import writes',
    reach: async (page) => {
      await openImport(page)
      await page.getByRole('button', { name: /start import/i }).click()
      await expect(page.getByText(/import completed/i)).toBeVisible({ timeout: 180_000 })
    },
  },
  {
    screen: 'DA-CUS-01',
    state: 'imported-listed',
    variant: 'admin',
    handOff: 'Catalog part 2, FL-21: the imported customers on the list',
    reach: async (page) => {
      await openList(page)
      await searchList(page, searchBox, 'fidelity-import')
      await expect(row(page, 'fidelity-import-2@example.com')).toBeVisible({ timeout: 15_000 })
    },
  },
  directVisit('DA-CUS-01', () => listPath),
]

// DA-CUS-02 Customer

const customerPath = (customer: Json) => `/customers/${customer.id}`

async function openCustomer(page: Page, customer: Json, name: string | RegExp) {
  await openStore(page, customerPath(customer))
  await expect(page.getByRole('heading', { name }).first()).toBeVisible({ timeout: 15_000 })
}

const openRegular = (page: Page) => openCustomer(page, customers.regular, 'Sarah Johnson')
const openNewcomer = (page: Page) =>
  openCustomer(page, customers.newcomer, `${newcomer.first_name} ${newcomer.last_name}`)

/** Opens a card's own edit button, the pencil in its header. */
async function editCard(page: Page, title: RegExp) {
  const target = card(page, title)
  await toMiddle(target)
  await target.getByRole('button', { name: /^edit$/i }).click()
}

/** Opens the menu on the address card's row that holds the given street. */
async function addressMenu(page: Page, street: string) {
  const target = card(page, /^addresses/i)
  await toMiddle(target)
  await target
    .locator('[data-slot="item"]')
    .filter({ hasText: street })
    .getByRole('button', { name: /open actions/i })
    .click()
  await expect(page.getByRole('menu')).toBeVisible()
}

/** Opens the menu on the tax registration card's row with the given number. */
async function taxMenu(page: Page, value: string) {
  const target = card(page, /^tax registration/i)
  await toMiddle(target)
  await target
    .getByRole('listitem')
    .filter({ hasText: value })
    .getByRole('button', { name: /open actions/i })
    .click()
  await expect(page.getByRole('menu')).toBeVisible()
}

async function openTaxSheet(page: Page) {
  const target = card(page, /^tax registration/i)
  await toMiddle(target)
  await target.getByRole('button', { name: /add registration/i }).click()
  await expect(page.getByRole('heading', { name: /add tax registration/i })).toBeVisible()
}

async function creditMenu(page: Page) {
  const target = card(page, /^store credit/i)
  await toMiddle(target)
  await target.getByRole('row').nth(1).getByRole('button').click()
  await expect(page.getByRole('menu')).toBeVisible()
}

const customerCaptures: Capture[] = [
  ...(['admin', ...roleVariants] as Variant[]).map(
    (variant): Capture => ({
      screen: 'DA-CUS-02',
      state: 'with-orders',
      variant,
      fullPage: true,
      reach: openRegular,
    }),
  ),
  {
    screen: 'DA-CUS-02',
    state: 'with-orders',
    variant: 'admin',
    phone: true,
    fullPage: true,
    reach: openRegular,
  },
  ...(['admin', 'support'] as Variant[]).map(
    (variant): Capture => ({
      screen: 'DA-CUS-02',
      state: 'no-orders',
      variant,
      fullPage: true,
      reach: openNewcomer,
    }),
  ),
  {
    screen: 'DA-CUS-02',
    state: 'erased',
    variant: 'admin',
    fullPage: true,
    reach: (page) => openCustomer(page, customers.erased, /erased/i),
  },
  {
    screen: 'DA-CUS-02',
    state: 'loading',
    variant: 'admin',
    intercepted: 'The customer request is held open',
    loading: true,
    reach: async (page) => {
      await hold(page, (path) => path === `/api/v3/admin/customers/${customers.regular.id}`)
      await page.goto(`/${seeded.storeId}${customerPath(customers.regular)}`)
      await page.waitForTimeout(1500)
    },
  },
  {
    screen: 'DA-CUS-02',
    state: 'not-found',
    variant: 'admin',
    reach: async (page) => {
      await openStore(page, '/customers/cust_doesNotExist')
      await expect(page.getByText('Customer not found')).toBeVisible({ timeout: 30_000 })
    },
  },
  {
    screen: 'DA-CUS-02',
    state: 'json-drawer',
    variant: 'admin',
    reach: async (page) => {
      await openRegular(page)
      await page.getByRole('button', { name: 'More actions' }).click()
      await page.getByRole('menuitem', { name: /view as json/i }).click()
      await expect(dialog(page)).toBeVisible()
    },
  },
  {
    screen: 'DA-CUS-02',
    state: 'orders-view-all',
    variant: 'admin',
    handOff: 'Batch 8: the orders card’s link to the order list filtered to the customer',
    reach: async (page) => {
      await openRegular(page)
      await card(page, /^orders/i)
        .getByRole('link', { name: /view all/i })
        .click()
      await expect(page.getByRole('heading', { name: /^orders$/i })).toBeVisible({
        timeout: 15_000,
      })
      await page.waitForLoadState('networkidle')
    },
  },
  {
    screen: 'DA-CUS-02',
    state: 'profile-sheet',
    variant: 'admin',
    reach: async (page) => {
      await openRegular(page)
      await editCard(page, /^profile$/i)
      await expect(page.getByRole('heading', { name: /^edit customer$/i })).toBeVisible()
    },
  },
  {
    screen: 'DA-CUS-02',
    state: 'profile-saved',
    variant: 'admin',
    reach: async (page) => {
      await openNewcomer(page)
      await editCard(page, /^profile$/i)
      await dialog(page)
        .getByLabel(/^phone/i)
        .fill('555-0190')
      await dialog(page)
        .getByRole('button', { name: /^save$/i })
        .click()
      await expect(dialog(page)).toBeHidden({ timeout: 15_000 })
      await expect(page.getByText('555-0190')).toBeVisible()
    },
  },
  {
    screen: 'DA-CUS-02',
    state: 'profile-refused',
    variant: 'admin',
    reach: async (page) => {
      await openNewcomer(page)
      await editCard(page, /^profile$/i)
      await dialog(page)
        .getByLabel(/^email/i)
        .fill(orderCustomerEmail)
      await dialog(page)
        .getByRole('button', { name: /^save$/i })
        .click()
      await expect(dialog(page).getByText(/taken/i).first()).toBeVisible({ timeout: 15_000 })
    },
  },
  ...(['admin', 'support'] as Variant[]).map(
    (variant): Capture => ({
      screen: 'DA-CUS-02',
      state: 'groups-sheet',
      variant,
      reach: async (page) => {
        await openRegular(page)
        await editCard(page, /^customer groups/i)
        await expect(page.getByRole('heading', { name: /^edit customer groups$/i })).toBeVisible()
      },
    }),
  ),
  {
    screen: 'DA-CUS-02',
    state: 'groups-refused',
    variant: 'support',
    reach: async (page) => {
      await openRegular(page)
      await editCard(page, /^customer groups/i)
      await dialog(page)
        .getByRole('button', { name: `Remove ${vipGroupName}` })
        .click()
      await dialog(page)
        .getByRole('button', { name: /^save$/i })
        .click()
      await expect(dialog(page).getByRole('alert')).toBeVisible({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-CUS-02',
    state: 'address-menu',
    variant: 'admin',
    reach: async (page) => {
      await openRegular(page)
      await addressMenu(page, '1520 Kiln Street')
    },
  },
  {
    screen: 'DA-CUS-02',
    state: 'address-add',
    variant: 'admin',
    reach: async (page) => {
      await openRegular(page)
      const target = card(page, /^addresses/i)
      await toMiddle(target)
      await target.getByRole('button', { name: /add address/i }).click()
      await expect(page.getByRole('heading', { name: /^add address$/i })).toBeVisible()
    },
  },
  {
    screen: 'DA-CUS-02',
    state: 'address-edit',
    variant: 'admin',
    reach: async (page) => {
      await openRegular(page)
      await addressMenu(page, '1520 Kiln Street')
      await page.getByRole('menuitem', { name: /^edit$/i }).click()
      await expect(page.getByRole('heading', { name: /^edit address$/i })).toBeVisible()
    },
  },
  {
    screen: 'DA-CUS-02',
    state: 'address-delete',
    variant: 'admin',
    reach: async (page) => {
      await openRegular(page)
      await addressMenu(page, '1520 Kiln Street')
      await page.getByRole('menuitem', { name: /^delete$/i }).click()
      await expect(page.getByText('Delete this address?')).toBeVisible()
    },
  },
  {
    screen: 'DA-CUS-02',
    state: 'address-default-billing-set',
    variant: 'admin',
    // Studio holds the default shipping and Home the default billing; setting
    // Studio as the default billing too should leave its shipping in place.
    reach: async (page) => {
      await placeDefaults(baseURL, customers.regular.id, { shipping: 'Studio', billing: 'Home' })
      await openRegular(page)
      await addressMenu(page, '1520 Kiln Street')
      await page.getByRole('menuitem', { name: /^set as default billing$/i }).click()
      await expect(
        card(page, /^addresses/i)
          .locator('[data-slot="item"]')
          .filter({ hasText: '1520 Kiln Street' })
          .getByText(/^default billing$/i),
      ).toBeVisible({ timeout: 15_000 })
      await page.waitForLoadState('networkidle')
    },
    after: () =>
      placeDefaults(baseURL, customers.regular.id, { shipping: 'Home', billing: 'Home' }),
  },
  {
    screen: 'DA-CUS-02',
    state: 'credit-issue',
    variant: 'admin',
    handOff: 'Catalog part 3, G-81: the issue store credit dialog opened from a customer’s page',
    reach: async (page) => {
      await openRegular(page)
      const target = card(page, /^store credit/i)
      await toMiddle(target)
      await target.getByRole('button', { name: /issue store credit/i }).click()
      await expect(page.getByRole('heading', { name: /issue store credit/i })).toBeVisible()
    },
  },
  {
    screen: 'DA-CUS-02',
    state: 'credit-issued',
    variant: 'admin',
    handOff:
      'Catalog part 3, G-81: the credit issued from a customer’s page, on its card and in the figures',
    reach: async (page) => {
      await openNewcomer(page)
      await page.getByRole('button', { name: /issue store credit/i }).click()
      await dialog(page)
        .getByRole('textbox', { name: /amount/i })
        .fill('10.00')
      await dialog(page).getByRole('textbox', { name: /memo/i }).fill('Fidelity check')
      await dialog(page)
        .getByRole('button', { name: /^issue store credit$/i })
        .click()
      await expect(dialog(page)).toBeHidden({ timeout: 15_000 })
      await expect(
        card(page, /^store credit/i)
          .getByText('Fidelity check')
          .first(),
      ).toBeVisible({
        timeout: 15_000,
      })
    },
  },
  {
    screen: 'DA-CUS-02',
    state: 'credit-edit',
    variant: 'admin',
    reach: async (page) => {
      await openRegular(page)
      await creditMenu(page)
      await page.getByRole('menuitem', { name: /^edit$/i }).click()
      await expect(page.getByRole('heading', { name: /edit store credit/i })).toBeVisible()
    },
  },
  {
    screen: 'DA-CUS-02',
    state: 'credit-delete',
    variant: 'admin',
    reach: async (page) => {
      await openRegular(page)
      await creditMenu(page)
      await page.getByRole('menuitem', { name: /^delete$/i }).click()
      await expect(page.getByText('Delete this store credit?')).toBeVisible()
    },
  },
  {
    screen: 'DA-CUS-02',
    state: 'tax-menu',
    variant: 'admin',
    handOff: 'Batch 7, CAP-07-12: a customer’s tax identifiers',
    reach: async (page) => {
      await openRegular(page)
      await taxMenu(page, 'DE811907980')
    },
  },
  {
    screen: 'DA-CUS-02',
    state: 'tax-add',
    variant: 'admin',
    reach: async (page) => {
      await openRegular(page)
      await openTaxSheet(page)
    },
  },
  {
    screen: 'DA-CUS-02',
    state: 'tax-edit',
    variant: 'admin',
    reach: async (page) => {
      await openRegular(page)
      await taxMenu(page, 'DE811907980')
      await page.getByRole('menuitem', { name: /^edit$/i }).click()
      await expect(page.getByRole('heading', { name: /edit tax registration/i })).toBeVisible()
    },
  },
  {
    screen: 'DA-CUS-02',
    state: 'tax-refused',
    variant: 'admin',
    reach: async (page) => {
      await openNewcomer(page)
      await openTaxSheet(page)
      await dialog(page).getByRole('combobox', { name: /^kind/i }).click()
      await page.getByRole('option', { name: 'EU VAT' }).click()
      await dialog(page)
        .getByLabel(/^number/i)
        .fill('DE12345')
      await dialog(page)
        .getByRole('button', { name: /^save$/i })
        .click()
      // Spree answers "does not look like a valid EU VAT registration"; the
      // sheet shows the code's generic text instead (SD-46).
      await expect(dialog(page).getByText('is invalid')).toBeVisible({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-CUS-02',
    state: 'tax-kind-typed',
    variant: 'admin',
    reach: async (page) => {
      await openNewcomer(page)
      await openTaxSheet(page)
      await dialog(page).getByRole('combobox', { name: /^kind/i }).fill('nz_gst')
      await dialog(page)
        .getByLabel(/^number/i)
        .click()
    },
  },
  {
    screen: 'DA-CUS-02',
    state: 'tax-kind-typed-saved',
    variant: 'admin',
    // The kind typed in the sheet is gone from its field (SD-44), yet saving
    // sends it: the row then names it.
    reach: async (page) => {
      await openNewcomer(page)
      await openTaxSheet(page)
      await dialog(page).getByRole('combobox', { name: /^kind/i }).fill('nz_gst')
      await dialog(page)
        .getByLabel(/^number/i)
        .fill('123-456-789')
      await dialog(page)
        .getByRole('button', { name: /^save$/i })
        .click()
      await expect(dialog(page)).toBeHidden({ timeout: 15_000 })
      const target = card(page, /^tax registration/i)
      await expect(target.getByText('123-456-789')).toBeVisible({ timeout: 15_000 })
      await toMiddle(target)
    },
    after: () => removeTaxNumber(baseURL, customers.newcomer.id, '123-456-789'),
  },
  {
    screen: 'DA-CUS-02',
    state: 'tax-added',
    variant: 'admin',
    handOff: 'Batch 7, CAP-07-12: an identifier added',
    reach: async (page) => {
      await openNewcomer(page)
      await openTaxSheet(page)
      await dialog(page).getByRole('combobox', { name: /^kind/i }).click()
      await page.getByRole('option', { name: 'Australian Business Number' }).click()
      await dialog(page)
        .getByLabel(/^number/i)
        .fill('51824753556')
      await dialog(page)
        .getByRole('button', { name: /^save$/i })
        .click()
      await expect(dialog(page)).toBeHidden({ timeout: 15_000 })
      await expect(page.getByText('51824753556')).toBeVisible({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-CUS-02',
    state: 'tax-deleted',
    variant: 'admin',
    handOff: 'Batch 7, CAP-07-12: the identifier deleted',
    reach: async (page) => {
      await openNewcomer(page)
      await taxMenu(page, '51824753556')
      await page.getByRole('menuitem', { name: /^delete$/i }).click()
      await dialog(page)
        .getByRole('button', { name: /^delete$/i })
        .click()
      await expect(page.getByText(/no tax registration on file/i)).toBeVisible({ timeout: 15_000 })
      await expect(dialog(page)).toBeHidden()
    },
  },
  {
    screen: 'DA-CUS-02',
    state: 'tax-delete-confirm',
    variant: 'admin',
    reach: async (page) => {
      await openRegular(page)
      await taxMenu(page, 'DE811907980')
      await page.getByRole('menuitem', { name: /^delete$/i }).click()
      await expect(page.getByRole('heading', { name: /delete this registration/i })).toBeVisible()
    },
  },
  {
    screen: 'DA-CUS-02',
    state: 'note-editing',
    variant: 'admin',
    reach: async (page) => {
      await openRegular(page)
      await editCard(page, /^internal note$/i)
      await expect(page.getByRole('textbox', { name: /internal note/i })).toBeVisible()
    },
  },
  {
    screen: 'DA-CUS-02',
    state: 'erase-confirm',
    variant: 'admin',
    reach: async (page) => {
      await openRegular(page)
      const target = card(page, /^privacy and data$/i)
      await toMiddle(target)
      await target.getByRole('button', { name: /erase personal data/i }).click()
      await expect(page.getByRole('heading', { name: /erase this customer/i })).toBeVisible()
    },
  },
  {
    screen: 'DA-CUS-02',
    state: 'erase-done',
    variant: 'admin',
    reach: async (page, theme) => {
      const target = theme === 'light' ? customers.eraseLight : customers.eraseDark
      await openCustomer(page, target, /alex/i)
      await page.getByRole('button', { name: /erase personal data/i }).click()
      await dialog(page)
        .getByRole('button', { name: /erase personal data/i })
        .click()
      await expect(page.getByText(/^erased$/i).first()).toBeVisible({ timeout: 15_000 })
    },
  },
  ...(['admin', 'support', 'customerManager'] as Variant[]).map(
    (variant): Capture => ({
      screen: 'DA-CUS-02',
      state: 'export',
      variant,
      reach: async (page, theme) => {
        await openRegular(page)
        const target = card(page, /^privacy and data$/i)
        await toMiddle(target)
        const download = page.waitForEvent('download', { timeout: 15_000 }).catch(() => null)
        await target.getByRole('button', { name: /export data/i }).click()
        const file = await download
        if (!file) {
          await expect(page.getByText(/could not export the data/i)).toBeVisible({
            timeout: 15_000,
          })
          return
        }
        // The file itself is not kept: only its name and what each section
        // holds, so the record can say what an export contains.
        const body = JSON.parse(readFileSync(await file.path(), 'utf8')) as Record<string, unknown>
        const outline = Object.fromEntries(
          Object.entries(body).map(([key, value]) => [
            key,
            Array.isArray(value)
              ? `${value.length} records`
              : value && typeof value === 'object'
                ? Object.keys(value)
                : typeof value,
          ]),
        )
        const folder = `${results}DA-CUS-02/export/`
        mkdirSync(folder, { recursive: true })
        writeFileSync(
          `${folder}${variant}-${theme}-file-outline.json`,
          JSON.stringify({ name: file.suggestedFilename(), outline }, null, 2),
        )
      },
    }),
  ),
  {
    screen: 'DA-CUS-02',
    state: 'custom-field-filled',
    variant: 'admin',
    handOff: 'Batch 3, DA-SET-09: a field defined for customers, filled on the customer’s page',
    reach: async (page) => {
      await openRegular(page)
      const target = card(page, /custom fields|additional/i)
      await toMiddle(target)
      const field = target.getByLabel(customerField.label)
      if (await field.isVisible().catch(() => false)) {
        await field.fill('Saturday')
        await field.press('Tab')
      } else {
        await target.getByRole('button', { name: /^edit$/i }).click()
        await page.getByLabel(customerField.label).fill('Saturday')
        await page.getByRole('button', { name: /^save$/i }).click()
      }
      await expect(page.getByText('Saturday').first()).toBeVisible({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-SET-09',
    state: 'customer-field-defined',
    variant: 'admin',
    handOff: 'Batch 3, DA-SET-09: the field defined for customers',
    reach: async (page) => {
      await openStore(page, '/settings/custom-field-definitions')
      await expect(page.getByText(customerField.label)).toBeVisible({ timeout: 15_000 })
    },
  },
  directVisit('DA-CUS-02', () => customerPath(customers.regular)),
]

// DA-CUS-03 Customer groups

const groupsPath = '/customers/groups'

const openGroups = async (page: Page) => {
  await openStore(page, groupsPath)
  await expect(page.getByRole('row').filter({ hasText: vipGroupName }).first()).toBeVisible({
    timeout: 15_000,
  })
}

async function openCreateGroup(page: Page) {
  await openGroups(page)
  await page.getByRole('button', { name: /add customer group/i }).click()
  await expect(page.getByRole('heading', { name: /add customer group/i })).toBeVisible()
}

const groupCaptures: Capture[] = [
  ...(['admin', ...roleVariants] as Variant[]).map(
    (variant): Capture => ({ screen: 'DA-CUS-03', state: 'listed', variant, reach: openGroups }),
  ),
  {
    screen: 'DA-CUS-03',
    state: 'none',
    variant: 'admin',
    intercepted: 'The customer groups answer has its records taken out',
    reach: async (page) => {
      await emptied(page, 'customer_groups')
      await openStore(page, groupsPath)
    },
  },
  { screen: 'DA-CUS-03', state: 'create-empty', variant: 'admin', reach: openCreateGroup },
  {
    screen: 'DA-CUS-03',
    state: 'create-filled',
    variant: 'admin',
    reach: async (page) => {
      await openCreateGroup(page)
      await dialog(page).getByLabel(/^name/i).fill('Local makers')
      await dialog(page)
        .getByLabel(/^description/i)
        .fill('Studios within the city who collect their own orders.')
    },
  },
  {
    screen: 'DA-CUS-03',
    state: 'create-refused',
    variant: 'admin',
    reach: async (page) => {
      await openCreateGroup(page)
      await dialog(page).getByLabel(/^name/i).fill(vipGroupName)
      await dialog(page)
        .getByRole('button', { name: /create customer group/i })
        .click()
      await expect(dialog(page).getByText(/taken/i).first()).toBeVisible({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-CUS-03',
    state: 'edit',
    variant: 'admin',
    reach: async (page) => {
      await openGroups(page)
      await page.getByRole('row').filter({ hasText: vipGroupName }).first().click()
      await expect(page.getByRole('link', { name: /view members/i })).toBeVisible({
        timeout: 15_000,
      })
    },
  },
  {
    screen: 'DA-CUS-03',
    state: 'members',
    variant: 'admin',
    reach: async (page) => {
      await openGroups(page)
      await page.getByRole('row').filter({ hasText: vipGroupName }).first().click()
      await page.getByRole('link', { name: /view members/i }).click()
      await expect(row(page, orderCustomerEmail)).toBeVisible({ timeout: 15_000 })
    },
  },
  {
    screen: 'DA-CUS-03',
    state: 'delete-confirm',
    variant: 'admin',
    reach: async (page) => {
      await openGroups(page)
      await page
        .getByRole('row')
        .filter({ hasText: vipGroupName })
        .first()
        .getByRole('button')
        .last()
        .click()
      await page.getByRole('menuitem', { name: /^delete$/i }).click()
      await expect(page.getByRole('heading', { name: /delete customer group\?/i })).toBeVisible()
    },
  },
  directVisit('DA-CUS-03', () => groupsPath),
]

let baseURL = 'http://localhost:5174'

test.beforeAll(async ({ baseURL: configured }) => {
  baseURL = configured ?? baseURL
  seeded = await seed(baseURL)
  await seedOrders(baseURL)
  customers = await seedCustomers(baseURL)
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

/**
 * Spree's browser-test server gives its files an address on port 3000, where
 * nothing runs; the pictures are fetched from the test server's own port so
 * they draw.
 */
const filesFrom = new URL(process.env.FIDELITY_API_URL ?? 'http://localhost:3010').origin

async function serveFiles(page: Page) {
  await page.context().route('http://localhost:3000/rails/active_storage/**', async (route) => {
    const url = route.request().url().replace('http://localhost:3000', filesFrom)
    await route.fulfill({ response: await route.fetch({ url }) })
  })
}

async function save(
  page: Page,
  item: Capture,
  theme: Theme,
  settled: boolean | null,
  outside: string[],
) {
  const folder = `${results}${item.screen}/${item.state}/`
  const name = `${item.variant}${item.phone ? '-phone' : ''}-${theme}`
  mkdirSync(folder, { recursive: true })
  const window = page.viewportSize()
  if (item.fullPage && window) {
    // The page scrolls inside the shell, not the document, so a full-page
    // screenshot would stop at the window: the window grows to the page instead.
    const hidden = await page.evaluate(() =>
      Math.max(
        0,
        ...[...document.querySelectorAll('*')]
          .filter((element) => /(auto|scroll)/.test(getComputedStyle(element).overflowY))
          .map((element) => element.scrollHeight - element.clientHeight),
      ),
    )
    if (hidden > 0) {
      await page.setViewportSize({ width: window.width, height: window.height + hidden })
      await page.waitForTimeout(300)
    }
  }
  const captured = page.viewportSize()
  await page.screenshot({ path: `${folder}${name}.png`, fullPage: item.fullPage ?? false })
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
        viewport: window,
        fullPage: item.fullPage ?? false,
        capturedHeight: captured?.height ?? null,
        intercepted: item.intercepted ?? null,
        handOff: item.handOff ?? null,
        settled,
        outside,
      },
      null,
      2,
    ),
  )
}

for (const theme of ['light', 'dark'] as const) {
  for (const item of [...listCaptures, ...customerCaptures, ...groupCaptures]) {
    const label = `${item.screen} ${item.state} ${item.variant}${item.phone ? ' phone' : ''} ${theme}`
    test(label, async ({ page }) => {
      if (item.phone) await page.setViewportSize(phone)
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
      const outside = await blockOutside(page)
      await serveFiles(page)
      try {
        await signIn(page, item.variant)
        await item.reach(page, theme)
        const settled = item.loading ? null : await settle(page)
        await page.waitForTimeout(400)
        await save(page, item, theme, settled, outside)
      } finally {
        await item.after?.()
      }
    })
  }
}
