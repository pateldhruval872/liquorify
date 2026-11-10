import { type Locator, type Page, test } from '@playwright/test'
import { adminPage, type Case, compareCases } from './comparison'
import { customerImportFile, type SeededCustomers, seedCustomers } from './customers'
import { seedOrders } from './orders'
import { seed } from './staff'

/**
 * Batch 10's diagnostic comparison: each customer component's story beside the
 * same component on a customer's page (DA-CUS-02), as
 * `compare-batch-8-part-2.spec.ts` compares the order page's. Start the
 * screens as `compare.spec.ts` describes; set `FIDELITY_STORYBOOK_URL` when
 * the built Storybook is served elsewhere than port 6007. The customers the
 * screens show are made through the Admin API first (`customers.ts`): Spree's
 * sample customer with batch 8's orders, a customer with nothing added, an
 * erased customer, and one of the customers a capture erases, made again and
 * still untouched, for the store credit card with no credit. The data differs
 * on purpose: the screens show those customers, the stories invented ones.
 * Nothing a case opens is saved, apart from the completed import.
 *
 * Six earlier batches' stories these screens show are compared too (`earlier`
 * below), among them catalog part 3's issue store credit dialog opened from a
 * customer's page, as G-81 asks. The two import cases upload the same two
 * invented customers the captures import.
 */

let customers: SeededCustomers

const card = (page: Page, title: RegExp) =>
  page
    .locator('[data-slot="card"]')
    .filter({ has: page.locator('[data-slot="card-title"]', { hasText: title }) })
    .first()
const inColumn = (page: Page) => page.locator('[data-story-column] > *').first()
const dialog = (page: Page) => page.getByRole('alertdialog').or(page.getByRole('dialog')).first()
const sheet = (page: Page) => page.locator('[data-slot="sheet-content"]').first()
const menu = (page: Page) => page.getByRole('menu').first()

type Who = 'regular' | 'newcomer' | 'erased' | 'eraseLight'

const openCustomer = async (page: Page, who: Who) => {
  await adminPage(page, `/customers/${customers[who].id}`)
  await page.getByRole('heading', { level: 1 }).first().waitFor()
}

/** A card on a customer's page, scrolled into view. */
const customerCard = async (page: Page, who: Who, title: RegExp) => {
  await openCustomer(page, who)
  const found = card(page, title)
  await found.waitFor()
  await found.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  // Some cards show their actions once the session's permissions load.
  await page.waitForLoadState('networkidle')
  return found
}

const titles = {
  profile: /^profile$/i,
  groups: /^customer groups/i,
  addresses: /^addresses/i,
  tax: /^tax registration/i,
  note: /^internal note$/i,
  privacy: /^privacy and data$/i,
  credit: /^store credit/i,
  orders: /^orders/i,
  lastOrder: /^last order placed$/i,
}

const studioRow = (container: Locator) =>
  container.locator('[data-slot="item"]').filter({ hasText: '1520 Kiln Street' }).first()

const story = (component: string, name: string) => `admin-dashboard-customers-${component}--${name}`
const composed = (component: string, name: string) => `dashboard-ui-composed-${component}--${name}`

const cardCase = (
  name: string,
  storyId: string,
  who: Who,
  title: RegExp,
  id = 'CMP-DA-G-07',
): Case => ({
  id,
  name: `b10-${name}`,
  story: storyId,
  window: { width: 1280, height: 1400 },
  screen: (page) => customerCard(page, who, title),
  inStory: inColumn,
})

const popup = (
  name: string,
  storyId: string,
  reach: (page: Page) => Promise<void>,
  found: (page: Page) => Locator = dialog,
  id = 'CMP-DA-G-07',
): Case => ({
  id,
  name: `b10-${name}`,
  story: storyId,
  viewport: true,
  window: { width: 1280, height: 960 },
  screen: async (page) => {
    await reach(page)
    return found(page)
  },
  inStory: found,
})

const cardButton = async (page: Page, who: Who, title: RegExp, button: RegExp) => {
  const found = await customerCard(page, who, title)
  await found.getByRole('button', { name: button }).first().click()
}

const studioMenu = async (page: Page) => {
  const found = await customerCard(page, 'regular', titles.addresses)
  await studioRow(found)
    .getByRole('button', { name: /open actions/i })
    .click()
  await menu(page).waitFor()
}

const euMenu = async (page: Page) => {
  const found = await customerCard(page, 'regular', titles.tax)
  await found
    .getByRole('listitem')
    .filter({ hasText: 'DE811907980' })
    .getByRole('button', { name: /open actions/i })
    .click()
  await menu(page).waitFor()
}

/** The menu on the sample customer's $40.00 credit, as the story opens its refund credit's. */
const creditMenu = async (page: Page) => {
  const found = await customerCard(page, 'regular', titles.credit)
  await found
    .getByRole('row')
    .filter({ hasText: '$40.00' })
    .first()
    .getByRole('button', { name: /actions/i })
    .click()
  await menu(page).waitFor()
}

const menuItem = (page: Page, name: RegExp) => page.getByRole('menuitem', { name }).click()

const cases: Case[] = [
  // The sample customer's cards
  cardCase('profile-card', story('customer-profile-card', 'subscribed'), 'regular', titles.profile),
  cardCase('groups-card', story('customer-groups-card', 'one-group'), 'regular', titles.groups),
  cardCase(
    'addresses-card',
    story('customer-addresses-card', 'addresses'),
    'regular',
    titles.addresses,
  ),
  cardCase(
    'tax-identifiers-card',
    story('customer-tax-identifiers-card', 'identifiers'),
    'regular',
    titles.tax,
  ),
  cardCase(
    'internal-note-card',
    story('customer-internal-note-card', 'note'),
    'regular',
    titles.note,
  ),
  cardCase(
    'privacy-card',
    story('customer-privacy-card', 'with-consent'),
    'regular',
    titles.privacy,
  ),
  cardCase(
    'store-credits-card',
    story('customer-store-credits-card', 'credits'),
    'regular',
    titles.credit,
  ),
  cardCase('orders-card', story('customer-orders-card', 'view-all'), 'regular', titles.orders),
  cardCase(
    'last-order-card',
    story('customer-last-order-card', 'paid'),
    'regular',
    titles.lastOrder,
  ),
  {
    id: 'CMP-DA-G-07',
    name: 'b10-lifetime-stats',
    story: story('customer-lifetime-stats-card', 'regular'),
    window: { width: 1280, height: 1400 },
    screen: async (page) => {
      await openCustomer(page, 'regular')
      const stats = page
        .locator('div.grid')
        .filter({ has: page.getByText('Total spent', { exact: true }) })
        .first()
      await stats.waitFor()
      return stats
    },
    inStory: inColumn,
  },

  // A customer with nothing added, an erased one, and one with no credit
  cardCase(
    'groups-card-none',
    story('customer-groups-card', 'no-groups'),
    'newcomer',
    titles.groups,
  ),
  cardCase(
    'addresses-card-none',
    story('customer-addresses-card', 'no-addresses'),
    'newcomer',
    titles.addresses,
  ),
  cardCase(
    'tax-identifiers-card-none',
    story('customer-tax-identifiers-card', 'no-identifiers'),
    'newcomer',
    titles.tax,
  ),
  cardCase(
    'internal-note-card-none',
    story('customer-internal-note-card', 'no-note'),
    'newcomer',
    titles.note,
  ),
  cardCase(
    'orders-card-none',
    story('customer-orders-card', 'no-orders'),
    'newcomer',
    titles.orders,
  ),
  {
    id: 'CMP-DA-G-07',
    name: 'b10-lifetime-stats-no-orders',
    story: story('customer-lifetime-stats-card', 'no-orders'),
    window: { width: 1280, height: 1400 },
    screen: async (page) => {
      await openCustomer(page, 'newcomer')
      const stats = page
        .locator('div.grid')
        .filter({ has: page.getByText('Total spent', { exact: true }) })
        .first()
      await stats.waitFor()
      return stats
    },
    inStory: inColumn,
  },
  cardCase(
    'store-credits-card-none',
    story('customer-store-credits-card', 'no-credit'),
    'eraseLight',
    titles.credit,
  ),
  cardCase(
    'profile-card-erased',
    story('customer-profile-card', 'erased'),
    'erased',
    titles.profile,
  ),
  cardCase(
    'privacy-card-erased',
    story('customer-privacy-card', 'erased'),
    'erased',
    titles.privacy,
  ),

  // Sheets, dialogs and menus
  popup(
    'profile-card-edit-sheet',
    story('customer-profile-card', 'edit-sheet'),
    (page) => cardButton(page, 'regular', titles.profile, /^edit$/i),
    sheet,
  ),
  popup(
    'groups-card-edit-sheet',
    story('customer-groups-card', 'edit-sheet'),
    (page) => cardButton(page, 'regular', titles.groups, /^edit$/i),
    sheet,
  ),
  popup('addresses-card-row-menu', story('customer-addresses-card', 'row-menu'), studioMenu, menu),
  popup('addresses-card-add', story('customer-addresses-card', 'add-address'), (page) =>
    cardButton(page, 'regular', titles.addresses, /add address/i),
  ),
  popup('addresses-card-edit', story('customer-addresses-card', 'edit-address'), async (page) => {
    await studioMenu(page)
    await menuItem(page, /^edit$/i)
  }),
  popup(
    'addresses-card-delete-confirmation',
    story('customer-addresses-card', 'delete-confirm'),
    async (page) => {
      await studioMenu(page)
      await menuItem(page, /^delete$/i)
    },
  ),
  popup(
    'tax-identifiers-card-row-menu',
    story('customer-tax-identifiers-card', 'row-menu'),
    euMenu,
    menu,
  ),
  popup(
    'tax-identifiers-card-add-sheet',
    story('customer-tax-identifiers-card', 'add-sheet'),
    (page) => cardButton(page, 'regular', titles.tax, /add registration/i),
  ),
  popup(
    'tax-identifiers-card-edit-sheet',
    story('customer-tax-identifiers-card', 'edit-sheet'),
    async (page) => {
      await euMenu(page)
      await menuItem(page, /^edit$/i)
    },
  ),
  popup(
    'tax-identifiers-card-delete-confirmation',
    story('customer-tax-identifiers-card', 'delete-confirm'),
    async (page) => {
      await euMenu(page)
      await menuItem(page, /^delete$/i)
    },
  ),
  {
    id: 'CMP-DA-G-07',
    name: 'b10-internal-note-card-editing',
    story: story('customer-internal-note-card', 'editing'),
    window: { width: 1280, height: 1400 },
    screen: async (page) => {
      const found = await customerCard(page, 'regular', titles.note)
      await found.getByRole('button', { name: /^edit$/i }).click()
      await found.getByRole('button', { name: /^save$/i }).waitFor()
      return found
    },
    inStory: inColumn,
  },
  popup(
    'privacy-card-erase-confirmation',
    story('customer-privacy-card', 'erase-confirm'),
    (page) => cardButton(page, 'regular', titles.privacy, /erase personal data/i),
  ),
  popup(
    'store-credits-card-row-menu',
    story('customer-store-credits-card', 'row-menu'),
    creditMenu,
    menu,
  ),
  popup('store-credits-card-issue', story('customer-store-credits-card', 'issue-dialog'), (page) =>
    cardButton(page, 'regular', titles.credit, /issue store credit/i),
  ),
  popup(
    'store-credits-card-edit',
    story('customer-store-credits-card', 'edit-dialog'),
    async (page) => {
      await creditMenu(page)
      await menuItem(page, /^edit$/i)
    },
  ),
  popup(
    'store-credits-card-delete-confirmation',
    story('customer-store-credits-card', 'delete-confirm'),
    async (page) => {
      await creditMenu(page)
      await menuItem(page, /^delete$/i)
    },
  ),

  // Shared components, within the customer's page
  {
    id: 'CMP-DUI-C-02',
    name: 'b10-dui-address-book-row',
    story: composed('address-book-row', 'labelled'),
    window: { width: 1280, height: 1400 },
    screen: async (page) => studioRow(await customerCard(page, 'regular', titles.addresses)),
    inStory: inColumn,
  },
  popup(
    'dui-address-book-row-menu',
    composed('address-book-row', 'menu'),
    studioMenu,
    menu,
    'CMP-DUI-C-02',
  ),
  cardCase(
    'dui-tax-identifiers-card',
    composed('tax-identifiers-card', 'nothing-checks'),
    'regular',
    titles.tax,
    'CMP-DUI-C-51',
  ),
  cardCase(
    'da-tax-identifiers-card',
    'admin-dashboard-customers-tax-identifiers-card--identifiers',
    'regular',
    titles.tax,
    'CMP-DA-G-24',
  ),
]

/** Ticks the list's two newest customers and opens a bulk dialog. */
const bulkDialog = async (page: Page, action: RegExp) => {
  await adminPage(page, '/customers')
  const ticks = page.getByRole('checkbox', { name: /^select row$/i })
  for (const index of [0, 1]) await ticks.nth(index).check()
  await page.getByRole('button', { name: action }).click()
  await dialog(page).waitFor()
}

/** Uploads the customer file through the list's import and waits for its mapping. */
const openImport = async (page: Page) => {
  await adminPage(page, '/customers')
  await page.getByRole('button', { name: /^import$/i }).click()
  await dialog(page)
    .locator('input[type="file"]')
    .setInputFiles({
      name: 'fidelity-customers.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(customerImportFile),
    })
  await page.getByRole('button', { name: /^continue$/i }).click()
  await page.getByText('Map columns').waitFor({ timeout: 15_000 })
}

/**
 * Earlier batches' stories these screens show (work item §3.1): catalog part
 * 3's issue dialog, which G-81 sent here; batch 3's address dialog for a
 * person (G-33); catalog part 1's custom fields card and tag field (G-53); and
 * catalog part 2's import dialog (G-58).
 */
const earlier: Case[] = [
  popup(
    'earlier-issue-store-credit-dialog-for-one-customer',
    'admin-dashboard-store-credits-issue-store-credit-dialog--for-one-customer',
    (page) => cardButton(page, 'regular', titles.credit, /issue store credit/i),
    dialog,
    'CMP-DA-G-21',
  ),
  popup(
    'earlier-address-form-dialog-person-with-label',
    'dashboard-core-address-form-dialog--person-with-label',
    async (page) => {
      await studioMenu(page)
      await menuItem(page, /^edit$/i)
      await dialog(page).getByText('Select a country').waitFor({ state: 'hidden' })
    },
    dialog,
    'CMP-CORE-01',
  ),
  {
    ...cardCase(
      'earlier-custom-fields-every-kind-empty',
      'admin-dashboard-custom-fields-custom-fields-inline-card--empty',
      'newcomer',
      /^custom fields$/i,
      'CMP-DA-G-06',
    ),
    inStory: (page) => card(page, /^custom fields$/i),
  },
  popup(
    'earlier-tag-combobox-empty',
    'dashboard-core-tag-combobox--empty',
    (page) => bulkDialog(page, /^add tags/i),
    (page) => page.locator('[data-slot="combobox-chips"]').first(),
    'CMP-CORE-38',
  ),
  popup(
    'earlier-import-wizard-dialog-mapping',
    'dashboard-core-import-wizard-dialog--mapping',
    openImport,
    dialog,
    'CMP-CORE-13',
  ),
  popup(
    'earlier-import-wizard-dialog-completed',
    'dashboard-core-import-wizard-dialog--completed',
    async (page) => {
      await openImport(page)
      await page.getByRole('button', { name: /start import/i }).click()
      await page.getByText(/import completed/i).waitFor({ timeout: 180_000 })
    },
    dialog,
    'CMP-CORE-13',
  ),
]

test.beforeAll(async ({ baseURL: configured }) => {
  const baseURL = configured ?? 'http://localhost:5174'
  await seed(baseURL)
  await seedOrders(baseURL)
  customers = await seedCustomers(baseURL)
})

compareCases([...cases, ...earlier])
