import { expect, type Locator, type Page, test } from '@playwright/test'
import { login } from '../../dashboard/e2e/helpers'
import {
  buyers,
  certificateNumbers,
  companyAddresses,
  companyTaxNumber,
  comparisonAddresses,
  type SeededCompanies,
  seedCompanies,
} from './companies'
import { adminPage, type Case, compareCases } from './comparison'
import { PASSWORD, seed, teammates } from './staff'

/**
 * Batch 12's diagnostic comparison: each new company story beside the same
 * component on the company page (DA-CUS-05) and the companies list
 * (DA-CUS-04), as `compare-batch-10.spec.ts` compares the customer page's.
 * Start the screens as `compare.spec.ts` describes; set
 * `FIDELITY_STORYBOOK_URL` when the built Storybook is served elsewhere than
 * port 6007. The companies the screens show are made through the Admin API
 * first (`companies.ts`). The data differs on purpose: the screens show the
 * invented Larkspur companies, the stories the invented Tidewater ones.
 * Nothing a case opens is saved.
 *
 * Earlier stories these screens show are compared too (`earlier` below): the
 * address book row's and the shared tax identifiers card's stories batch 10's
 * G-96 sent here, on the company page, and those of its comparison follow-up
 * that the wholesale buyer's customer page shows (work item §3.1).
 */

let companies: SeededCompanies

const card = (page: Page, title: RegExp) =>
  page
    .locator('[data-slot="card"]')
    .filter({ has: page.locator('[data-slot="card-title"]', { hasText: title }) })
    .first()
const inColumn = (page: Page) => page.locator('[data-story-column] > *').first()
const dialog = (page: Page) => page.getByRole('alertdialog').or(page.getByRole('dialog')).first()
const menu = (page: Page) => page.getByRole('menu').first()
const menuItem = (page: Page, name: RegExp) => page.getByRole('menuitem', { name }).click()

type Who = 'group' | 'north' | 'south' | 'bistro' | 'empty'

/** Signs in as the support teammate, who may read customers but not change them. */
async function supportPage(page: Page, path: string) {
  const session = await login(page)
  await page.context().clearCookies()
  const res = await page.request.post('/api/v3/admin/auth/login', {
    data: { email: teammates.support.email, password: PASSWORD },
  })
  expect(res.ok(), await res.text()).toBeTruthy()
  await page.goto(`/${session.store_id}${path}`)
  await page.waitForLoadState('networkidle')
}

const openCompany = async (page: Page, who: Who, asSupport = false) => {
  const path = `/companies/${companies[who].id}`
  await (asSupport ? supportPage(page, path) : adminPage(page, path))
  await page.getByRole('heading', { level: 1 }).first().waitFor()
}

const companyCard = async (page: Page, who: Who, title: RegExp, asSupport = false) => {
  await openCompany(page, who, asSupport)
  const found = card(page, title)
  await found.waitFor()
  await found.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  await page.waitForLoadState('networkidle')
  return found
}

const titles = {
  certificates: /^exemption certificates/i,
  addresses: /^address book/i,
  tax: /^tax registration/i,
  members: /^members/i,
}

const story = (component: string, name: string) => `admin-dashboard-companies-${component}--${name}`
const composed = (component: string, name: string) => `dashboard-ui-composed-${component}--${name}`

const cardCase = (
  name: string,
  storyId: string,
  who: Who,
  title: RegExp,
  id = 'CMP-DA-G-24',
  asSupport = false,
): Case => ({
  id,
  name: `b12-${name}`,
  story: storyId,
  window: { width: 1280, height: 1400 },
  screen: (page) => companyCard(page, who, title, asSupport),
  inStory: inColumn,
})

const popup = (
  name: string,
  storyId: string,
  reach: (page: Page) => Promise<void>,
  found: (page: Page) => Locator = dialog,
  id = 'CMP-DA-G-24',
): Case => ({
  id,
  name: `b12-${name}`,
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
  const found = await companyCard(page, who, title)
  await found.getByRole('button', { name: button }).first().click()
  await dialog(page).waitFor()
}

const rowIn = (container: Locator, text: string) =>
  container.locator('[data-slot="item"], [role="listitem"]').filter({ hasText: text }).first()

const rowMenu = async (page: Page, who: Who, title: RegExp, text: string) => {
  const found = await companyCard(page, who, title)
  await rowIn(found, text)
    .getByRole('button', { name: /open actions/i })
    .click()
  await menu(page).waitFor()
}

const cases: Case[] = [
  cardCase(
    'certificates-card',
    story('tax-exemption-certificates-card', 'each-status'),
    'group',
    titles.certificates,
  ),
  cardCase(
    'certificates-card-none',
    story('tax-exemption-certificates-card', 'none'),
    'empty',
    titles.certificates,
  ),
  cardCase(
    'certificates-card-read-only',
    story('tax-exemption-certificates-card', 'read-only'),
    'group',
    titles.certificates,
    'CMP-DA-G-24',
    true,
  ),
  popup(
    'certificates-card-pending-menu',
    story('tax-exemption-certificates-card', 'pending-menu'),
    (page) => rowMenu(page, 'group', titles.certificates, certificateNumbers.pending),
    menu,
  ),
  popup(
    'certificates-card-accepted-menu',
    story('tax-exemption-certificates-card', 'accepted-menu'),
    (page) => rowMenu(page, 'group', titles.certificates, certificateNumbers.verified),
    menu,
  ),
  popup(
    'certificates-card-revoke-confirm',
    story('tax-exemption-certificates-card', 'revoke-confirm'),
    async (page) => {
      await rowMenu(page, 'group', titles.certificates, certificateNumbers.verified)
      await menuItem(page, /^revoke$/i)
    },
  ),
  popup(
    'certificates-card-delete-confirm',
    story('tax-exemption-certificates-card', 'delete-confirm'),
    async (page) => {
      await rowMenu(page, 'group', titles.certificates, certificateNumbers.pending)
      await menuItem(page, /^delete$/i)
    },
  ),
  popup(
    'certificates-card-add-sheet',
    story('tax-exemption-certificates-card', 'add-sheet'),
    (page) => cardButton(page, 'group', titles.certificates, /add certificate/i),
  ),
  popup(
    'certificates-card-reasons-listed',
    story('tax-exemption-certificates-card', 'reasons-listed'),
    async (page) => {
      await cardButton(page, 'group', titles.certificates, /add certificate/i)
      await dialog(page).locator('#tax_exemption_reason_id').click()
      await page.getByRole('option').first().waitFor()
    },
    (page) => page.locator('body'),
  ),
  popup(
    'certificates-card-required',
    story('tax-exemption-certificates-card', 'required'),
    async (page) => {
      await cardButton(page, 'group', titles.certificates, /add certificate/i)
      await dialog(page)
        .getByRole('button', { name: /^create$/i })
        .click()
      await dialog(page).locator('[data-slot="field-error"]').first().waitFor()
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
    },
  ),
  popup('company-address-sheet-add', story('company-address-sheet', 'add'), (page) =>
    cardButton(page, 'group', titles.addresses, /add address/i),
  ),
  popup('company-address-sheet-edit', story('company-address-sheet', 'edit'), async (page) => {
    await rowMenu(page, 'group', titles.addresses, companyAddresses.head.address1)
    await menuItem(page, /^edit$/i)
    await dialog(page).waitFor()
  }),
  popup(
    'company-address-sheet-state-missing',
    story('company-address-sheet', 'state-missing'),
    async (page) => {
      await cardButton(page, 'group', titles.addresses, /add address/i)
      await dialog(page).locator('#addr-a1').fill('18 Pier Road')
      await dialog(page).locator('#addr-city').fill('Tacoma')
      await dialog(page).locator('#addr-zip').fill('98402')
      await dialog(page)
        .getByRole('button', { name: /^save$/i })
        .click()
      await dialog(page).locator('[data-slot="field-error"]').first().waitFor()
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
    },
  ),
  {
    id: 'CMP-DA-G-24',
    name: 'b12-company-kind-badge-company',
    story: story('company-kind-badge', 'company'),
    screen: async (page) => {
      await openCompany(page, 'group')
      return page
        .locator('[data-slot="badge"]')
        .filter({ hasText: /^company$/i })
        .first()
    },
    inStory: (page) => page.locator('[data-slot="badge"]').first(),
  },
  {
    id: 'CMP-DA-G-24',
    name: 'b12-company-kind-badge-division',
    story: story('company-kind-badge', 'division'),
    screen: async (page) => {
      await openCompany(page, 'north')
      return page
        .locator('[data-slot="badge"]')
        .filter({ hasText: /^division$/i })
        .first()
    },
    inStory: (page) => page.locator('[data-slot="badge"]').first(),
  },
  popup(
    'enterprise-upsell',
    story('enterprise-upsell', 'company-roles'),
    (page) => cardButton(page, 'empty', titles.members, /add member/i),
    (page) =>
      page
        .getByText(/roles and approvals are an enterprise feature/i)
        .locator('xpath=ancestor::*[@data-slot="alert"][1]'),
  ),
]

/** Opens the wholesale buyer's customer page, or a card on it. */
const buyerCard = async (page: Page, title: RegExp, asSupport = false) => {
  const path = `/customers/${companies.wholesaleBuyer.id}`
  await (asSupport ? supportPage(page, path) : adminPage(page, path))
  await page.getByRole('heading', { level: 1 }).first().waitFor()
  const found = card(page, title)
  await found.waitFor()
  await found.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  await page.waitForLoadState('networkidle')
  return found
}

/** The wholesale buyer's add registration sheet, refused by the server on the number. */
const refusedNumber = async (page: Page) => {
  const found = await buyerCard(page, /^tax registration/i)
  await found.getByRole('button', { name: /add registration/i }).click()
  await dialog(page).getByRole('combobox', { name: /^kind/i }).click()
  await page.getByRole('option', { name: 'EU VAT' }).click()
  await dialog(page)
    .getByLabel(/^number/i)
    .fill('DE12345')
  await dialog(page)
    .getByRole('button', { name: /^save$/i })
    .click()
  await dialog(page).locator('[data-slot="field-error"]').first().waitFor({ timeout: 15_000 })
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
}

/**
 * Earlier stories these screens show (work item §3.1). The address book row's
 * and the shared tax identifiers card's on the company page, and G-96's
 * follow-up stories the wholesale buyer's page shows.
 */
const earlier: Case[] = [
  {
    id: 'CMP-DUI-C-02',
    name: 'b12-earlier-address-book-row-default-shipping',
    story: composed('address-book-row', 'default-shipping'),
    window: { width: 1280, height: 1400 },
    screen: async (page) =>
      rowIn(
        await companyCard(page, 'south', titles.addresses),
        comparisonAddresses.shippingOnly.address1,
      ),
    inStory: inColumn,
  },
  {
    id: 'CMP-DUI-C-02',
    name: 'b12-earlier-address-book-row-default-for-both',
    story: composed('address-book-row', 'default-for-both'),
    window: { width: 1280, height: 1400 },
    screen: async (page) =>
      rowIn(
        await companyCard(page, 'bistro', titles.addresses),
        comparisonAddresses.bothNoLabel.address1,
      ),
    inStory: inColumn,
  },
  {
    id: 'CMP-DUI-C-02',
    name: 'b12-earlier-address-book-row-plain',
    story: composed('address-book-row', 'plain'),
    window: { width: 1280, height: 1400 },
    screen: async (page) =>
      rowIn(
        await companyCard(page, 'bistro', titles.addresses),
        comparisonAddresses.plain.address1,
      ),
    inStory: inColumn,
  },
  {
    id: 'CMP-DUI-C-02',
    name: 'b12-earlier-address-book-row-read-only',
    story: composed('address-book-row', 'read-only'),
    window: { width: 1280, height: 1400 },
    screen: async (page) =>
      rowIn(
        await companyCard(page, 'group', titles.addresses, true),
        companyAddresses.warehouse.address1,
      ),
    inStory: inColumn,
  },
  popup(
    'earlier-address-book-row-menu-on-default',
    composed('address-book-row', 'menu-on-default'),
    (page) => rowMenu(page, 'south', titles.addresses, comparisonAddresses.shippingOnly.address1),
    menu,
    'CMP-DUI-C-02',
  ),
  popup(
    'earlier-address-book-row-menu-without-defaults',
    composed('address-book-row', 'menu-without-defaults'),
    (page) => rowMenu(page, 'bistro', titles.addresses, comparisonAddresses.bothNoLabel.address1),
    menu,
    'CMP-DUI-C-02',
  ),
  cardCase(
    'earlier-tax-identifiers-card-empty',
    composed('tax-identifiers-card', 'empty'),
    'empty',
    titles.tax,
    'CMP-DUI-C-51',
  ),
  cardCase(
    'earlier-tax-identifiers-card-read-only',
    composed('tax-identifiers-card', 'read-only'),
    'group',
    titles.tax,
    'CMP-DUI-C-51',
    true,
  ),
  popup(
    'earlier-tax-identifiers-card-add-sheet',
    composed('tax-identifiers-card', 'add-sheet'),
    (page) => cardButton(page, 'empty', titles.tax, /add registration/i),
    dialog,
    'CMP-DUI-C-51',
  ),
  popup(
    'earlier-tax-identifiers-card-kind-options',
    composed('tax-identifiers-card', 'kind-options'),
    async (page) => {
      await cardButton(page, 'empty', titles.tax, /add registration/i)
      await dialog(page).getByRole('combobox', { name: /^kind/i }).click()
      await page.getByRole('option').first().waitFor()
    },
    (page) => page.locator('body'),
    'CMP-DUI-C-51',
  ),
  popup(
    'earlier-tax-identifiers-card-custom-kind',
    composed('tax-identifiers-card', 'custom-kind'),
    async (page) => {
      await cardButton(page, 'empty', titles.tax, /add registration/i)
      await dialog(page).getByRole('combobox', { name: /^kind/i }).fill('nz_gst')
      await dialog(page)
        .getByLabel(/^number/i)
        .click()
    },
    dialog,
    'CMP-DUI-C-51',
  ),
  popup(
    'earlier-tax-identifiers-card-required',
    composed('tax-identifiers-card', 'required'),
    async (page) => {
      await cardButton(page, 'empty', titles.tax, /add registration/i)
      await dialog(page)
        .getByRole('button', { name: /^save$/i })
        .click()
      await dialog(page).locator('[data-slot="field-error"]').first().waitFor()
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
    },
    dialog,
    'CMP-DUI-C-51',
  ),
  popup(
    'earlier-tax-identifiers-card-edit-sheet',
    composed('tax-identifiers-card', 'edit-sheet'),
    async (page) => {
      await rowMenu(page, 'group', titles.tax, companyTaxNumber.value)
      await menuItem(page, /^edit$/i)
      await dialog(page).waitFor()
    },
    dialog,
    'CMP-DUI-C-51',
  ),
  popup(
    'earlier-tax-identifiers-card-delete-confirm',
    composed('tax-identifiers-card', 'delete-confirm'),
    async (page) => {
      await rowMenu(page, 'group', titles.tax, companyTaxNumber.value)
      await menuItem(page, /^delete$/i)
      await dialog(page).waitFor()
    },
    dialog,
    'CMP-DUI-C-51',
  ),
  // G-96's follow-up stories, on the wholesale buyer's customer page
  popup(
    'earlier-customer-groups-card-changed',
    'admin-dashboard-customers-customer-groups-card--changed',
    async (page) => {
      const found = await buyerCard(page, /^customer groups/i)
      await found.getByRole('button', { name: /^edit$/i }).click()
      await dialog(page).getByRole('button', { name: 'Remove Wholesale' }).click()
    },
    dialog,
    'CMP-DA-G-07',
  ),
  {
    id: 'CMP-DA-G-07',
    name: 'b12-earlier-customer-internal-note-card-editing-empty',
    story: 'admin-dashboard-customers-customer-internal-note-card--editing-empty',
    window: { width: 1280, height: 1400 },
    screen: async (page) => {
      const found = await buyerCard(page, /^internal note$/i)
      await found.getByRole('button', { name: /^edit$/i }).click()
      await page.getByRole('textbox', { name: /internal note/i }).waitFor()
      return found
    },
    inStory: inColumn,
  },
  popup(
    'earlier-customer-profile-card-email-taken',
    'admin-dashboard-customers-customer-profile-card--email-taken',
    async (page) => {
      const found = await buyerCard(page, /^profile$/i)
      await found.getByRole('button', { name: /^edit$/i }).click()
      await dialog(page)
        .getByLabel(/^email/i)
        .fill(buyers.member.email)
      await dialog(page)
        .getByRole('button', { name: /^save$/i })
        .click()
      await dialog(page).getByText(/taken/i).first().waitFor({ timeout: 15_000 })
    },
    dialog,
    'CMP-DA-G-07',
  ),
  {
    id: 'CMP-DA-G-07',
    name: 'b12-earlier-customer-tax-identifiers-card-read-only',
    story: 'admin-dashboard-customers-customer-tax-identifiers-card--read-only',
    window: { width: 1280, height: 1400 },
    screen: (page) => buyerCard(page, /^tax registration/i, true),
    inStory: inColumn,
  },
  popup(
    'earlier-customer-tax-identifiers-card-refused',
    'admin-dashboard-customers-customer-tax-identifiers-card--refused',
    refusedNumber,
    dialog,
    'CMP-DA-G-07',
  ),
  popup(
    'earlier-da-tax-identifiers-card-refused',
    'admin-dashboard-customers-tax-identifiers-card--refused',
    refusedNumber,
    dialog,
    'CMP-DA-G-24',
  ),
]

test.beforeAll(async ({ baseURL: configured }) => {
  const baseURL = configured ?? 'http://localhost:5174'
  await seed(baseURL)
  companies = await seedCompanies(baseURL)
})

compareCases([...cases, ...earlier])
