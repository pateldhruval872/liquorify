import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { expect, type Locator, type Page, test } from '@playwright/test'
import { getCredentials, login, rowButton, sellerLogin } from '../../dashboard/e2e/helpers'
import { FIRST_RUN_CREDENTIALS_FILE } from '../../dashboard/e2e/paths'
import { dashboardCounters, releaseNotes, updateAvailable } from '../src/fixtures/admin/shell'
import { type Catalog, fixture, seedCatalog } from './catalog'
import {
  type Developers,
  endpoints,
  origins,
  paintOut,
  removeNamed,
  secretKeys,
  seedDevelopers,
  setRelay,
} from './developers'
import {
  category as coffeeCategory,
  type Merchandising,
  catalogs as merchandisingCatalogs,
  collections as merchandisingCollections,
  priceLists as merchandisingPriceLists,
  seedMerchandising,
} from './merchandising'
import {
  openRoleMenu,
  openRowMenu,
  PASSWORD,
  pendingEmail,
  removed,
  roleRow,
  roles,
  seed,
  teammates,
} from './staff'

/**
 * The pilot's diagnostic comparison with running screens (LIQ-010 §12.1): each
 * story beside the same component on Spree's running screen, in the same
 * browser. It gathers evidence for a person to review and passes whenever it
 * can capture both sides, so a successful run alone does not establish that a
 * story matches its screen.
 *
 * Before running, start the screens at the revision under test:
 *   1. Spree's browser-test server, which the dashboard's own browser tests use:
 *      `node node_modules/@playwright/test/cli.js test -c fidelity/stack.config.ts`
 *      (stop it by creating `fidelity/.stop`);
 *   2. the built dashboard on port 5174 and seller panel on 5175 (`vite preview`,
 *      with `VITE_API_PROXY_TARGET=http://localhost:3010`), as their browser tests do;
 *   3. the built Storybook on port 6007 (`node visual/serve.mjs storybook-static 6007`).
 *
 * For each case it saves both images side by side, and the computed styles of
 * both sides with the differences between them, to `fidelity/results/`. Set
 * `FIDELITY_REVISION` to the commit under test to record it in each file. The
 * data differs on purpose: the screens show the browser tests' fixtures and the
 * stories show invented ones. API key values are masked on both sides, since
 * the screens show keys from the test database. The staff cases add the
 * teammates, roles and invitations they open first (`staff.ts`), and the
 * developer settings cases add the keys, clients, agents, endpoints and
 * integration they show (`developers.ts`). Where a sheet or dialog opens above
 * a key, those cases paint every key, token and secret out of both images
 * instead, so the sheet still covers what it covers on screen.
 */

const STORYBOOK = 'http://localhost:6007'
const results = new URL('./results/', import.meta.url).pathname
const revision = process.env.FIDELITY_REVISION ?? null

/** Hides API key values in screenshots. */
const keyValues = (page: Page) => [page.locator('[data-slot="card"] code')]

/** What a case's screenshots hide: the elements it paints out, or else the key values. */
const hidden = (item: { paintedOut?: string }, page: Page) =>
  item.paintedOut ? { style: paintOut(item.paintedOut) } : { mask: keyValues(page) }

/** The styles compared on every element, chosen to catch a wrong token, size or variant. */
const properties = [
  'color',
  'background-color',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'letter-spacing',
  'border-top-width',
  'border-top-style',
  'border-top-color',
  'border-bottom-width',
  'border-bottom-color',
  'border-top-left-radius',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'height',
  'box-shadow',
  'opacity',
  'gap',
]

type Styles = Record<string, Record<string, string>>

declare global {
  interface Window {
    __STORYBOOK_PREVIEW__?: { currentRender?: { phase?: string } }
  }
}

/**
 * The computed styles of the target and everything inside it, one entry for
 * each distinct element (tag, classes and slot), so the same part on both sides
 * is compared however many rows the data gives it.
 */
async function collectStyles(target: Locator): Promise<Styles> {
  return target.evaluate((root, names) => {
    const styles: Record<string, Record<string, string>> = {}
    const visit = (element: Element) => {
      const key = [
        element.tagName.toLowerCase(),
        element.getAttribute('data-slot') ?? '',
        element.getAttribute('class') ?? '',
      ].join('|')
      if (!styles[key]) {
        const computed = getComputedStyle(element)
        styles[key] = Object.fromEntries(
          names.map((name) => [name, computed.getPropertyValue(name)]),
        )
      }
      for (const child of element.children) visit(child)
    }
    visit(root)
    return styles
  }, properties)
}

function compareStyles(screen: Styles, story: Styles) {
  const differences: { element: string; property: string; screen: string; story: string }[] = []
  for (const [element, values] of Object.entries(screen)) {
    const other = story[element]
    if (!other) continue
    for (const property of properties) {
      if (values[property] !== other[property]) {
        differences.push({ element, property, screen: values[property], story: other[property] })
      }
    }
  }
  return {
    compared: Object.keys(screen).filter((element) => element in story).length,
    onlyOnScreen: Object.keys(screen).filter((element) => !(element in story)),
    onlyInStory: Object.keys(story).filter((element) => !(element in screen)),
    differences,
  }
}

async function openStory(page: Page, id: string, theme: 'light' | 'dark', held = false) {
  await page.goto(`${STORYBOOK}/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`)
  await page.waitForFunction(() =>
    ['completed', 'finished', 'afterEach'].includes(
      window.__STORYBOOK_PREVIEW__?.currentRender?.phase ?? '',
    ),
  )
  await page.evaluate(() => document.fonts.ready)
  // A story that holds a request open never lets the network go quiet.
  if (!held) await page.waitForLoadState('networkidle')
}

async function sideBySide(page: Page, screen: Buffer, story: Buffer, path: string) {
  const image = (buffer: Buffer) => `data:image/png;base64,${buffer.toString('base64')}`
  await page.setContent(`
    <body style="margin:0;font:14px sans-serif;display:flex;gap:16px;padding:16px;background:#ddd;width:max-content">
      <figure style="margin:0"><figcaption>Running screen</figcaption><img src="${image(screen)}"></figure>
      <figure style="margin:0"><figcaption>Story</figcaption><img src="${image(story)}"></figure>
    </body>`)
  await page.screenshot({ path, fullPage: true })
}

interface Case {
  /** LIQ-009 inventory ID. */
  id: string
  /** What is compared, for the results folder. */
  name: string
  /** The story's ID in the built Storybook. */
  story: string
  /** Opens the running screen and returns the component there. */
  screen: (page: Page) => Promise<Locator>
  /** The component in the story. */
  inStory: (page: Page) => Promise<Locator> | Locator
  /** Captures the window instead of the component, for popups. */
  viewport?: boolean
  /** Opens both sides at a phone's width. */
  phone?: boolean
  /** Opens both sides in a window this size, for a component taller than a sheet shows. */
  window?: { width: number; height: number }
  /** The story holds a request open, to show what loads. */
  held?: boolean
  /** Elements painted out of both images, in place of the key mask. */
  paintedOut?: string
  /** Removes what the case made through the running screen. */
  after?: () => Promise<void>
}

async function adminPage(page: Page, path: string) {
  const session = await login(page)
  await page.goto(`/${session.store_id}${path}`)
  await page.waitForLoadState('networkidle')
}

async function sellerPage(page: Page, path: string) {
  const home = await sellerLogin(page)
  await page.goto(`${home}${path}`)
  await page.waitForLoadState('networkidle')
}

const card = (page: Page, title: string) =>
  page.locator('[data-slot="card"]').filter({ has: page.getByText(title, { exact: true }) })
const paginationRow = (page: Page) =>
  page.locator('[class="flex items-center justify-between ps-2 py-2"]').first()
const balances = (page: Page) =>
  page.locator('[class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"]').first()

const pilotCases: Case[] = [
  {
    id: 'CMP-SP-G-01',
    name: 'balance-summary-one-currency',
    story: 'seller-panel-finance-balance-summary--one-currency',
    screen: async (page) => {
      await sellerPage(page, '/earnings')
      return balances(page)
    },
    inStory: balances,
  },
  {
    id: 'CMP-DA-G-01',
    name: 'api-key-table-publishable',
    story: 'admin-dashboard-api-keys-api-key-table--publishable-keys',
    screen: async (page) => {
      await adminPage(page, '/settings/api-keys')
      return card(page, 'Publishable keys')
    },
    inStory: (page) => card(page, 'Publishable keys'),
  },
  {
    id: 'CMP-DA-G-01',
    name: 'api-key-table-empty',
    story: 'admin-dashboard-api-keys-api-key-table--empty',
    screen: async (page) => {
      await adminPage(page, '/settings/api-keys')
      return card(page, 'Secret keys')
    },
    inStory: (page) => card(page, 'Secret keys'),
  },
  {
    id: 'CMP-DUI-P-29',
    name: 'pagination-one-page',
    story: 'dashboard-ui-primitives-pagination--one-page-with-page-size',
    screen: async (page) => {
      await sellerPage(page, '/earnings')
      return paginationRow(page)
    },
    inStory: paginationRow,
  },
  {
    id: 'CMP-DUI-P-35',
    name: 'select-default',
    story: 'dashboard-ui-primitives-select--default',
    screen: async (page) => {
      await adminPage(page, '/products')
      await page.getByRole('link', { name: 'E2E Inventory Product' }).click()
      await page.waitForLoadState('networkidle')
      return card(page, 'Status').locator('[data-slot="select-trigger"]')
    },
    inStory: (page) => page.locator('[data-slot="select-trigger"]'),
  },
  {
    id: 'CMP-DUI-P-35',
    name: 'select-open',
    story: 'dashboard-ui-primitives-select--open',
    viewport: true,
    screen: async (page) => {
      await adminPage(page, '/products')
      await page.getByRole('link', { name: 'E2E Inventory Product' }).click()
      await page.waitForLoadState('networkidle')
      await card(page, 'Status').locator('[data-slot="select-trigger"]').click()
      return page.locator('[data-slot="select-content"]')
    },
    inStory: (page) => page.locator('[data-slot="select-content"]'),
  },
  {
    id: 'CMP-DUI-C-03',
    name: 'back-button',
    story: 'dashboard-ui-composed-back-button--default',
    screen: async (page) => {
      await adminPage(page, '/products')
      await page.getByRole('link', { name: 'E2E Inventory Product' }).click()
      await page.waitForLoadState('networkidle')
      return page.getByRole('button', { name: 'Back' }).first()
    },
    inStory: (page) => page.getByRole('button', { name: 'Back' }),
  },
  {
    id: 'CMP-DUI-P-07',
    name: 'button-default-with-icon',
    story: 'dashboard-ui-primitives-button--with-icon',
    screen: async (page) => {
      await adminPage(page, '/settings/api-keys')
      return page.getByRole('button', { name: 'New key' })
    },
    inStory: (page) => page.locator('[data-slot="button"]').first(),
  },
  {
    id: 'CMP-DUI-P-07',
    name: 'button-focus-visible',
    story: 'dashboard-ui-primitives-button--focus-visible',
    screen: async (page) => {
      await adminPage(page, '/settings/api-keys')
      const button = page.getByRole('button', { name: 'New key' })
      await button.focus()
      return button
    },
    inStory: (page) => page.locator('[data-slot="button"]').first(),
  },
  {
    id: 'CMP-DUI-C-03',
    name: 'back-button-focus-visible',
    story: 'dashboard-ui-composed-back-button--focus-visible',
    screen: async (page) => {
      await adminPage(page, '/products')
      await page.getByRole('link', { name: 'E2E Inventory Product' }).click()
      await page.waitForLoadState('networkidle')
      const button = page.getByRole('button', { name: 'Back' }).first()
      await page.keyboard.press('Tab')
      await button.focus()
      return button
    },
    inStory: (page) => page.getByRole('button', { name: 'Back' }),
  },
  {
    id: 'CMP-DUI-P-07',
    name: 'button-outline',
    story: 'dashboard-ui-primitives-button--outline',
    screen: async (page) => {
      await adminPage(page, '/settings/stock-locations')
      await page.getByText('Shop location', { exact: true }).click()
      return page.getByRole('button', { name: 'Cancel' })
    },
    inStory: (page) => page.locator('[data-slot="button"]').first(),
  },
  {
    id: 'CMP-CORE-06',
    name: 'country-combobox-selected',
    story: 'dashboard-core-country-combobox--selected',
    screen: async (page) => {
      await adminPage(page, '/settings/stock-locations')
      await page.getByText('Shop location', { exact: true }).click()
      return page.locator('[data-slot="combobox-button-trigger"]').first()
    },
    inStory: (page) => page.locator('[data-slot="combobox-button-trigger"]'),
  },
  {
    id: 'CMP-CORE-06',
    name: 'country-combobox-open',
    story: 'dashboard-core-country-combobox--open',
    viewport: true,
    screen: async (page) => {
      await adminPage(page, '/settings/stock-locations')
      await page.getByText('Shop location', { exact: true }).click()
      await page.locator('[data-slot="combobox-button-trigger"]').first().click()
      return page.locator('[data-slot="combobox-content"]')
    },
    inStory: (page) => page.locator('[data-slot="combobox-content"]'),
  },
]

const story = (id: string) => `dashboard-ui-primitives-${id}`
const slot = (page: Page, name: string) => page.locator(`[data-slot="${name}"]`)
const storeSettingsCard = (page: Page, title: string) =>
  card(page, title).filter({ has: page.locator('[data-slot="card-title"]', { hasText: title }) })

async function productsList(page: Page) {
  await adminPage(page, '/products')
  await expect(slot(page, 'thumbnail').first()).toBeVisible({ timeout: 20_000 })
}

async function productDetail(page: Page) {
  await adminPage(page, '/products')
  await page.getByRole('link', { name: 'E2E Inventory Product' }).click()
  await page.waitForLoadState('networkidle')
}

/** Holds every Admin API request for a path open, so the screen stays in its loading state. */
async function holdRequests(page: Page, pattern: string) {
  await page.route(pattern, () => new Promise(() => {}))
}

/** Moves keyboard focus onto an element the way a keyboard user does, so it shows its focus ring. */
async function keyboardFocus(page: Page, target: Locator) {
  await page.keyboard.press('Tab')
  await target.focus()
  return target
}

/** The first dashboard primitives batch (#9), compared with the screens that use each component. */
const primitivesBatchOne: Case[] = [
  {
    id: 'CMP-DUI-P-01',
    name: 'accordion-one-open',
    story: story('accordion--one-open'),
    screen: async (page) => {
      await adminPage(page, '/getting-started')
      return slot(page, 'accordion').first()
    },
    inStory: (page) => slot(page, 'accordion'),
  },
  {
    id: 'CMP-DUI-P-04',
    name: 'avatar-initials',
    story: story('avatar--initials'),
    screen: async (page) => {
      await adminPage(page, '/orders')
      await page.getByRole('link', { name: 'R1001' }).first().click()
      await page.waitForLoadState('networkidle')
      return slot(page, 'avatar').first()
    },
    inStory: (page) => slot(page, 'avatar'),
  },
  {
    id: 'CMP-DUI-P-05',
    name: 'badge-default',
    story: story('badge--variants'),
    screen: async (page) => {
      await adminPage(page, '/settings/roles')
      return page.locator('[data-slot="badge"][data-variant="default"]').first()
    },
    inStory: (page) => page.locator('[data-slot="badge"][data-variant="default"]').first(),
  },
  {
    id: 'CMP-DUI-P-05',
    name: 'badge-secondary',
    story: story('badge--variants'),
    screen: async (page) => {
      await adminPage(page, '/settings/roles')
      return page.locator('[data-slot="badge"][data-variant="secondary"]').first()
    },
    inStory: (page) => page.locator('[data-slot="badge"][data-variant="secondary"]').first(),
  },
  {
    id: 'CMP-DUI-P-05',
    name: 'badge-info',
    story: story('badge--variants'),
    screen: async (page) => {
      await adminPage(page, '/settings/staff')
      return page.locator('[data-slot="badge"][data-variant="info"]').first()
    },
    inStory: (page) => page.locator('[data-slot="badge"][data-variant="info"]').first(),
  },
  {
    id: 'CMP-DUI-P-06',
    name: 'breadcrumb-default',
    story: story('breadcrumb--default'),
    screen: async (page) => {
      await adminPage(page, '/settings/store')
      return slot(page, 'breadcrumb').first()
    },
    inStory: (page) => slot(page, 'breadcrumb'),
  },
  {
    id: 'CMP-DUI-P-09',
    name: 'card-default',
    story: story('card--default'),
    screen: async (page) => {
      await adminPage(page, '/settings/store')
      return storeSettingsCard(page, 'General')
    },
    inStory: (page) => slot(page, 'card').first(),
  },
  {
    id: 'CMP-DUI-P-11',
    name: 'checkbox-unchecked',
    story: story('checkbox--unchecked'),
    screen: async (page) => {
      await productsList(page)
      return page.locator('tbody [data-slot="checkbox"]').first()
    },
    inStory: (page) => slot(page, 'checkbox'),
  },
  {
    id: 'CMP-DUI-P-11',
    name: 'checkbox-checked',
    story: story('checkbox--checked'),
    screen: async (page) => {
      await productsList(page)
      const checkbox = page.locator('tbody [data-slot="checkbox"]').first()
      await checkbox.click()
      await checkbox.blur()
      await page.mouse.move(0, 0)
      return checkbox
    },
    inStory: (page) => slot(page, 'checkbox'),
  },
  {
    id: 'CMP-DUI-P-11',
    name: 'checkbox-indeterminate',
    story: story('checkbox--indeterminate'),
    screen: async (page) => {
      await productsList(page)
      const row = page.locator('tbody [data-slot="checkbox"]').first()
      await row.click()
      await row.blur()
      await page.mouse.move(0, 0)
      return page.locator('thead [data-slot="checkbox"]').first()
    },
    inStory: (page) => slot(page, 'checkbox'),
  },
  {
    id: 'CMP-DUI-P-11',
    name: 'checkbox-focus-visible',
    story: story('checkbox--focus-visible'),
    screen: async (page) => {
      await productsList(page)
      return keyboardFocus(page, page.locator('tbody [data-slot="checkbox"]').first())
    },
    inStory: (page) => slot(page, 'checkbox'),
  },
  {
    id: 'CMP-DUI-P-13',
    name: 'collapsible-open',
    story: story('collapsible--open'),
    screen: async (page) => {
      await adminPage(page, '/settings/stock-locations')
      await page.getByText('Shop location', { exact: true }).click()
      return slot(page, 'collapsible').first()
    },
    inStory: (page) => slot(page, 'collapsible'),
  },
  {
    id: 'CMP-DUI-P-22',
    name: 'empty-title-and-description',
    story: story('empty--default'),
    screen: async (page) => {
      await adminPage(page, '/does-not-exist')
      return slot(page, 'empty').first()
    },
    inStory: (page) => slot(page, 'empty'),
  },
  {
    id: 'CMP-DUI-P-23',
    name: 'field-vertical',
    story: story('field--vertical'),
    screen: async (page) => {
      await adminPage(page, '/settings/store')
      return storeSettingsCard(page, 'General').locator('[data-slot="field"]').first()
    },
    inStory: (page) => slot(page, 'field').first(),
  },
  {
    id: 'CMP-DUI-P-23',
    name: 'field-invalid',
    story: story('field--invalid'),
    screen: async (page) => {
      await adminPage(page, '/settings/store')
      const general = storeSettingsCard(page, 'General')
      await general.locator('input').first().fill('')
      await page.getByRole('button', { name: 'Save' }).click()
      await expect(general.locator('[data-slot="field-error"]')).toBeVisible()
      await page.mouse.click(1, 1)
      return general.locator('[data-slot="field"]').first()
    },
    inStory: (page) => slot(page, 'field').first(),
  },
  {
    id: 'CMP-DUI-P-23',
    name: 'field-set',
    story: story('field--fieldset'),
    screen: async (page) => {
      // The metrics set is taller than the window; a taller window keeps the page header off it.
      await page.setViewportSize({ width: 1280, height: 1600 })
      await adminPage(page, '/reports/new')
      return slot(page, 'field-set').first()
    },
    inStory: (page) => slot(page, 'field-set'),
  },
  {
    id: 'CMP-DUI-P-24',
    name: 'input-group-suffix',
    story: story('input-group--percent-suffix'),
    screen: async (page) => {
      await adminPage(page, '/settings/store')
      return page
        .locator('[data-slot="card"] [data-slot="input-group"]')
        .filter({ hasText: 'units' })
        .first()
    },
    inStory: (page) => slot(page, 'input-group'),
  },
  {
    id: 'CMP-DUI-P-25',
    name: 'input-filled',
    story: story('input--filled'),
    screen: async (page) => {
      await adminPage(page, '/settings/store')
      return storeSettingsCard(page, 'General').locator('[data-slot="input"]').first()
    },
    inStory: (page) => slot(page, 'input'),
  },
  {
    id: 'CMP-DUI-P-25',
    name: 'input-focused',
    story: story('input--focused'),
    screen: async (page) => {
      await adminPage(page, '/settings/store')
      const input = storeSettingsCard(page, 'General').locator('[data-slot="input"]').first()
      await input.focus()
      return input
    },
    inStory: (page) => slot(page, 'input'),
  },
  {
    id: 'CMP-DUI-P-25',
    name: 'input-invalid',
    story: story('input--invalid'),
    screen: async (page) => {
      await adminPage(page, '/settings/store')
      const general = storeSettingsCard(page, 'General')
      await general.locator('input').first().fill('')
      await page.getByRole('button', { name: 'Save' }).click()
      await expect(general.locator('[data-slot="field-error"]')).toBeVisible()
      await page.mouse.click(1, 1)
      return general.locator('[data-slot="input"]').first()
    },
    inStory: (page) => slot(page, 'input'),
  },
  {
    id: 'CMP-DUI-P-26',
    name: 'item-outline',
    story: story('item--outline'),
    screen: async (page) => {
      await adminPage(page, '/customers')
      await page.getByRole('row').filter({ hasText: 'Promo Customer' }).locator('a').first().click()
      await expect(page.getByRole('heading', { name: 'Promo Customer' })).toBeVisible()
      await page.waitForLoadState('networkidle')
      return slot(page, 'item').first()
    },
    inStory: (page) => slot(page, 'item').first(),
  },
  {
    id: 'CMP-DUI-P-27',
    name: 'label-default',
    story: story('label--default'),
    screen: async (page) => {
      await page.goto('/forgot-password')
      await page.waitForLoadState('networkidle')
      return slot(page, 'label').first()
    },
    inStory: (page) => slot(page, 'label'),
  },
  {
    id: 'CMP-DUI-P-31',
    name: 'progress-with-value',
    story: story('progress--with-value'),
    screen: async (page) => {
      await adminPage(page, '/getting-started')
      return slot(page, 'progress').first()
    },
    inStory: (page) => slot(page, 'progress'),
  },
  {
    id: 'CMP-DUI-P-32',
    name: 'radio-group-choice-cards',
    story: story('field--choice-cards'),
    screen: async (page) => {
      await adminPage(page, '/settings/store')
      return slot(page, 'radio-group').first()
    },
    inStory: (page) => slot(page, 'radio-group'),
  },
  {
    id: 'CMP-DUI-P-34',
    name: 'scroll-area-vertical',
    story: story('scroll-area--vertical'),
    screen: async (page) => {
      await adminPage(page, '')
      return slot(page, 'scroll-area').first()
    },
    inStory: (page) => slot(page, 'scroll-area'),
  },
  {
    id: 'CMP-DUI-P-36',
    name: 'separator-horizontal',
    story: story('separator--horizontal'),
    screen: async (page) => {
      await adminPage(page, '/orders')
      await page.getByRole('link', { name: 'R1001' }).first().click()
      await page.waitForLoadState('networkidle')
      return slot(page, 'separator').first()
    },
    inStory: (page) => slot(page, 'separator'),
  },
  {
    id: 'CMP-DUI-P-39',
    name: 'skeleton-row',
    story: story('skeleton--row'),
    screen: async (page) => {
      const session = await login(page)
      await holdRequests(page, '**/api/v3/admin/products?**')
      await page.goto(`/${session.store_id}/products`)
      return page
        .locator('tbody tr')
        .filter({ has: slot(page, 'skeleton') })
        .first()
    },
    inStory: (page) => slot(page, 'skeleton').first().locator('..'),
  },
  {
    id: 'CMP-DUI-P-41',
    name: 'switch-on',
    story: story('switch--on'),
    screen: async (page) => {
      await adminPage(page, '/settings/store')
      return page.locator('[data-slot="switch"][data-checked]').first()
    },
    inStory: (page) => slot(page, 'switch'),
  },
  {
    id: 'CMP-DUI-P-41',
    name: 'switch-off',
    story: story('switch--off'),
    screen: async (page) => {
      await adminPage(page, '/settings/store')
      return page.locator('[data-slot="switch"][data-unchecked]').first()
    },
    inStory: (page) => slot(page, 'switch'),
  },
  {
    id: 'CMP-DUI-P-41',
    name: 'switch-focus-visible',
    story: story('switch--focus-visible'),
    screen: async (page) => {
      await adminPage(page, '/settings/store')
      return keyboardFocus(page, page.locator('[data-slot="switch"][data-unchecked]').first())
    },
    inStory: (page) => slot(page, 'switch'),
  },
  {
    id: 'CMP-DUI-P-42',
    name: 'tabs-default',
    story: story('tabs--default'),
    screen: async (page) => {
      await adminPage(page, '/settings/taxes')
      return slot(page, 'tabs-list').first()
    },
    inStory: (page) => slot(page, 'tabs-list'),
  },
  {
    id: 'CMP-DUI-P-43',
    name: 'textarea-empty',
    story: story('textarea--empty'),
    screen: async (page) => {
      await productDetail(page)
      return slot(page, 'textarea').first()
    },
    inStory: (page) => slot(page, 'textarea'),
  },
  {
    id: 'CMP-DUI-P-44',
    name: 'thumbnail-custom-fallback',
    story: story('thumbnail--custom-fallback'),
    screen: async (page) => {
      await productsList(page)
      return slot(page, 'thumbnail').first()
    },
    inStory: (page) => slot(page, 'thumbnail'),
  },
]

/** The page header: the `<header>` that holds the page's only first-level heading. */
const pageHeader = (page: Page) =>
  page
    .locator('header')
    .filter({ has: page.getByRole('heading', { level: 1 }) })
    .first()
const tableCard = (page: Page) =>
  page
    .locator('[data-slot="card"]')
    .filter({ has: page.getByRole('table') })
    .first()
const permissionGrid = (scope: Page | Locator) =>
  scope.locator('div.rounded-md.border').filter({ hasText: 'Resource' }).first()
const authShell = (page: Page) => page.locator('.min-h-svh').first()

/** Signs in as a seeded teammate through the API, as the capture script does. */
async function teammatePage(page: Page, email: string, path = '/') {
  const res = await page.request.post('/api/v3/admin/auth/login', {
    data: { email, password: PASSWORD },
  })
  expect(res.ok(), await res.text()).toBeTruthy()
  await page.goto(path)
  await page.waitForLoadState('networkidle')
}

async function staffPage(page: Page) {
  await adminPage(page, '/settings/staff')
  await expect(page.locator('tr').filter({ hasText: pendingEmail })).toBeVisible({
    timeout: 20_000,
  })
}

async function rolesPage(page: Page) {
  await adminPage(page, '/settings/roles')
  await expect(roleRow(page, roles.unused.name)).toBeVisible({ timeout: 20_000 })
}

async function openRoleSheet(page: Page) {
  await rolesPage(page)
  await page.getByRole('button', { name: /add role/i }).click()
  await expect(page.getByRole('dialog').getByRole('button', { name: /^save$/i })).toBeVisible()
}

// Staff access part 1: each new story beside the same component on the
// staff, roles and sign-in screens, with the staff and roles `staff.ts` seeds.
const staffAccessPartOne: Case[] = [
  {
    id: 'CMP-CORE-20',
    name: 'page-header-staff',
    story: 'dashboard-core-page-header--default',
    screen: async (page) => {
      await staffPage(page)
      return pageHeader(page)
    },
    inStory: pageHeader,
  },
  {
    id: 'CMP-DUI-C-19',
    name: 'external-link-in-a-description',
    story: 'dashboard-ui-composed-external-link--in-a-description',
    screen: async (page) => {
      await staffPage(page)
      return slot(page, 'external-link').first()
    },
    inStory: (page) => slot(page, 'external-link'),
  },
  {
    id: 'CMP-DUI-P-17',
    name: 'data-table-members',
    story: 'dashboard-ui-primitives-data-table--default',
    screen: async (page) => {
      await staffPage(page)
      return card(page, 'Members')
    },
    inStory: tableCard,
  },
  {
    id: 'CMP-DUI-P-17',
    name: 'data-table-roles',
    story: 'dashboard-ui-primitives-data-table--roles',
    screen: async (page) => {
      await rolesPage(page)
      return tableCard(page)
    },
    inStory: tableCard,
  },
  {
    id: 'CMP-DUI-C-38',
    name: 'relative-time-future',
    story: 'dashboard-ui-composed-relative-time--future',
    screen: async (page) => {
      await staffPage(page)
      return page.locator('tr').filter({ hasText: pendingEmail }).locator('time')
    },
    inStory: (page) => page.locator('time'),
  },
  {
    id: 'CMP-DUI-C-45',
    name: 'row-actions-open',
    story: 'dashboard-ui-composed-row-actions--open',
    viewport: true,
    screen: async (page) => {
      await staffPage(page)
      await openRowMenu(page, teammates.support.email)
      return slot(page, 'dropdown-menu-content')
    },
    inStory: (page) => slot(page, 'dropdown-menu-content'),
  },
  {
    id: 'CMP-DUI-P-20',
    name: 'dialog-invite',
    story: 'dashboard-ui-primitives-dialog--default',
    viewport: true,
    screen: async (page) => {
      await staffPage(page)
      await page.getByRole('button', { name: /invite teammate/i }).click()
      return slot(page, 'dialog-content')
    },
    inStory: (page) => slot(page, 'dialog-content'),
  },
  {
    id: 'CMP-DUI-P-20',
    name: 'dialog-role-required',
    story: 'dashboard-ui-primitives-dialog--field-errors',
    viewport: true,
    screen: async (page) => {
      await staffPage(page)
      await page.getByRole('button', { name: /invite teammate/i }).click()
      await page.locator('#invite-email').fill('fidelity-unsent@example.com')
      await page.getByRole('button', { name: /send invitation/i }).click()
      await expect(page.getByRole('alert').filter({ hasText: /pick a role/i })).toBeVisible()
      return slot(page, 'dialog-content')
    },
    inStory: (page) => slot(page, 'dialog-content'),
  },
  {
    id: 'CMP-DUI-P-37',
    name: 'sheet-edit-teammate',
    story: 'dashboard-ui-primitives-sheet--default',
    viewport: true,
    screen: async (page) => {
      await staffPage(page)
      await openRowMenu(page, teammates.support.email)
      await page.getByRole('menuitem', { name: /^edit$/i }).click()
      await expect(page.locator('#staff-first-name')).toBeVisible()
      return slot(page, 'sheet-content')
    },
    inStory: (page) => slot(page, 'sheet-content'),
  },
  {
    id: 'CMP-DUI-C-10',
    name: 'confirm-remove-teammate',
    story: 'dashboard-ui-composed-confirm-dialog--remove-teammate',
    viewport: true,
    screen: async (page) => {
      await staffPage(page)
      await openRowMenu(page, teammates.support.email)
      await page.getByRole('menuitem', { name: /remove from staff/i }).click()
      return slot(page, 'dialog-content')
    },
    inStory: (page) => slot(page, 'dialog-content'),
  },
  {
    id: 'CMP-DUI-C-10',
    name: 'confirm-delete-role',
    story: 'dashboard-ui-composed-confirm-dialog--delete-role',
    viewport: true,
    screen: async (page) => {
      await rolesPage(page)
      await openRoleMenu(page, roles.unused.name)
      await page.getByRole('menuitem', { name: /delete/i }).click()
      return slot(page, 'dialog-content')
    },
    inStory: (page) => slot(page, 'dialog-content'),
  },
  {
    id: 'CMP-DUI-P-45',
    name: 'toast-invitation-resent',
    story: 'dashboard-ui-primitives-toast--success',
    viewport: true,
    screen: async (page) => {
      await staffPage(page)
      await openRowMenu(page, pendingEmail)
      await page.getByRole('menuitem', { name: /^resend$/i }).click()
      return slot(page, 'toast').filter({ hasText: /invitation resent/i })
    },
    inStory: (page) => slot(page, 'toast'),
  },
  {
    id: 'CMP-DUI-P-46',
    name: 'tooltip-more-permissions',
    story: 'dashboard-ui-primitives-tooltip--list',
    viewport: true,
    screen: async (page) => {
      await rolesPage(page)
      await roleRow(page, roles.orderManager.name)
        .getByRole('button', { name: /\+\d+ more/i })
        .hover()
      return slot(page, 'tooltip-content')
    },
    inStory: (page) => slot(page, 'tooltip-content'),
  },
  {
    id: 'CMP-DUI-C-44',
    name: 'route-error-not-found',
    story: 'dashboard-ui-composed-route-error-boundary--not-found',
    screen: async (page) => {
      await adminPage(page, '/fidelity-no-such-page')
      return slot(page, 'empty')
    },
    inStory: (page) => slot(page, 'empty'),
  },
  {
    id: 'CMP-DUI-P-02',
    name: 'alert-sign-in-providers-failed',
    story: 'dashboard-ui-primitives-alert--destructive',
    screen: async (page) => {
      await page.route('**/api/v3/admin/auth/providers', (route) =>
        route.fulfill({
          status: 500,
          json: { error: { code: 'internal_error', message: 'Internal error' } },
        }),
      )
      await page.goto('/login')
      return slot(page, 'alert')
    },
    inStory: (page) => slot(page, 'alert'),
  },
  {
    id: 'CMP-DA-G-24',
    name: 'auth-shell-forgot-password',
    story: 'admin-dashboard-sign-in-auth-shell--with-a-form',
    viewport: true,
    screen: async (page) => {
      await page.goto('/forgot-password')
      await page.waitForLoadState('networkidle')
      return authShell(page)
    },
    inStory: authShell,
  },
  {
    id: 'CMP-DA-G-24',
    name: 'auth-shell-invitation-not-found',
    story: 'admin-dashboard-sign-in-auth-shell--with-a-message',
    viewport: true,
    screen: async (page) => {
      await page.goto('/accept-invitation/inv_doesnotexist?token=fidelity-invented-token')
      await expect(page.getByText(/invitation not found/i)).toBeVisible({ timeout: 15_000 })
      return authShell(page)
    },
    inStory: authShell,
  },
  {
    id: 'CMP-DA-G-24',
    name: 'no-store-access',
    story: 'admin-dashboard-sign-in-no-store-access--default',
    viewport: true,
    screen: async (page) => {
      await teammatePage(page, removed.email)
      await expect(page.getByText(/access to any store/i)).toBeVisible({ timeout: 15_000 })
      return authShell(page)
    },
    inStory: authShell,
  },
  {
    id: 'CMP-DA-G-24',
    name: 'permission-grid-new-role',
    story: 'admin-dashboard-roles-permission-picker--nothing-granted',
    screen: async (page) => {
      await openRoleSheet(page)
      return permissionGrid(page.getByRole('dialog'))
    },
    inStory: permissionGrid,
  },
  {
    id: 'CMP-DA-G-24',
    name: 'role-sheet-new-role',
    story: 'admin-dashboard-roles-role-sheet--new-role',
    viewport: true,
    screen: async (page) => {
      await openRoleSheet(page)
      return slot(page, 'sheet-content')
    },
    inStory: (page) => slot(page, 'sheet-content'),
  },
  {
    id: 'CMP-DA-G-24',
    name: 'role-sheet-admin-role',
    story: 'admin-dashboard-roles-role-sheet--protected-role',
    viewport: true,
    screen: async (page) => {
      await rolesPage(page)
      await page.getByRole('cell', { name: /^admin/i }).click()
      await expect(page.locator('#role-name')).toBeDisabled({ timeout: 15_000 })
      return slot(page, 'sheet-content')
    },
    inStory: (page) => slot(page, 'sheet-content'),
  },
]

const phone = { width: 390, height: 844 }
const rail = (page: Page) => page.locator('[data-slot="sidebar-inner"]').first()
const settingsRail = (page: Page) =>
  page.getByRole('complementary', { name: 'Settings navigation' })
const phoneTopBar = (page: Page) => page.locator('[class*="sticky top-0 z-30 flex h-14"]').first()
const menu = (page: Page) => page.getByRole('menu')
const sheetTopBar = (page: Page) => page.locator('[class*="min-h-8 items-center gap-2 px-4 pt-3"]')

/** Folds the rail, as the merchant does with its trigger; the top bar's breadcrumbs show only then. */
async function collapseRail(page: Page) {
  await page.getByRole('button', { name: 'Toggle Sidebar' }).click()
  await expect(page.locator('[data-slot="sidebar"][data-state="collapsed"]')).toBeVisible()
}
const themeRow = (page: Page) =>
  page
    .locator('div')
    .filter({ has: page.getByRole('button', { name: 'System', exact: true }) })
    .filter({ hasText: 'Theme' })
    .last()
const languageRow = (page: Page) =>
  page
    .locator('div')
    .filter({ has: page.locator('select') })
    .filter({ hasText: 'Language' })
    .last()
const searchField = (scope: Page | Locator) =>
  scope.locator('[data-slot="input-group"]:has([role="searchbox"])').first()
const uploadField = (page: Page) =>
  page
    .locator('label')
    .filter({ has: page.locator('input[type="file"]') })
    .first()
const dialog = (page: Page) => page.getByRole('dialog')

async function openPalette(page: Page, query?: string) {
  await page.getByRole('button', { name: /search anything/i }).click()
  const input = page.getByPlaceholder('Search products, orders, customers…')
  await expect(input).toBeVisible()
  if (query) await input.fill(query)
}

async function openProfile(page: Page) {
  await page.getByRole('button', { name: 'User menu' }).click()
  await page.getByRole('menuitem', { name: 'Edit Profile' }).click()
  await expect(page.getByLabel('First name')).toBeVisible()
}

/**
 * Answers the navigation's counters with the stories' counts. Nothing is open
 * in the browser tests' store, so its badges would otherwise stay empty.
 */
async function answerCounters(page: Page) {
  await page.route('**/api/v3/admin/dashboard/counters**', (route) =>
    route.fulfill({ json: { channel_id: null, counters: dashboardCounters } }),
  )
}

/** The template teammates' rails beside the template stories (DA-OVL-01's permission evidence). */
const templateRails = (['orderManager', 'merchandiser', 'support'] as const).map(
  (key): Case => ({
    id: 'CMP-CORE-03',
    name: `app-sidebar-${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`,
    story: `dashboard-core-shell-app-sidebar--${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`,
    viewport: true,
    screen: async (page) => {
      await answerCounters(page)
      await teammatePage(page, teammates[key].email)
      return rail(page)
    },
    inStory: rail,
  }),
)

// Staff access part 2: the shell and its overlays beside the same parts of the
// running dashboard. The rail is captured as the window, since it fills it.
const staffAccessPartTwo: Case[] = [
  {
    id: 'CMP-CORE-03',
    name: 'app-sidebar-admin',
    story: 'dashboard-core-shell-app-sidebar--admin',
    viewport: true,
    screen: async (page) => {
      await answerCounters(page)
      await adminPage(page, '')
      return rail(page)
    },
    inStory: rail,
  },
  ...templateRails,
  {
    id: 'CMP-CORE-02',
    name: 'app-shell-collapsed',
    story: 'dashboard-core-shell-app-shell--collapsed',
    viewport: true,
    screen: async (page) => {
      await adminPage(page, '/orders')
      await collapseRail(page)
      return rail(page)
    },
    inStory: rail,
  },
  {
    id: 'CMP-CORE-29',
    name: 'settings-sidebar',
    story: 'dashboard-core-shell-app-shell--in-settings',
    viewport: true,
    screen: async (page) => {
      await adminPage(page, '/settings/staff')
      return settingsRail(page)
    },
    inStory: settingsRail,
  },
  {
    id: 'CMP-CORE-36',
    name: 'store-switcher-open',
    story: 'dashboard-core-shell-store-switcher--open',
    viewport: true,
    screen: async (page) => {
      await adminPage(page, '')
      await page.getByRole('button', { name: 'Switch store' }).click()
      return menu(page)
    },
    inStory: menu,
  },
  {
    id: 'CMP-CORE-32',
    name: 'sidebar-user-open',
    story: 'dashboard-core-shell-sidebar-user--unnamed',
    viewport: true,
    screen: async (page) => {
      await adminPage(page, '')
      await page.getByRole('button', { name: 'User menu' }).click()
      return menu(page)
    },
    inStory: menu,
  },
  {
    id: 'CMP-CORE-31',
    name: 'sidebar-search',
    story: 'dashboard-core-shell-sidebar-search--focus-visible',
    screen: async (page) => {
      await adminPage(page, '')
      const search = page.getByRole('button', { name: /search anything/i }).first()
      await search.focus()
      return search
    },
    inStory: (page) => page.getByRole('button', { name: /search anything/i }).first(),
  },
  {
    id: 'CMP-CORE-33',
    name: 'skip-link-focus-visible',
    story: 'dashboard-core-shell-skip-link--focus-visible',
    screen: async (page) => {
      await adminPage(page, '')
      // Tab then starts from the top of the page, as it does on arrival;
      // after a blur it would start from the element that lost focus.
      await page.evaluate(() => {
        document.body.tabIndex = -1
        document.body.focus()
        document.body.removeAttribute('tabindex')
      })
      await page.keyboard.press('Tab')
      return page.getByRole('link', { name: 'Skip to content' })
    },
    inStory: (page) => page.getByRole('link', { name: 'Skip to content' }),
  },
  {
    id: 'CMP-CORE-17',
    name: 'mobile-top-bar',
    story: 'dashboard-core-shell-app-shell--on-a-phone',
    phone: true,
    screen: async (page) => {
      await adminPage(page, '/orders')
      return phoneTopBar(page)
    },
    inStory: phoneTopBar,
  },
  {
    id: 'CMP-CORE-02',
    name: 'app-shell-phone-navigation-open',
    story: 'dashboard-core-shell-app-shell--on-a-phone-navigation-open',
    phone: true,
    viewport: true,
    screen: async (page) => {
      await answerCounters(page)
      await adminPage(page, '/orders')
      await page.getByRole('button', { name: 'Toggle Sidebar' }).click()
      // Off the first link, where the tap that opened the drawer left it.
      await page.mouse.move(370, 800)
      return dialog(page)
    },
    inStory: dialog,
  },
  {
    id: 'CMP-CORE-17',
    name: 'mobile-account-menu',
    story: 'dashboard-core-shell-mobile-top-bar--account-menu-open',
    phone: true,
    viewport: true,
    screen: async (page) => {
      // A teammate with a name, as the story's admin has; the browser tests'
      // admin has none, and its menu then shows only the email.
      await teammatePage(page, teammates.support.email, `/${getCredentials().store_id}/orders`)
      await page.getByRole('button', { name: 'User menu' }).click()
      return menu(page)
    },
    inStory: menu,
  },
  {
    id: 'CMP-CORE-39',
    name: 'breadcrumbs-phone-settings',
    story: 'dashboard-core-shell-top-bar-breadcrumbs--on-a-phone-in-settings',
    phone: true,
    screen: async (page) => {
      await adminPage(page, '/settings/staff')
      return page.getByRole('navigation', { name: 'Breadcrumb' }).last()
    },
    inStory: (page) => page.getByRole('navigation', { name: 'Breadcrumb' }).last(),
  },
  {
    id: 'CMP-DA-G-05',
    name: 'command-palette-open',
    story: 'admin-dashboard-shell-command-palette--open',
    viewport: true,
    screen: async (page) => {
      await adminPage(page, '')
      await openPalette(page)
      await expect(page.getByRole('option', { name: 'Home' })).toBeVisible()
      return dialog(page)
    },
    inStory: dialog,
  },
  {
    id: 'CMP-DA-G-05',
    name: 'command-palette-create-actions',
    story: 'admin-dashboard-shell-command-palette--create-actions',
    viewport: true,
    screen: async (page) => {
      await adminPage(page, '')
      await openPalette(page, 'new')
      await expect(page.getByRole('option', { name: 'New Product' })).toBeVisible()
      return dialog(page)
    },
    inStory: dialog,
  },
  {
    id: 'CMP-DA-G-05',
    name: 'command-palette-nothing-matches',
    story: 'admin-dashboard-shell-command-palette--nothing-matches',
    viewport: true,
    screen: async (page) => {
      await adminPage(page, '')
      await openPalette(page, 'zzqx')
      await expect(page.getByText('No results for "zzqx".')).toBeVisible({ timeout: 15_000 })
      return dialog(page)
    },
    inStory: dialog,
  },
  {
    id: 'CMP-DA-G-24',
    name: 'notifications-empty',
    story: 'admin-dashboard-shell-notifications--nothing-new',
    viewport: true,
    screen: async (page) => {
      await adminPage(page, '')
      await page.getByRole('button', { name: 'Notifications' }).click()
      await expect(page.getByText("You're all caught up.")).toBeVisible()
      return dialog(page)
    },
    inStory: dialog,
  },
  {
    // The browser-test server never reports a newer release, so the running
    // screen is answered with the story's release and notes.
    id: 'CMP-DA-G-24',
    name: 'notifications-new-release',
    story: 'admin-dashboard-shell-notifications--new-release',
    viewport: true,
    screen: async (page) => {
      await page.route('**/api/v3/admin/updates', (route) =>
        route.fulfill({ json: updateAvailable }),
      )
      await page.addInitScript(
        ([key, notes]) => window.localStorage.setItem(key, notes),
        [`spree-release-notes:v${updateAvailable.latest_version}`, releaseNotes],
      )
      await adminPage(page, '')
      await page.getByRole('button', { name: 'Notifications, 1 unread' }).click()
      await expect(page.getByRole('heading', { name: 'Highlights' })).toBeVisible()
      return dialog(page)
    },
    inStory: dialog,
  },
  {
    id: 'CMP-DA-G-24',
    name: 'profile-dialog',
    story: 'admin-dashboard-shell-profile-dialog--default',
    viewport: true,
    screen: async (page) => {
      await adminPage(page, '')
      await openProfile(page)
      return dialog(page)
    },
    inStory: dialog,
  },
  {
    id: 'CMP-DA-G-24',
    name: 'profile-dialog-field-errors',
    story: 'admin-dashboard-shell-profile-dialog--field-errors',
    viewport: true,
    screen: async (page) => {
      await page.route('**/api/v3/admin/me', (route) =>
        route.request().method() === 'PATCH'
          ? route.fulfill({
              status: 422,
              json: {
                error: {
                  code: 'validation_error',
                  message: 'First name is too long (maximum is 100 characters)',
                  details: {
                    first_name: [
                      {
                        code: 'too_long',
                        message: 'is too long (maximum is 100 characters)',
                        specific: false,
                        count: 100,
                      },
                    ],
                  },
                },
              },
            })
          : route.fallback(),
      )
      await adminPage(page, '')
      await openProfile(page)
      await page.getByLabel('First name').fill('Fidelity')
      await page.getByRole('button', { name: 'Save' }).click()
      await expect(
        page.getByText('is too long (maximum is 100 characters)', { exact: true }),
      ).toBeVisible()
      // Off Save, which would otherwise keep its hover colour.
      await page.mouse.move(0, 0)
      return dialog(page)
    },
    inStory: dialog,
  },
  {
    // Captured as the window: in light the placeholder rows are the rail's own
    // colour, which the comparison of both sides shows.
    id: 'CMP-CORE-03',
    name: 'app-sidebar-loading',
    story: 'dashboard-core-shell-app-sidebar--loading',
    viewport: true,
    screen: async (page) => {
      await login(page)
      await page.route('**/api/v3/admin/me', () => new Promise(() => {}))
      await page.goto(`/${getCredentials().store_id}`)
      await expect(rail(page).locator('[data-slot="skeleton"]').first()).toBeAttached({
        timeout: 15_000,
      })
      return rail(page)
    },
    inStory: rail,
    held: true,
  },
  {
    id: 'CMP-CORE-19',
    name: 'nav-main-child-page',
    story: 'dashboard-core-shell-nav-main--child-page',
    viewport: true,
    screen: async (page) => {
      await answerCounters(page)
      await adminPage(page, '/returns')
      return rail(page)
    },
    inStory: rail,
  },
  {
    id: 'CMP-CORE-39',
    name: 'breadcrumbs-child-page',
    story: 'dashboard-core-shell-top-bar-breadcrumbs--child-page',
    screen: async (page) => {
      await adminPage(page, '/returns')
      await collapseRail(page)
      return page.getByRole('navigation', { name: 'Breadcrumb' }).first()
    },
    inStory: (page) => page.getByRole('navigation', { name: 'Breadcrumb' }).first(),
  },
  {
    id: 'CMP-CORE-30',
    name: 'sheet-top-bar-record-page',
    story: 'dashboard-core-shell-sheet-top-bar--record-page',
    screen: async (page) => {
      const session = await login(page)
      const orders = await page.request.get('/api/v3/admin/orders?limit=1', {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'X-Spree-Store-Id': session.store_id,
        },
      })
      const [order] = ((await orders.json()) as { data: { id: string }[] }).data
      await page.goto(`/${session.store_id}/orders/${order.id}`)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 })
      await collapseRail(page)
      return sheetTopBar(page)
    },
    inStory: sheetTopBar,
  },
  {
    id: 'CMP-DUI-P-38',
    name: 'sidebar-primitive-expanded',
    story: 'dashboard-ui-primitives-sidebar--expanded',
    viewport: true,
    screen: async (page) => {
      await adminPage(page, '/orders')
      return rail(page)
    },
    inStory: rail,
  },
  {
    id: 'CMP-DUI-P-21',
    name: 'dropdown-menu-open',
    story: 'dashboard-ui-primitives-dropdown-menu--open',
    viewport: true,
    screen: async (page) => {
      await staffPage(page)
      await openRowMenu(page, teammates.support.email)
      return menu(page)
    },
    inStory: menu,
  },
  {
    id: 'CMP-DUI-P-15',
    name: 'command-in-a-dialog',
    story: 'dashboard-ui-primitives-command--in-a-dialog',
    viewport: true,
    screen: async (page) => {
      await adminPage(page, '')
      await openPalette(page)
      await expect(page.getByRole('option', { name: 'Home' })).toBeVisible()
      return dialog(page)
    },
    inStory: dialog,
  },
  {
    id: 'CMP-DUI-C-53',
    name: 'theme-toggle-system',
    story: 'dashboard-ui-composed-theme-toggle--following-the-system',
    screen: async (page) => {
      await adminPage(page, '')
      await page.getByRole('button', { name: 'User menu' }).click()
      return themeRow(page)
    },
    inStory: themeRow,
  },
  {
    id: 'CMP-DUI-C-30',
    name: 'language-menu-items',
    story: 'dashboard-ui-composed-language-menu-items--default',
    screen: async (page) => {
      await adminPage(page, '')
      await page.getByRole('button', { name: 'User menu' }).click()
      return languageRow(page)
    },
    inStory: languageRow,
  },
  {
    id: 'CMP-DUI-C-47',
    name: 'search-input-empty',
    story: 'dashboard-ui-composed-search-input--empty',
    screen: async (page) => {
      await adminPage(page, '/settings/staff')
      return searchField(settingsRail(page))
    },
    inStory: searchField,
  },
  {
    id: 'CMP-CORE-11',
    name: 'image-upload-field-empty',
    story: 'dashboard-core-image-upload-field--empty',
    screen: async (page) => {
      await adminPage(page, '')
      await openProfile(page)
      return uploadField(page)
    },
    inStory: uploadField,
  },
]

let baseURL = 'http://localhost:5174'
let developers: Developers

const sheet = (page: Page) => slot(page, 'sheet-content')
const dialogPart = (page: Page, name: string, has: string) =>
  page
    .getByRole('dialog')
    .locator(`[data-slot="${name}"]`)
    .filter({ has: page.locator(has) })
    .last()
const innermost = (page: Page, selector: string, has: Locator) =>
  page.locator(selector).filter({ has }).last()
const resourceTable = (page: Page) =>
  innermost(page, 'div.flex.flex-col.gap-3', page.getByRole('table'))
const toolbarRow = (page: Page) =>
  innermost(page, 'div.flex.items-start.gap-2', page.getByRole('button', { name: 'Add filter' }))
const scopePicker = (page: Page) =>
  innermost(page, 'div.flex.flex-col.gap-3', page.locator('#scope-write-all'))
const resourceLayout = (page: Page) =>
  innermost(page, 'div.flex.flex-col.gap-6', page.locator('div.grid.grid-cols-12.gap-6'))
const jsonView = (page: Page) => page.locator('div.font-mono.text-sm.bg-zinc-950').first()
const agentCard = (page: Page) => page.locator('[data-slot="card"]').filter({ hasText: /^Claude/ })
const relayCard = (page: Page) =>
  page.locator('[data-slot="card"]').filter({ hasText: 'E2E Relay' })
const tall = { width: 1280, height: 2400 }

/** Leaves nothing focused or hovered, as a story's scripted clicks leave it. */
async function leaveAlone(page: Page) {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
  await page.mouse.move(0, 0)
}
const comparisonKey = 'Fidelity comparison key'

async function keySheet(page: Page) {
  await adminPage(page, '/settings/api-keys')
  await expect(page.getByText(secretKeys.partner.name)).toBeVisible({ timeout: 15_000 })
  await page.getByRole('button', { name: /new key/i }).click()
  await expect(page.getByRole('checkbox', { name: 'View Products' })).toBeVisible()
  await expect(page.locator('#api-key-name')).toBeFocused()
}

async function agentsPage(page: Page) {
  await adminPage(page, '/settings/ai-agents')
  await expect(agentCard(page).getByText('Ari Connector')).toBeVisible({ timeout: 15_000 })
}

async function connectSheet(page: Page) {
  await agentsPage(page)
  await page.getByRole('button', { name: /connect an agent/i }).click()
  await expect(page.getByRole('dialog').getByText(/choose the assistant/i)).toBeVisible()
}

async function claudeReady(page: Page) {
  await connectSheet(page)
  const opened = page.getByRole('dialog')
  await opened.getByText(/claude\.ai, claude desktop/i).click()
  await opened.getByRole('button', { name: /^continue$/i }).click()
  await expect(opened.getByText(/ready to connect/i)).toBeVisible({ timeout: 15_000 })
  await leaveAlone(page)
}

async function clientSheet(page: Page) {
  await adminPage(page, '/settings/oauth-clients')
  await expect(page.getByRole('row', { name: /Inventory assistant/ })).toBeVisible({
    timeout: 15_000,
  })
  await page.getByRole('button', { name: /register a client/i }).click()
  await expect(page.locator('#oauth-application-name')).toBeVisible()
}

async function originsPage(page: Page) {
  await adminPage(page, '/settings/allowed-origins')
  await expect(rowButton(page, origins[0])).toBeVisible({ timeout: 15_000 })
}

async function webhooksPage(page: Page) {
  await adminPage(page, '/settings/webhooks')
  await expect(rowButton(page, endpoints.orderSync.name)).toBeVisible({ timeout: 15_000 })
}

async function endpointPage(page: Page) {
  await adminPage(page, `/settings/webhooks/${developers.endpointIds.orderSync}`)
  await expect(page.getByRole('heading', { level: 1, name: endpoints.orderSync.name })).toBeVisible(
    { timeout: 15_000 },
  )
  await expect(page.getByText('webhook.test', { exact: true }).first()).toBeVisible({
    timeout: 15_000,
  })
}

/** Opens E2E Relay's sheet: Connect when it is not connected, Configure when it is. */
async function relaySheet(page: Page, relay: 'none' | 'active') {
  await setRelay(baseURL, relay)
  await adminPage(page, '/settings/integrations')
  await expect(relayCard(page)).toBeVisible({ timeout: 15_000 })
  await relayCard(page)
    .getByRole('button', { name: relay === 'none' ? /^connect$/i : /^configure$/i })
    .click()
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'E2E Relay' })).toBeVisible({
    timeout: 15_000,
  })
}

// Batch 2, developer and integration settings: each new story beside the same
// component on the API keys, OAuth clients, AI agents, allowed origins,
// webhooks and integrations screens, with the records `developers.ts` seeds.
// Keys, tokens and client IDs sit in `code` on these screens, often beneath a
// sheet, so every case paints them out.
const developerSettings: Case[] = (
  [
    {
      id: 'CMP-DA-G-01',
      name: 'api-key-create-sheet-secret-key',
      story: 'admin-dashboard-api-keys-create-sheet--secret-key',
      viewport: true,
      screen: async (page) => {
        await keySheet(page)
        return sheet(page)
      },
      inStory: sheet,
    },
    {
      id: 'CMP-DA-G-01',
      name: 'api-key-scope-picker-nothing-chosen',
      story: 'admin-dashboard-api-keys-scope-picker--nothing-chosen',
      window: tall,
      screen: async (page) => {
        await keySheet(page)
        return scopePicker(page)
      },
      inStory: scopePicker,
    },
    {
      id: 'CMP-DA-G-01',
      name: 'api-key-edit-sheet-renaming',
      story: 'admin-dashboard-api-keys-edit-sheet--renaming',
      viewport: true,
      screen: async (page) => {
        await adminPage(page, '/settings/api-keys')
        await expect(page.getByText(secretKeys.partner.name)).toBeVisible({ timeout: 15_000 })
        await openRowMenu(page, secretKeys.partner.name)
        await page.getByRole('menuitem', { name: /^edit$/i }).click()
        await expect(page.locator('#edit-api-key-name')).toHaveValue(secretKeys.partner.name)
        await page.locator('#edit-api-key-name').fill('Warehouse sync, Europe')
        return sheet(page)
      },
      inStory: sheet,
    },
    {
      id: 'CMP-DA-G-01',
      name: 'api-key-token-reveal-dialog',
      story: 'admin-dashboard-api-keys-token-reveal-dialog--new-secret-key',
      viewport: true,
      screen: async (page) => {
        await keySheet(page)
        await page.locator('#api-key-name').fill(comparisonKey)
        await page.getByText(/read all \(read_all\)/i).click()
        await page.getByRole('button', { name: /create key/i }).click()
        await expect(page.getByText('Save your secret key')).toBeVisible({ timeout: 15_000 })
        return slot(page, 'dialog-content')
      },
      inStory: (page) => slot(page, 'dialog-content'),
      after: () => removeNamed(baseURL, 'api_keys', comparisonKey),
    },
    {
      id: 'CMP-DA-G-24',
      name: 'agent-connections-card-connected',
      story: 'admin-dashboard-ai-agents-agent-connections-card--connected',
      screen: async (page) => {
        await agentsPage(page)
        return agentCard(page)
      },
      inStory: (page) => slot(page, 'card').first(),
    },
    {
      id: 'CMP-DUI-P-30',
      name: 'popover-scope-list',
      story: 'dashboard-ui-primitives-popover--scope-list',
      screen: async (page) => {
        await agentsPage(page)
        await agentCard(page)
          .getByRole('button', { name: /show 1 more scope/i })
          .first()
          .click()
        return slot(page, 'popover-content')
      },
      inStory: (page) => slot(page, 'popover-content'),
    },
    {
      id: 'CMP-DA-G-24',
      name: 'connect-sheet-choose-an-agent',
      story: 'admin-dashboard-ai-agents-connect-sheet--choose-an-agent',
      viewport: true,
      screen: async (page) => {
        await connectSheet(page)
        return sheet(page)
      },
      inStory: sheet,
    },
    // The sheet opens with focus on the chosen radio, which draws its ring for
    // any focus, not only the keyboard's: the first case moves focus away, as
    // the story has none, and the second keeps it, beside the story's Tab.
    {
      id: 'CMP-DA-G-24',
      name: 'choice-card-picker-first-chosen',
      story: 'admin-dashboard-ai-agents-choice-card-picker--first-chosen',
      screen: async (page) => {
        await connectSheet(page)
        await leaveAlone(page)
        return dialogPart(page, 'field-group', '[role="radiogroup"]')
      },
      inStory: (page) => slot(page, 'field-group').first(),
    },
    {
      id: 'CMP-DA-G-24',
      name: 'choice-card-picker-focused',
      story: 'admin-dashboard-ai-agents-choice-card-picker--focus-visible',
      screen: async (page) => {
        await connectSheet(page)
        return dialogPart(page, 'field-group', '[role="radiogroup"]')
      },
      inStory: (page) => slot(page, 'field-group').first(),
    },
    {
      id: 'CMP-DA-G-24',
      name: 'connect-sheet-claude-ready',
      story: 'admin-dashboard-ai-agents-connect-sheet--claude-ready',
      viewport: true,
      screen: async (page) => {
        await claudeReady(page)
        return sheet(page)
      },
      inStory: sheet,
    },
    {
      id: 'CMP-DUI-C-11',
      name: 'copy-to-clipboard-button-icon',
      story: 'dashboard-ui-composed-copy-to-clipboard-button--icon',
      screen: async (page) => {
        await claudeReady(page)
        return page.getByRole('button', { name: 'Copy address' })
      },
      inStory: (page) => page.getByRole('button', { name: 'Copy address' }),
    },
    {
      id: 'CMP-DA-G-24',
      name: 'client-sheet-register',
      story: 'admin-dashboard-oauth-clients-client-sheet--register',
      viewport: true,
      screen: async (page) => {
        await clientSheet(page)
        return sheet(page)
      },
      inStory: sheet,
    },
    {
      id: 'CMP-DA-G-24',
      name: 'client-sheet-callback-refused',
      story: 'admin-dashboard-oauth-clients-client-sheet--callback-refused',
      viewport: true,
      screen: async (page) => {
        await clientSheet(page)
        const opened = page.getByRole('dialog')
        await opened.locator('#oauth-application-name').fill('Inventory assistant')
        await opened
          .locator('#oauth-application-redirect-uri')
          .fill('http://assistant.example.com/callback')
        await opened.getByRole('button', { name: /^save$/i }).click()
        await expect(
          opened.getByRole('alert').filter({ hasText: /must start with https/i }),
        ).toBeVisible({
          timeout: 15_000,
        })
        await leaveAlone(page)
        return sheet(page)
      },
      inStory: sheet,
    },
    {
      id: 'CMP-CORE-26',
      name: 'resource-table-allowed-origins',
      story: 'dashboard-core-resource-table--listed',
      screen: async (page) => {
        await originsPage(page)
        return resourceTable(page)
      },
      inStory: resourceTable,
    },
    {
      id: 'CMP-CORE-37',
      name: 'table-toolbar-allowed-origins',
      story: 'dashboard-core-table-toolbar--default',
      screen: async (page) => {
        await originsPage(page)
        return toolbarRow(page)
      },
      inStory: toolbarRow,
    },
    {
      id: 'CMP-CORE-26',
      name: 'resource-table-webhook-endpoints',
      story: 'dashboard-core-resource-table--webhook-endpoints',
      screen: async (page) => {
        await webhooksPage(page)
        return resourceTable(page)
      },
      inStory: resourceTable,
    },
    {
      id: 'CMP-DUI-C-42',
      name: 'resource-name-cell-openable',
      story: 'dashboard-ui-composed-resource-name-cell--openable',
      screen: async (page) => {
        await webhooksPage(page)
        return rowButton(page, endpoints.orderSync.name)
      },
      inStory: (page) => page.getByRole('button', { name: 'Order sync' }),
    },
    {
      id: 'CMP-DA-G-24',
      name: 'endpoint-form-all-events',
      story: 'admin-dashboard-webhooks-endpoint-form--all-events',
      window: tall,
      screen: async (page) => {
        await webhooksPage(page)
        await page.getByRole('button', { name: /new endpoint/i }).click()
        await expect(page.getByRole('checkbox', { name: 'order.placed', exact: true })).toBeVisible(
          {
            timeout: 15_000,
          },
        )
        return page.getByRole('dialog').locator('form > div').first()
      },
      inStory: (page) => page.locator('form'),
    },
    {
      id: 'CMP-DUI-C-40',
      name: 'resource-layout-endpoint',
      story: 'dashboard-ui-composed-resource-layout--two-columns',
      screen: async (page) => {
        await endpointPage(page)
        return resourceLayout(page)
      },
      inStory: resourceLayout,
    },
    {
      id: 'CMP-DUI-C-27',
      name: 'json-preview-drawer-loaded',
      story: 'dashboard-ui-composed-json-preview-drawer--loaded',
      viewport: true,
      screen: async (page) => {
        await endpointPage(page)
        await page.getByRole('button', { name: 'More actions' }).click()
        await page.getByRole('menuitem', { name: /view as json/i }).click()
        await expect(page.getByText(`"${endpoints.orderSync.url}"`).first()).toBeVisible({
          timeout: 15_000,
        })
        return sheet(page)
      },
      inStory: sheet,
    },
    {
      id: 'CMP-DUI-C-28',
      name: 'json-value-view-payload',
      story: 'dashboard-ui-composed-json-value-view--payload',
      screen: async (page) => {
        await endpointPage(page)
        await page.getByText('webhook.test', { exact: true }).first().click()
        await expect(page.getByText('Delivery details')).toBeVisible({ timeout: 15_000 })
        return jsonView(page)
      },
      inStory: jsonView,
    },
    ...(
      [
        ['active', 'active'],
        ['not-connected', 'none'],
      ] as const
    ).map(
      ([state, relay]): Case => ({
        id: 'CMP-DA-G-10',
        name: `integration-card-${state}`,
        story: `admin-dashboard-integrations-integration-card--${state}`,
        screen: async (page) => {
          await setRelay(baseURL, relay)
          await adminPage(page, '/settings/integrations')
          await expect(relayCard(page)).toBeVisible({ timeout: 15_000 })
          return relayCard(page)
        },
        inStory: (page) => slot(page, 'card').first(),
      }),
    ),
    {
      id: 'CMP-DA-G-10',
      name: 'configure-sheet-connect',
      story: 'admin-dashboard-integrations-configure-sheet--connect',
      viewport: true,
      screen: async (page) => {
        await relaySheet(page, 'none')
        return sheet(page)
      },
      inStory: sheet,
    },
    {
      id: 'CMP-CORE-22',
      name: 'preferences-form-new-connection',
      story: 'dashboard-core-preferences-form--new-connection',
      screen: async (page) => {
        await relaySheet(page, 'none')
        return dialogPart(page, 'field-group', '#preference-api_secret')
      },
      inStory: (page) => slot(page, 'field-group').first(),
    },
    {
      id: 'CMP-DA-G-10',
      name: 'configure-sheet-configure',
      story: 'admin-dashboard-integrations-configure-sheet--configure',
      viewport: true,
      screen: async (page) => {
        await relaySheet(page, 'active')
        return sheet(page)
      },
      inStory: sheet,
    },
    {
      id: 'CMP-DUI-C-48',
      name: 'secret-input-stored',
      story: 'dashboard-ui-composed-secret-input--stored',
      screen: async (page) => {
        await relaySheet(page, 'active')
        return dialogPart(page, 'field', '#preference-api_secret')
      },
      inStory: (page) => slot(page, 'field').first(),
    },
  ] as Case[]
).map((item) => ({ paintedOut: 'code', ...item }))

/**
 * Batch 3's comparisons (setup, stores and settings). The getting started
 * tasks, settings cards and sheets are opened as a merchant opens them; the
 * store setup fields are compared on first-run setup's own server, which must
 * be running and not yet set up (`stack.spec.ts`, "Spree first-run server",
 * with the dashboard on its port), and setup is never completed here. The
 * storefront sheet's key and API address are painted out of both images.
 * `row-click-bridge` and `theme-provider` draw nothing of their own and are not
 * compared; the address block shows an address only on order and seller
 * screens, which later batches compare.
 */
const settingsPage = (page: Page, path: string) => adminPage(page, `/settings/${path}`)

async function settingsSheet(page: Page, path: string, button: string) {
  await settingsPage(page, path)
  await page.getByRole('button', { name: button }).click()
  await expect(sheet(page)).toBeVisible()
}

async function recordSheet(page: Page, path: string, name: string) {
  await settingsPage(page, path)
  await page
    .getByRole('button', { name: new RegExp(`^${name}`) })
    .first()
    .click()
  await expect(sheet(page)).toBeVisible()
}

async function gettingStartedTask(page: Page, title: string) {
  await adminPage(page, '/getting-started')
  const task = page.getByRole('button', { name: title })
  if ((await task.getAttribute('aria-expanded')) !== 'true') await task.click()
  return page.getByRole('region', { name: title })
}

const taskRegion = (title: string) => (page: Page) => page.getByRole('region', { name: title })
const cardGrid = (page: Page) =>
  innermost(page, 'div.grid', page.getByRole('link', { name: /^Policies/ }))
const routingRules = (page: Page) =>
  innermost(page, 'div.flex.flex-col.gap-2', page.getByText('Order routing rules', { exact: true }))
const locationScope = (page: Page) =>
  page.getByRole('radiogroup').filter({ has: page.getByText('All locations') })
const taxEngineField = (page: Page) =>
  slot(page, 'field').filter({ has: page.locator('#market-tax-provider') })
const definitionForm = (page: Page) =>
  innermost(page, 'div.flex.flex-col.gap-4', page.getByText('Applies to', { exact: true }))
const editor = (page: Page) =>
  page
    .locator('div')
    .filter({ has: page.getByRole('button', { name: 'Bold' }) })
    .filter({ has: page.locator('[contenteditable]') })
    .last()
const setupCountry = (page: Page) =>
  innermost(page, 'div.grid.gap-2', page.getByText('Country', { exact: true }))

/** Opens the setup form through the link first-run setup's server writes; the link is never kept. */
async function openFirstRunSetup(page: Page) {
  const { setup_url: link } = JSON.parse(readFileSync(FIRST_RUN_CREDENTIALS_FILE, 'utf-8')) as {
    setup_url: string
  }
  const url = new URL(link)
  await page.goto(`${url.origin}${url.pathname}${url.search}`)
  await expect(page.getByRole('heading', { name: 'Set up Spree' })).toBeVisible()
}

const storeSettings: Case[] = [
  {
    id: 'CMP-CORE-PG-02',
    name: 'settings-index-store-cards',
    story: 'dashboard-core-pages-settings-index--every-card',
    screen: async (page) => {
      await settingsPage(page, '')
      return cardGrid(page)
    },
    inStory: cardGrid,
    window: tall,
  },
  {
    id: 'CMP-CORE-PG-02',
    name: 'settings-index-on-a-phone',
    story: 'dashboard-core-pages-settings-index--on-a-phone',
    phone: true,
    screen: async (page) => {
      await settingsPage(page, '')
      return cardGrid(page)
    },
    inStory: cardGrid,
  },
  {
    id: 'CMP-DA-G-16',
    name: 'reason-section-return-reasons',
    story: 'admin-dashboard-reasons-reason-section--return-reasons',
    screen: async (page) => {
      await settingsPage(page, 'reasons')
      return card(page, 'Return reasons')
    },
    inStory: (page) => card(page, 'Return reasons'),
    window: tall,
  },
  {
    id: 'CMP-DA-G-16',
    name: 'reason-section-exemption-reasons',
    story: 'admin-dashboard-reasons-reason-section--exemption-reasons',
    // The reasons' codes are shown as code, which the key mask would hide.
    paintedOut: '[data-fidelity-nothing]',
    screen: async (page) => {
      await settingsPage(page, 'taxes/exemption-reasons')
      return card(page, 'Tax exemption reasons')
    },
    inStory: (page) => card(page, 'Tax exemption reasons'),
  },
  {
    id: 'CMP-DA-G-16',
    name: 'reason-section-add',
    story: 'admin-dashboard-reasons-reason-section--add',
    screen: async (page) => {
      await settingsPage(page, 'reasons')
      await card(page, 'Return reasons').getByRole('button', { name: 'Add reason' }).click()
      return sheet(page)
    },
    inStory: sheet,
  },
  {
    id: 'CMP-DA-G-16',
    name: 'reason-section-delete-confirmation',
    story: 'admin-dashboard-reasons-reason-section--delete-confirmation',
    screen: async (page) => {
      await settingsPage(page, 'reasons')
      await openRowMenu(page, 'Accidental order')
      await page.getByRole('menuitem', { name: 'Delete' }).click()
      return slot(page, 'dialog-content')
    },
    inStory: (page) => slot(page, 'dialog-content'),
  },
  {
    id: 'CMP-DA-G-06',
    name: 'definition-form-new',
    story: 'admin-dashboard-custom-fields-definition-form--new',
    screen: async (page) => {
      await settingsSheet(page, 'custom-field-definitions', 'Add custom field')
      return definitionForm(page)
    },
    inStory: definitionForm,
  },
  {
    id: 'CMP-DA-G-24',
    name: 'order-routing-rules-section-rules',
    story: 'admin-dashboard-channels-order-routing-rules-section--rules',
    screen: async (page) => {
      await recordSheet(page, 'channels', 'Wholesale')
      await expect(sheet(page).getByText('Default location')).toBeVisible()
      return routingRules(page)
    },
    inStory: routingRules,
  },
  {
    id: 'CMP-DA-G-24',
    name: 'order-routing-rules-section-delete-confirmation',
    story: 'admin-dashboard-channels-order-routing-rules-section--delete-confirmation',
    screen: async (page) => {
      await recordSheet(page, 'channels', 'Wholesale')
      await sheet(page)
        .locator('li')
        .filter({ hasText: 'Minimize splits' })
        .getByRole('button', { name: 'Delete' })
        .click()
      return slot(page, 'dialog-content')
    },
    inStory: (page) => slot(page, 'dialog-content'),
  },
  {
    id: 'CMP-DA-G-20',
    name: 'stock-location-scope-field-all-locations',
    story: 'admin-dashboard-shipping-stock-location-scope-field--all-locations',
    screen: async (page) => {
      await recordSheet(page, 'channels', 'Wholesale')
      return locationScope(page)
    },
    inStory: locationScope,
  },
  {
    id: 'CMP-DA-G-24',
    name: 'tax-provider-field-store-default',
    story: 'admin-dashboard-markets-tax-provider-field--store-default',
    screen: async (page) => {
      await settingsSheet(page, 'markets', 'Add market')
      return taxEngineField(page)
    },
    inStory: taxEngineField,
  },
  {
    id: 'CMP-CORE-08',
    name: 'currency-select-store-default',
    story: 'dashboard-core-currency-select--store-default',
    screen: async (page) => {
      await settingsSheet(page, 'markets', 'Add market')
      return sheet(page).locator('[data-slot="combobox-button-trigger"]').filter({ hasText: 'USD' })
    },
    inStory: (page) => slot(page, 'combobox-button-trigger').first(),
  },
  {
    id: 'CMP-DUI-P-14',
    name: 'combobox-open',
    story: 'dashboard-ui-primitives-combobox--open',
    screen: async (page) => {
      await settingsSheet(page, 'markets', 'Add market')
      await sheet(page)
        .locator('[data-slot="combobox-button-trigger"]')
        .filter({ hasText: 'USD' })
        .click()
      return slot(page, 'combobox-content')
    },
    inStory: (page) => slot(page, 'combobox-content'),
  },
  {
    id: 'CMP-CORE-14',
    name: 'locale-select-selected',
    story: 'dashboard-core-locale-select--selected',
    screen: async (page) => {
      await settingsSheet(page, 'markets', 'Add market')
      return sheet(page).locator('[data-slot="combobox-button-trigger"]').filter({ hasText: 'EN' })
    },
    inStory: (page) => slot(page, 'combobox-button-trigger').first(),
  },
  {
    id: 'CMP-CORE-14',
    name: 'locale-select-none-chosen',
    story: 'dashboard-core-locale-select--none-chosen',
    screen: async (page) => {
      await settingsSheet(page, 'markets', 'Add market')
      return sheet(page)
        .locator('[data-slot="combobox-chips"]')
        .filter({ has: page.getByPlaceholder('Add locales…') })
    },
    inStory: (page) => slot(page, 'combobox-chips').first(),
  },
  {
    id: 'CMP-DUI-C-12',
    name: 'country-flag-beside-a-name',
    story: 'dashboard-ui-composed-country-flag--default',
    // The setup form's country, where the story sets the flag. The country
    // pickers draw it in a sheet's smaller text, so it is narrower there.
    screen: async (page) => {
      await openFirstRunSetup(page)
      return setupCountry(page).locator('.fi')
    },
    inStory: (page) => page.locator('.fi').first(),
  },
  {
    id: 'CMP-DUI-C-17',
    name: 'drag-handle-default',
    story: 'dashboard-ui-composed-drag-handle--default',
    screen: async (page) => {
      await settingsPage(page, 'markets')
      return page.getByRole('button', { name: 'Drag to reorder' }).first()
    },
    inStory: (page) => page.getByRole('button', { name: 'Drag to reorder' }).first(),
  },
  {
    id: 'CMP-DUI-C-21',
    name: 'form-actions-unchanged',
    story: 'dashboard-ui-composed-form-actions--unchanged',
    screen: async (page) => {
      await settingsPage(page, 'store')
      return page.getByRole('button', { name: 'Save', exact: true })
    },
    inStory: (page) => page.getByRole('button', { name: 'Save', exact: true }),
  },
  {
    id: 'CMP-CORE-23',
    name: 'resource-combobox-nothing-found',
    story: 'dashboard-core-resource-combobox--nothing-found',
    screen: async (page) => {
      await recordSheet(page, 'channels', 'Wholesale')
      await page.locator('#channel-default-catalog').click()
      await expect(page.getByText('No catalogs found')).toBeVisible()
      return slot(page, 'combobox-content')
    },
    inStory: (page) => slot(page, 'combobox-content'),
  },
  {
    id: 'CMP-DA-G-24',
    name: 'media-rich-text-editor-empty',
    story: 'admin-dashboard-policies-media-rich-text-editor--empty',
    screen: async (page) => {
      await settingsSheet(page, 'policies', 'Add policy')
      return editor(page)
    },
    inStory: editor,
  },
  {
    id: 'CMP-CORE-16',
    name: 'media-picker-sheet-one-file-with-upload',
    story: 'dashboard-core-media-picker-sheet--one-file',
    screen: async (page) => {
      await settingsSheet(page, 'policies', 'Add policy')
      await sheet(page).getByRole('button', { name: 'Image' }).click()
      await expect(page.getByText('Media library')).toBeVisible()
      return sheet(page).last()
    },
    inStory: (page) => sheet(page).last(),
  },
  {
    id: 'CMP-CORE-01',
    name: 'address-form-dialog-no-address-yet',
    story: 'dashboard-core-address-form-dialog--no-address-yet',
    screen: async (page) => {
      const task = await gettingStartedTask(page, 'Add your shipping address')
      await task.getByRole('button', { name: 'Save address' }).click()
      return sheet(page)
    },
    inStory: sheet,
  },
  {
    id: 'CMP-CORE-07',
    name: 'country-state-fields-placeholder',
    story: 'dashboard-core-country-state-fields--placeholder',
    screen: async (page) => {
      const task = await gettingStartedTask(page, 'Add your shipping address')
      await task.getByRole('button', { name: 'Save address' }).click()
      return sheet(page)
        .locator('[data-slot="combobox-button-trigger"]')
        .filter({ hasText: 'Select a state' })
    },
    inStory: (page) => slot(page, 'combobox-button-trigger').first(),
  },
  {
    id: 'CMP-DA-G-19',
    name: 'store-address-task-no-address-yet',
    story: 'admin-dashboard-getting-started-store-address-task--no-address-yet',
    screen: (page) => gettingStartedTask(page, 'Add your shipping address'),
    inStory: taskRegion('Add your shipping address'),
  },
  {
    id: 'CMP-DA-G-19',
    name: 'add-products-task-done',
    story: 'admin-dashboard-getting-started-add-products-task--done',
    screen: (page) => gettingStartedTask(page, 'Add products'),
    inStory: taskRegion('Add products'),
  },
  {
    id: 'CMP-DA-G-19',
    name: 'storefront-connect-task-not-done',
    story: 'admin-dashboard-getting-started-storefront-connect-task--not-done',
    screen: (page) => gettingStartedTask(page, 'Set up storefront'),
    inStory: taskRegion('Set up storefront'),
  },
  {
    id: 'CMP-DA-G-24',
    name: 'storefront-connect-sheet-key-hidden',
    story: 'admin-dashboard-getting-started-storefront-connect-sheet--key-hidden',
    paintedOut: '[role="dialog"] input[readonly]',
    screen: async (page) => {
      const task = await gettingStartedTask(page, 'Set up storefront')
      await task.getByRole('button', { name: 'Connect storefront' }).click()
      await expect(sheet(page).getByText('Publishable API key')).toBeVisible()
      return sheet(page)
    },
    inStory: sheet,
  },
  {
    id: 'CMP-DA-G-24',
    name: 'getting-started-nav-badge-some-done',
    story: 'admin-dashboard-getting-started-getting-started-nav-badge--some-done',
    // From another page, since the entry is drawn differently while it is the current page.
    screen: async (page) => {
      await adminPage(page, '/orders')
      return slot(page, 'sidebar-menu-badge').first()
    },
    inStory: (page) => slot(page, 'sidebar-menu-badge').first(),
  },
  {
    id: 'CMP-DA-G-24',
    name: 'store-setup-fields-suggested',
    story: 'admin-dashboard-setup-store-setup-fields--suggested',
    screen: async (page) => {
      await openFirstRunSetup(page)
      return setupCountry(page)
    },
    inStory: setupCountry,
  },
]

let catalog: Catalog

const titledCard = (page: Page, title: string) =>
  page.locator('[data-slot="card"]').filter({
    has: page.locator('[data-slot="card-title"]', { hasText: new RegExp(`^${title}$`) }),
  })
const generalCard = (page: Page) =>
  page
    .locator('[data-slot="card"]')
    .filter({ has: page.getByRole('textbox', { name: 'Name', exact: true }) })
    .first()
const cardOf = (title: string) => (page: Page) => titledCard(page, title)

/** YouTube's still for the stoneware mug's video link, answered with a local picture. */
const localYouTubeStill = (page: Page) =>
  page.route(
    (url) => url.hostname === 'img.youtube.com',
    (route) => route.fulfill({ contentType: 'image/png', body: fixture('product-olive.png') }),
  )

/**
 * Scrolls a part of a record's page to the top of the page's scrolling area,
 * below the page's title, which stays pinned.
 */
const belowTitle = (target: Locator) =>
  target.evaluate((section) => {
    section.scrollIntoView({ block: 'start' })
    let pinned = document.querySelector('h1') as Element | null
    while (pinned && getComputedStyle(pinned).position !== 'sticky') pinned = pinned.parentElement
    let scroller = section.parentElement
    while (scroller && scroller.scrollHeight <= scroller.clientHeight) {
      scroller = scroller.parentElement
    }
    const covered =
      (pinned?.getBoundingClientRect().bottom ?? 0) - section.getBoundingClientRect().top
    scroller?.scrollBy(0, -(covered + 16))
  })

async function productPage(page: Page, product: keyof Catalog['ids']) {
  await localYouTubeStill(page)
  await adminPage(page, `/products/${catalog.ids[product]}`)
  await expect(generalCard(page)).toBeVisible({ timeout: 20_000 })
}

/** A part of a product's page, scrolled below the page's title. */
const onProduct =
  (product: keyof Catalog['ids'], part: (page: Page) => Locator) => async (page: Page) => {
    await productPage(page, product)
    const found = part(page)
    await belowTitle(found)
    await page.mouse.move(1270, 5)
    return found
  }

/** A product's page with one of its sheets or dialogs open. */
const openedOnProduct =
  (
    product: keyof Catalog['ids'],
    open: (page: Page) => Promise<void>,
    part: (page: Page) => Locator,
  ) =>
  async (page: Page) => {
    await productPage(page, product)
    await open(page)
    await page.mouse.move(1270, 5)
    return part(page)
  }

const kettlePart = (part: (page: Page) => Locator) => onProduct('kettle', part)
const pricesGrid = (page: Page) =>
  titledCard(page, 'Prices').locator('[role="grid"], table').first()
const stockGrid = (page: Page) =>
  titledCard(page, 'Inventory').locator('[role="grid"], table').first()
const priceCell = (page: Page, variant: string) =>
  page.getByRole('textbox', { name: `Price for Color: ${variant}`, exact: true })
const dialogContent = (page: Page) => slot(page, 'dialog-content')

/** The kettle's translations dialog, open in German. */
const openKettleTranslations = async (page: Page) => {
  await belowTitle(titledCard(page, 'Translations'))
  await titledCard(page, 'Translations')
    .getByRole('button', { name: 'Manage translations' })
    .click()
  await expect(page.getByRole('textbox', { name: 'name de' })).toBeVisible()
}
/** The story's own table, not Storybook's hidden table of arguments. */
const storyTable = (page: Page) => page.locator('#storybook-root table').first()
const bulkBar = (page: Page) => page.locator('[class*="slide-in-from-left-2"]').first()
const mediaPreview = (scope: Page | Locator) =>
  scope
    .locator('[class*="group relative block w-full shrink-0 overflow-hidden rounded-lg"]')
    .first()

const openKettleMedia = (page: Page) =>
  titledCard(page, 'Media').locator('[data-slot="media-thumbnail"]').first().click({ force: true })
const openWhiteVariant = (page: Page) =>
  titledCard(page, 'Variants')
    .getByRole('button', { name: /^edit color: white$/i })
    .click()
const openBulkVariants = (page: Page) =>
  titledCard(page, 'Variants')
    .getByRole('button', { name: /bulk edit/i })
    .click()
const openPublishFrom = async (page: Page) => {
  const publishing = titledCard(page, 'Publishing')
  await belowTitle(publishing)
  await publishing.getByRole('button', { name: /online store/i }).click()
}
const publishFrom = (page: Page) =>
  titledCard(page, 'Publishing')
    .getByRole('button', { name: /live immediately/i })
    .first()
const handbookFile = (page: Page) =>
  titledCard(page, 'Digital files').getByRole('row').filter({ hasText: 'fidelity-care-guide.pdf' })

async function mediaLibrary(page: Page) {
  await localYouTubeStill(page)
  await adminPage(page, '/products/media')
  await expect(page.getByRole('listitem').first()).toBeVisible({ timeout: 20_000 })
}
const libraryTile = (page: Page, name: string) =>
  page.getByRole('listitem').filter({ hasText: name }).getByRole('button').first()

/** Part 1 of the catalog batch (#34), compared with the product screens, the media library and options. */
const catalogPartOne: Case[] = [
  {
    id: 'CMP-CORE-PF-06',
    name: 'product-general-card',
    story: 'dashboard-core-product-form-general-card--filled',
    screen: kettlePart(generalCard),
    inStory: generalCard,
    window: tall,
  },
  {
    id: 'CMP-CORE-PF-06',
    name: 'product-variants-card',
    story: 'dashboard-core-product-form-variants-card--with-options',
    screen: kettlePart(cardOf('Variants')),
    inStory: cardOf('Variants'),
    window: tall,
  },
  {
    id: 'CMP-CORE-PF-06',
    name: 'product-media-card',
    story: 'dashboard-core-product-form-media-card--images',
    screen: kettlePart(cardOf('Media')),
    inStory: cardOf('Media'),
    window: tall,
  },
  {
    id: 'CMP-CORE-PF-06',
    name: 'product-prices-card',
    story: 'dashboard-core-product-form-prices-card--variants',
    screen: kettlePart(cardOf('Prices')),
    inStory: cardOf('Prices'),
    window: tall,
  },
  {
    id: 'CMP-CORE-PF-06',
    name: 'product-inventory-card',
    story: 'dashboard-core-product-form-inventory-card--variants',
    screen: kettlePart(cardOf('Inventory')),
    inStory: cardOf('Inventory'),
    window: tall,
  },
  {
    id: 'CMP-CORE-PF-06',
    name: 'product-status-card',
    story: 'dashboard-core-product-form-status-card--active',
    screen: kettlePart(cardOf('Status')),
    inStory: cardOf('Status'),
    window: tall,
  },
  {
    id: 'CMP-CORE-PF-06',
    name: 'product-categorization-card',
    story: 'dashboard-core-product-form-categorization-card--filled',
    screen: kettlePart(cardOf('Categorization')),
    inStory: cardOf('Categorization'),
    window: tall,
  },
  {
    id: 'CMP-CORE-PF-06',
    name: 'product-tax-card',
    story: 'dashboard-core-product-form-tax-card--chosen',
    screen: kettlePart(cardOf('Tax')),
    inStory: cardOf('Tax'),
    window: tall,
  },
  {
    id: 'CMP-CORE-PF-06',
    name: 'product-seo-card',
    story: 'dashboard-core-product-form-seo-card--filled',
    screen: kettlePart(cardOf('SEO')),
    inStory: cardOf('SEO'),
    window: tall,
  },
  {
    id: 'CMP-CORE-PF-09',
    name: 'product-variants-section',
    story: 'dashboard-core-product-form-variants-section--with-options',
    screen: kettlePart(cardOf('Variants')),
    inStory: cardOf('Variants'),
    window: tall,
  },
  {
    id: 'CMP-CORE-PF-08',
    name: 'product-variants-options-builder',
    story: 'dashboard-core-product-form-variants-options-builder--two-options',
    screen: kettlePart((page) =>
      titledCard(page, 'Variants').locator('[data-slot="card-content"] > *').first(),
    ),
    inStory: (page) => page.locator('[data-story-column] > *').first(),
    window: tall,
  },
  {
    id: 'CMP-CORE-PF-03',
    name: 'product-inventory-section',
    story: 'dashboard-core-product-form-inventory-section--variants',
    screen: kettlePart(stockGrid),
    inStory: storyTable,
    window: tall,
  },
  {
    id: 'CMP-CORE-PF-05',
    name: 'product-bulk-price-editor',
    story: 'dashboard-core-product-form-product-bulk-price-editor--dollars',
    screen: kettlePart(pricesGrid),
    inStory: storyTable,
    window: tall,
  },
  {
    id: 'CMP-CORE-PF-02',
    name: 'product-bulk-variants-dialog',
    story: 'dashboard-core-product-form-bulk-variants-dialog--variants',
    screen: openedOnProduct('kettle', openBulkVariants, dialogContent),
    inStory: dialogContent,
  },
  {
    id: 'CMP-CORE-PF-04',
    name: 'product-media-edit-sheet',
    story: 'dashboard-core-product-form-media-edit-sheet--image',
    screen: openedOnProduct('kettle', openKettleMedia, sheet),
    inStory: sheet,
  },
  {
    id: 'CMP-CORE-PF-07',
    name: 'product-variant-edit-sheet',
    story: 'dashboard-core-product-form-variant-edit-sheet--identity',
    screen: openedOnProduct('kettle', openWhiteVariant, sheet),
    inStory: sheet,
  },
  {
    id: 'CMP-CORE-PF-01',
    name: 'product-add-video-dialog',
    story: 'dashboard-core-product-form-add-video-dialog--empty',
    screen: openedOnProduct(
      'kettle',
      (page) => titledCard(page, 'Media').getByRole('button', { name: 'Add video link' }).click(),
      dialogContent,
    ),
    inStory: dialogContent,
  },
  {
    id: 'CMP-CORE-24',
    name: 'resource-multi-autocomplete-categories',
    story: 'dashboard-core-resource-multi-autocomplete--chosen-names-loaded',
    screen: kettlePart((page) =>
      titledCard(page, 'Categorization').locator('[data-slot="combobox-chips"]').first(),
    ),
    inStory: (page) => slot(page, 'combobox-chips').first(),
  },
  {
    id: 'CMP-DUI-C-41',
    name: 'resource-multi-autocomplete-chosen',
    story: 'dashboard-ui-composed-resource-multi-autocomplete--chosen',
    screen: kettlePart((page) =>
      titledCard(page, 'Categorization').locator('[data-slot="combobox-chips"]').first(),
    ),
    inStory: (page) => slot(page, 'combobox-chips').first(),
  },
  {
    id: 'CMP-CORE-38',
    name: 'tag-combobox-chosen',
    story: 'dashboard-core-tag-combobox--chosen',
    screen: kettlePart((page) =>
      titledCard(page, 'Categorization').locator('[data-slot="combobox-chips"]').last(),
    ),
    inStory: (page) => slot(page, 'combobox-chips').first(),
  },
  {
    id: 'CMP-CORE-35',
    name: 'store-date-picker-publish-from',
    story: 'dashboard-core-store-date-picker--date-and-time-empty',
    screen: openedOnProduct('kettle', openPublishFrom, publishFrom),
    inStory: (page) => page.getByRole('button', { name: /live immediately/i }).first(),
  },
  {
    id: 'CMP-DA-G-14',
    name: 'product-publishing-card',
    story: 'admin-dashboard-products-publishing-card--live',
    screen: kettlePart(cardOf('Publishing')),
    inStory: cardOf('Publishing'),
    window: tall,
  },
  {
    id: 'CMP-DUI-C-36',
    name: 'status-card-active',
    story: 'dashboard-ui-composed-products-status-card--active',
    screen: kettlePart(cardOf('Status')),
    inStory: cardOf('Status'),
    window: tall,
  },
  {
    id: 'CMP-DUI-P-33',
    name: 'rich-text-editor-description',
    story: 'dashboard-ui-primitives-rich-text-editor--formatted',
    screen: kettlePart((page) =>
      generalCard(page).locator('[data-slot="rich-text-editor"]').first(),
    ),
    inStory: (page) => page.locator('[data-slot="rich-text-editor"]').first(),
  },
  {
    id: 'CMP-DUI-P-33',
    name: 'rich-text-editor-with-image-button',
    story: 'dashboard-ui-primitives-rich-text-editor--with-image-button',
    screen: kettlePart((page) =>
      generalCard(page).locator('[data-slot="rich-text-editor"]').first(),
    ),
    inStory: (page) => page.locator('[data-slot="rich-text-editor"]').first(),
  },
  {
    id: 'CMP-DUI-C-14',
    name: 'data-grid-prices',
    story: 'dashboard-ui-composed-data-grid-data-grid--with-a-section-header',
    screen: kettlePart(pricesGrid),
    inStory: storyTable,
    window: tall,
  },
  {
    id: 'CMP-DUI-C-05',
    name: 'bulk-price-table-variants',
    story: 'dashboard-ui-composed-bulk-price-table--variants',
    screen: kettlePart(pricesGrid),
    inStory: storyTable,
    window: tall,
  },
  {
    id: 'CMP-DUI-C-13',
    name: 'data-grid-money-cell',
    story: 'dashboard-ui-composed-data-grid-cells--every-kind',
    screen: kettlePart((page) => priceCell(page, 'White').locator('xpath=ancestor::td[1]')),
    inStory: (page) =>
      page.getByRole('textbox', { name: /price/i }).first().locator('xpath=ancestor::td[1]'),
    window: tall,
  },
  {
    id: 'CMP-DUI-C-15',
    name: 'fill-handle-chosen-price',
    story: 'dashboard-ui-composed-data-grid-fill-handle--on-a-selected-cell',
    screen: async (page) => {
      const grid = await kettlePart(pricesGrid)(page)
      await priceCell(page, 'White').click()
      await page.mouse.move(1270, 5)
      return grid
    },
    inStory: storyTable,
    window: tall,
  },
  {
    id: 'CMP-DUI-C-06',
    name: 'bulk-variants-table-every-column',
    story: 'dashboard-ui-composed-bulk-variants-table--every-column',
    screen: openedOnProduct('kettle', openBulkVariants, (page) =>
      dialogContent(page).locator('[role="grid"], table').first(),
    ),
    inStory: storyTable,
  },
  {
    id: 'CMP-DUI-C-22',
    name: 'form-section-variant-identity',
    story: 'dashboard-ui-composed-form-section--titled',
    screen: openedOnProduct('kettle', openWhiteVariant, (page) =>
      sheet(page).locator('fieldset').first(),
    ),
    inStory: (page) => page.locator('fieldset').first(),
  },
  {
    id: 'CMP-DUI-C-31',
    name: 'metadata-card-populated',
    story: 'dashboard-ui-composed-metadata-metadata-card--populated',
    screen: onProduct('scheduled', cardOf('Metadata')),
    inStory: cardOf('Metadata'),
    window: tall,
  },
  {
    id: 'CMP-DA-G-06',
    name: 'custom-fields-inline-card-filled',
    story: 'admin-dashboard-custom-fields-custom-fields-inline-card--filled',
    screen: kettlePart(cardOf('Custom fields')),
    inStory: cardOf('Custom fields'),
    window: tall,
  },
  {
    id: 'CMP-DA-G-14',
    name: 'product-custom-fields-from-its-type',
    story: 'admin-dashboard-products-product-custom-fields-provider--from-its-type',
    screen: kettlePart(cardOf('Custom fields')),
    inStory: cardOf('Custom fields'),
    window: tall,
  },
  {
    id: 'CMP-DA-G-14',
    name: 'digital-assets-card-files',
    story: 'admin-dashboard-products-digital-assets-card--files',
    screen: onProduct('handbook', cardOf('Digital files')),
    inStory: cardOf('Digital files'),
    window: tall,
  },
  {
    id: 'CMP-DUI-C-20',
    name: 'file-type-icon-document',
    story: 'dashboard-ui-composed-file-type-icon--document',
    screen: onProduct('handbook', (page) => handbookFile(page).locator('svg').first()),
    inStory: (page) => page.locator('#storybook-root svg').first(),
  },
  {
    id: 'CMP-DA-G-14',
    name: 'digital-asset-edit-sheet-own-limits',
    story: 'admin-dashboard-products-digital-asset-edit-sheet--own-limits',
    screen: openedOnProduct(
      'handbook',
      async (page) => {
        await belowTitle(titledCard(page, 'Digital files'))
        await handbookFile(page).getByRole('button').last().click()
        await page.getByRole('menuitem', { name: /^edit/i }).click()
      },
      sheet,
    ),
    inStory: sheet,
  },
  {
    id: 'CMP-DA-G-14',
    name: 'digital-files-form-card-no-files',
    story: 'admin-dashboard-products-digital-files-form-card--no-files',
    screen: async (page) => {
      await adminPage(page, '/products/new')
      const found = titledCard(page, 'Digital files')
      await belowTitle(found)
      return found
    },
    inStory: cardOf('Digital files'),
    window: tall,
  },
  {
    id: 'CMP-DA-G-24',
    name: 'stock-history-one-product',
    story: 'admin-dashboard-stock-stock-history--one-product',
    screen: openedOnProduct(
      'kettle',
      async (page) => {
        await belowTitle(titledCard(page, 'Inventory'))
        await titledCard(page, 'Inventory').getByRole('button', { name: 'Stock history' }).click()
      },
      dialogContent,
    ),
    inStory: dialogContent,
  },
  {
    id: 'CMP-DA-G-23',
    name: 'resource-translations-card-translated',
    story: 'admin-dashboard-translations-resource-translations-card--translated',
    screen: kettlePart(cardOf('Translations')),
    inStory: cardOf('Translations'),
    window: tall,
  },
  {
    id: 'CMP-DA-G-23',
    name: 'resource-translations-dialog-german',
    story: 'admin-dashboard-translations-resource-translations-dialog--german',
    screen: openedOnProduct('kettle', openKettleTranslations, dialogContent),
    inStory: dialogContent,
  },
  {
    id: 'CMP-CORE-04',
    name: 'bulk-action-bar-two-chosen',
    story: 'dashboard-core-bulk-action-bar--two-chosen',
    screen: async (page) => {
      await productsList(page)
      for (const row of await page.getByRole('checkbox', { name: /select row/i }).all()) {
        if ((await page.getByText(/^2 selected$/).count()) > 0) break
        await row.check()
      }
      await page.mouse.move(1270, 5)
      return bulkBar(page)
    },
    inStory: bulkBar,
  },
  {
    id: 'CMP-DUI-C-04',
    name: 'bulk-dialog-set-status',
    story: 'dashboard-ui-composed-bulk-dialog--default',
    screen: async (page) => {
      await productsList(page)
      for (const row of (await page.getByRole('checkbox', { name: /select row/i }).all()).slice(
        0,
        2,
      )) {
        await row.check()
      }
      await page.getByRole('button', { name: /set status/i }).click()
      return dialogContent(page)
    },
    inStory: dialogContent,
  },
  {
    id: 'CMP-DUI-C-50',
    name: 'tag-list-product-row',
    story: 'dashboard-ui-composed-tag-list--default',
    screen: async (page) => {
      await productsList(page)
      await page.getByRole('button', { name: /columns/i }).click()
      await page.getByRole('menuitemcheckbox', { name: /^tags$/i }).click()
      await page.keyboard.press('Escape')
      return page
        .getByRole('row')
        .filter({ hasText: 'Electric Kettle 1.7L' })
        .locator('td div.flex.flex-wrap.gap-1')
        .first()
    },
    inStory: (page) => page.locator('#storybook-root div.flex.flex-wrap.gap-1').first(),
  },
  {
    id: 'CMP-DUI-C-09',
    name: 'color-picker-no-color',
    story: 'dashboard-ui-composed-color-picker--no-color',
    screen: async (page) => {
      await adminPage(page, '/products/options')
      await page.getByRole('button', { name: 'color Color' }).click()
      return sheet(page).locator('div.relative.flex.items-center.gap-2').first()
    },
    inStory: (page) => page.locator('#storybook-root div.relative.flex.items-center.gap-2').first(),
  },
  {
    id: 'CMP-DUI-P-28',
    name: 'media-preview-image',
    story: 'dashboard-ui-primitives-media-preview--image',
    screen: async (page) => {
      await mediaLibrary(page)
      await libraryTile(page, 'Stoneware mug, side view').click()
      return mediaPreview(sheet(page))
    },
    inStory: mediaPreview,
  },
  {
    id: 'CMP-CORE-10',
    name: 'file-upload-field-poster',
    story: 'dashboard-core-file-upload-field--saved',
    screen: async (page) => {
      await mediaLibrary(page)
      await libraryTile(page, 'Glazing the mug').click()
      return sheet(page)
        .locator('label')
        .filter({ has: page.locator('input[type="file"]') })
        .first()
    },
    inStory: (page) =>
      page
        .locator('label')
        .filter({ has: page.locator('input[type="file"]') })
        .first(),
  },
]

let merchandising: Merchandising

/** A part 2 record's page, read from the ids `merchandising.ts` seeded. */
const merchandisingPage = async (page: Page, path: string, heading: string) => {
  await adminPage(page, path)
  await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible({
    timeout: 20_000,
  })
  await page.waitForLoadState('networkidle')
}
const categoryRecord = (page: Page) =>
  merchandisingPage(page, `/products/categories/${merchandising.ids.category}`, coffeeCategory)
const collectionRecord = (key: 'manual' | 'automatic') => (page: Page) =>
  merchandisingPage(
    page,
    `/products/collections/${merchandising.ids.collections[key]}`,
    key === 'manual' ? 'Best Sellers' : merchandisingCollections.automatic,
  )
const catalogRecord = (key: keyof Merchandising['ids']['catalogs']) => (page: Page) =>
  merchandisingPage(
    page,
    `/products/catalogs/${merchandising.ids.catalogs[key]}`,
    merchandisingCatalogs[key],
  )
const priceListRecord = (key: keyof Merchandising['ids']['priceLists']) => (page: Page) =>
  merchandisingPage(
    page,
    `/products/price-lists/${merchandising.ids.priceLists[key]}`,
    merchandisingPriceLists[key],
  )

/** A part of a part 2 record's page, scrolled below the page's title. */
const onRecord =
  (open: (page: Page) => Promise<void>, part: (page: Page) => Locator) => async (page: Page) => {
    await open(page)
    const found = part(page)
    await belowTitle(found)
    await page.mouse.move(1270, 5)
    return found
  }
/** A part 2 page with a sheet or dialog opened from it. */
const openedOn =
  (
    open: (page: Page) => Promise<void>,
    act: (page: Page) => Promise<void>,
    part: (page: Page) => Locator,
  ) =>
  async (page: Page) => {
    await open(page)
    await act(page)
    await page.waitForTimeout(600)
    await page.mouse.move(1270, 5)
    return part(page)
  }

const cardStartingWith = (page: Page, title: string) =>
  page
    .locator('[data-slot="card"]')
    .filter({
      has: page.locator('[data-slot="card-title"]', { hasText: new RegExp(`^${title}`) }),
    })
    .first()
const sideCard = (title: string) => (page: Page) =>
  page
    .locator('[data-slot="card"]')
    .filter({ has: page.getByText(title, { exact: true }) })
    .last()
// Storybook keeps a hidden arguments table in every story's page, so only visible tables count.
const firstTable = (page: Page) => page.locator('table:visible').first()
const modal = (page: Page) => page.getByRole('dialog').last()
const tierEditor = (scope: Locator) =>
  scope.getByText('From quantity', { exact: true }).first().locator('xpath=../../..')
const productList = (page: Page) => page.getByRole('main').locator('table').first()

const catalogPartTwo: Case[] = [
  // Categories (DA-PRD-07, DA-PRD-09)
  {
    id: 'CMP-DA-G-03',
    name: 'category-tree',
    story: 'admin-dashboard-categories-category-tree--collapsed',
    screen: async (page) => {
      await adminPage(page, '/products/categories')
      await expect(page.getByRole('button', { name: 'Kitchen', exact: true })).toBeVisible({
        timeout: 20_000,
      })
      return firstTable(page)
    },
    inStory: firstTable,
  },
  {
    id: 'CMP-DA-G-03',
    name: 'category-list-matches',
    story: 'admin-dashboard-categories-category-list--matches',
    screen: async (page) => {
      await adminPage(page, '/products/categories')
      await page.getByPlaceholder(/^search categories…$/i).fill('Air')
      await expect(page.getByRole('row', { name: /^Air & Climate .{1,2} Fans/ })).toBeVisible({
        timeout: 20_000,
      })
      await page.mouse.move(1270, 5)
      return firstTable(page)
    },
    inStory: firstTable,
  },
  {
    id: 'CMP-DA-G-03',
    name: 'category-form-main',
    story: 'admin-dashboard-categories-category-form--main',
    screen: onRecord(categoryRecord, generalCard),
    inStory: generalCard,
    window: tall,
  },
  {
    id: 'CMP-DA-G-03',
    name: 'category-form-navigation',
    story: 'admin-dashboard-categories-category-form--sidebar-with-parent',
    screen: onRecord(categoryRecord, cardOf('Navigation')),
    inStory: cardOf('Navigation'),
    window: tall,
  },
  {
    id: 'CMP-DA-G-03',
    name: 'category-products-card',
    story: 'admin-dashboard-categories-category-products-card--members',
    screen: onRecord(categoryRecord, (page) => cardStartingWith(page, 'Products')),
    inStory: (page) => cardStartingWith(page, 'Products'),
    window: tall,
  },
  {
    id: 'CMP-DUI-C-35',
    name: 'product-membership-list',
    story: 'dashboard-ui-composed-product-membership-list--members',
    screen: onRecord(categoryRecord, (page) => cardStartingWith(page, 'Products').locator('table')),
    inStory: firstTable,
    window: tall,
  },
  {
    id: 'CMP-DUI-C-39',
    name: 'resource-combobox-selected',
    story: 'dashboard-ui-composed-resource-combobox--selected',
    screen: onRecord(categoryRecord, (page) => cardOf('Navigation')(page).getByRole('combobox')),
    inStory: (page) => page.getByRole('combobox').first(),
    window: tall,
  },
  {
    id: 'CMP-CORE-25',
    name: 'resource-picker-sheet',
    story: 'dashboard-core-resource-picker-sheet--results',
    screen: openedOn(
      categoryRecord,
      (page) => page.getByRole('button', { name: /add products/i }).click(),
      modal,
    ),
    inStory: modal,
    viewport: true,
  },

  // Collections (DA-PRD-12)
  {
    id: 'CMP-DA-G-04',
    name: 'collection-form-main',
    story: 'admin-dashboard-collections-collection-form--curated',
    screen: onRecord(collectionRecord('manual'), generalCard),
    inStory: generalCard,
    window: tall,
  },
  {
    id: 'CMP-DA-G-04',
    name: 'collection-rules-card',
    story: 'admin-dashboard-collections-collection-rules-card--rules',
    screen: onRecord(collectionRecord('automatic'), cardOf('Membership')),
    inStory: cardOf('Membership'),
    window: tall,
  },
  {
    id: 'CMP-DA-G-04',
    name: 'collection-products-card',
    story: 'admin-dashboard-collections-collection-products-card--curated',
    screen: onRecord(collectionRecord('manual'), (page) => cardStartingWith(page, 'Products')),
    inStory: (page) => cardStartingWith(page, 'Products'),
    window: tall,
  },
  {
    id: 'CMP-DA-G-24',
    name: 'deferred-product-membership-card-rules',
    story: 'admin-dashboard-product-membership-deferred-product-membership-card--chosen-by-rules',
    screen: onRecord(collectionRecord('automatic'), (page) => cardStartingWith(page, 'Products')),
    inStory: (page) => cardStartingWith(page, 'Products'),
    window: tall,
  },

  // Translations (DA-PRD-06)
  {
    id: 'CMP-CORE-28',
    name: 'section-heading',
    story: 'dashboard-core-section-heading--with-description',
    screen: async (page) => {
      await adminPage(page, '/products/translations')
      // The page draws its title as plain text, not as a heading, so it is found by its words.
      const description = page.getByText(/how much of your catalog is translated/)
      await expect(description).toBeVisible({ timeout: 20_000 })
      return description.locator('xpath=..')
    },
    inStory: (page) => page.getByText(/how much of your catalog is translated/).locator('xpath=..'),
  },

  // Catalogs (DA-PRD-13, DA-PRD-14)
  {
    id: 'CMP-DA-G-24',
    name: 'catalog-audience-card',
    story: 'admin-dashboard-catalogs-catalog-audience-card--assigned',
    screen: onRecord(catalogRecord('percentage'), cardOf('Audiences')),
    inStory: cardOf('Audiences'),
    window: tall,
  },
  {
    id: 'CMP-DA-G-24',
    name: 'catalog-terms-card',
    story: 'admin-dashboard-catalogs-catalog-terms-card--terms',
    screen: onRecord(catalogRecord('percentage'), cardOf('Commercial terms')),
    inStory: cardOf('Commercial terms'),
    window: tall,
  },
  {
    id: 'CMP-DA-G-24',
    name: 'catalog-pricing-fields-percentage',
    story: 'admin-dashboard-catalogs-catalog-pricing-fields--percentage',
    screen: onRecord(catalogRecord('percentage'), sideCard('Pricing')),
    inStory: sideCard('Pricing'),
    window: tall,
  },
  {
    id: 'CMP-DUI-C-37',
    name: 'quantity-tier-editor',
    story: 'dashboard-ui-composed-quantity-tier-editor--bands',
    // The editor is drawn as rows of fields, not a table: its root is three levels above the column label.
    screen: onRecord(catalogRecord('percentage'), (page) => tierEditor(sideCard('Pricing')(page))),
    inStory: (page) => tierEditor(page.locator('body')),
    window: tall,
  },
  {
    id: 'CMP-DA-G-24',
    name: 'catalog-price-columns-adjusted',
    story: 'admin-dashboard-catalogs-catalog-price-columns--adjusted',
    screen: onRecord(catalogRecord('percentage'), (page) => cardStartingWith(page, 'Products')),
    inStory: (page) => cardStartingWith(page, 'Products'),
    window: tall,
  },
  {
    id: 'CMP-DA-G-24',
    name: 'catalog-wizard-dialog-details',
    story: 'admin-dashboard-catalogs-catalog-wizard-dialog--details',
    screen: async (page) => {
      await adminPage(page, '/products/catalogs')
      await page.getByRole('button', { name: /^add catalog$/i }).click()
      await expect(modal(page)).toBeVisible()
      await page.waitForTimeout(600)
      return modal(page)
    },
    inStory: modal,
    viewport: true,
  },

  // Price lists (DA-PRD-15 to DA-PRD-17)
  {
    id: 'CMP-DA-G-13',
    name: 'price-list-form-basics',
    story: 'admin-dashboard-price-lists-price-list-form--editing',
    screen: onRecord(priceListRecord('wholesale'), cardOf('Basics')),
    inStory: cardOf('Basics'),
    window: tall,
  },
  {
    id: 'CMP-DA-G-13',
    name: 'price-list-form-rules',
    story: 'admin-dashboard-price-lists-price-list-form--editing',
    screen: onRecord(priceListRecord('wholesale'), (page) => cardStartingWith(page, 'Rules')),
    inStory: (page) => cardStartingWith(page, 'Rules'),
    window: tall,
  },
  {
    id: 'CMP-DA-G-13',
    name: 'status-badge-active',
    story: 'admin-dashboard-price-lists-status-badge--active',
    screen: async (page) => {
      await adminPage(page, '/products/price-lists')
      const badge = page
        .getByRole('row')
        .filter({ hasText: 'Wholesale' })
        .locator('[data-slot="status-badge"]')
        .first()
      await expect(badge).toBeVisible({ timeout: 20_000 })
      return badge
    },
    inStory: (page) => page.locator('[data-slot="status-badge"]').first(),
  },
  {
    id: 'CMP-DA-G-13',
    name: 'volume-rule-editor',
    story: 'admin-dashboard-price-lists-volume-rule-editor--saved',
    screen: openedOn(
      priceListRecord('wholesale'),
      (page) => page.getByRole('button', { name: /^volume pricing/i }).click(),
      modal,
    ),
    inStory: modal,
    viewport: true,
  },
  {
    id: 'CMP-DA-G-13',
    name: 'customer-group-rule-editor',
    story: 'admin-dashboard-price-lists-customer-group-rule-editor--saved',
    screen: openedOn(
      priceListRecord('wholesale'),
      (page) => page.getByRole('button', { name: /^customer group/i }).click(),
      modal,
    ),
    inStory: modal,
    viewport: true,
  },
  {
    id: 'CMP-DA-G-13',
    name: 'market-rule-editor',
    story: 'admin-dashboard-price-lists-market-rule-editor--saved',
    screen: openedOn(
      priceListRecord('scheduled'),
      (page) => page.getByRole('button', { name: /^market/i }).click(),
      modal,
    ),
    inStory: modal,
    viewport: true,
  },
  {
    id: 'CMP-DA-G-13',
    name: 'type-picker-sheet',
    story: 'admin-dashboard-price-lists-type-picker-sheet--kinds',
    screen: openedOn(
      priceListRecord('draft'),
      (page) => page.getByRole('button', { name: 'Add rule' }).click(),
      modal,
    ),
    inStory: modal,
    viewport: true,
  },
  {
    id: 'CMP-DA-G-02',
    name: 'bulk-price-editor-dialog',
    story: 'admin-dashboard-price-lists-bulk-price-editor-dialog--open',
    screen: openedOn(
      priceListRecord('wholesale'),
      async (page) => {
        await page.getByRole('button', { name: /^edit prices$/i }).click()
        await expect(
          modal(page)
            .getByLabel(/^price for/i)
            .first(),
        ).toBeVisible({
          timeout: 20_000,
        })
      },
      modal,
    ),
    inStory: modal,
    viewport: true,
  },

  // Imports and exports (DA-PRD-01's buttons, DA-OVL-05, DA-SET-31)
  {
    id: 'CMP-CORE-12',
    name: 'import-button-sheet',
    story: 'dashboard-core-import-button--sheet',
    screen: async (page) => {
      await adminPage(page, '/products')
      await expect(productList(page)).toBeVisible({ timeout: 20_000 })
      await page.getByRole('button', { name: /^import$/i }).click()
      await expect(page.getByRole('heading', { name: /import from csv/i })).toBeVisible()
      await page.waitForTimeout(600)
      return modal(page)
    },
    inStory: modal,
    viewport: true,
  },
  {
    id: 'CMP-CORE-09',
    name: 'export-button-dialog',
    story: 'dashboard-core-export-button--no-filter',
    screen: async (page) => {
      await adminPage(page, '/products')
      await expect(productList(page)).toBeVisible({ timeout: 20_000 })
      await page.getByRole('button', { name: /^export$/i }).click()
      await expect(modal(page)).toBeVisible()
      await page.waitForTimeout(600)
      return modal(page)
    },
    inStory: modal,
    viewport: true,
  },
  {
    id: 'CMP-DA-G-09',
    name: 'import-wizard-dialog-mapping',
    story: 'admin-dashboard-imports-import-wizard-dialog--mapping',
    screen: async (page) => {
      await adminPage(page, `/settings/imports?import=${merchandising.ids.mappingImport}`)
      await expect(page.getByText('Map columns')).toBeVisible({ timeout: 20_000 })
      await page.waitForTimeout(600)
      return modal(page)
    },
    inStory: modal,
    viewport: true,
  },
]

const cases: Case[] = [
  ...pilotCases,
  ...primitivesBatchOne,
  ...staffAccessPartOne,
  ...staffAccessPartTwo,
  ...developerSettings,
  ...storeSettings,
  ...catalogPartOne,
  ...catalogPartTwo,
]

/** Every custom property the page's root element computes: the tokens, as the browser resolves them. */
async function rootTokens(page: Page): Promise<Record<string, string>> {
  return page.evaluate(() => {
    const computed = getComputedStyle(document.documentElement)
    const tokens: Record<string, string> = {}
    for (const name of Array.from(computed)) {
      if (name.startsWith('--')) tokens[name] = computed.getPropertyValue(name).trim()
    }
    return tokens
  })
}

// The staff cases need the teammates, roles and invitations `staff.ts` adds,
// the developer settings cases the records `developers.ts` adds, and the
// catalog cases the products and files `catalog.ts` adds; adding them again
// reuses them.
test.beforeAll(async ({ baseURL: configured }) => {
  baseURL = configured ?? baseURL
  await seed(baseURL)
  developers = await seedDevelopers(baseURL)
  catalog = await seedCatalog(baseURL)
  merchandising = await seedMerchandising(baseURL)
})

for (const theme of ['light', 'dark'] as const) {
  test(`tokens on the running screens and in Storybook ${theme}`, async ({ page, browser }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    await adminPage(page, '/settings/api-keys')
    const dashboard = await rootTokens(page)

    const seller = await browser.newPage()
    await seller.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    await sellerPage(seller, '/earnings')
    const sellerPanel = await rootTokens(seller)

    const storyPage = await browser.newPage()
    await storyPage.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    await openStory(storyPage, 'dashboard-ui-primitives-button--default', theme)
    const storybook = await rootTokens(storyPage)

    const differing = (a: Record<string, string>, b: Record<string, string>) =>
      [...new Set([...Object.keys(a), ...Object.keys(b)])]
        .filter((name) => a[name] !== b[name])
        .map((name) => ({ name, screen: a[name] ?? null, story: b[name] ?? null }))
    mkdirSync(`${results}tokens/`, { recursive: true })
    writeFileSync(
      `${results}tokens/${theme}.json`,
      JSON.stringify(
        {
          theme,
          revision,
          counts: {
            dashboard: Object.keys(dashboard).length,
            sellerPanel: Object.keys(sellerPanel).length,
            storybook: Object.keys(storybook).length,
          },
          dashboardAgainstStorybook: differing(dashboard, storybook),
          sellerPanelAgainstStorybook: differing(sellerPanel, storybook),
        },
        null,
        2,
      ),
    )
    await seller.close()
    await storyPage.close()
  })

  for (const item of cases) {
    test(`${item.id} ${item.name} ${theme}`, async ({ page, browser }) => {
      const folder = `${results}${item.name}/`
      mkdirSync(folder, { recursive: true })
      const size = item.phone ? phone : item.window
      if (size) await page.setViewportSize(size)
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })

      const onScreen = await item.screen(page)
      await expect(onScreen).toBeVisible({ timeout: 20_000 })
      await page.waitForTimeout(500)
      // Styles first: a value painted out for the screenshot fades back
      // afterwards, and its colours would be read halfway.
      const screenStyles = await collectStyles(onScreen)
      const screenImage = await (item.viewport ? page : onScreen).screenshot(hidden(item, page))
      const screenWidth = (await onScreen.boundingBox())?.width

      const storyPage = await browser.newPage({
        viewport: size ?? { width: 1280, height: 800 },
      })
      await storyPage.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
      await openStory(storyPage, item.story, theme, item.held)
      const inStory = await item.inStory(storyPage)
      await expect(inStory).toBeVisible()
      await storyPage.waitForTimeout(500)
      const storyStyles = await collectStyles(inStory)
      const storyImage = await (item.viewport ? storyPage : inStory).screenshot(
        hidden(item, storyPage),
      )
      const storyWidth = (await inStory.boundingBox())?.width

      writeFileSync(`${folder}${theme}-screen.png`, screenImage)
      writeFileSync(`${folder}${theme}-story.png`, storyImage)
      await sideBySide(storyPage, screenImage, storyImage, `${folder}${theme}-side-by-side.png`)
      const comparison = compareStyles(screenStyles, storyStyles)
      writeFileSync(
        `${folder}${theme}-styles.json`,
        JSON.stringify(
          {
            id: item.id,
            story: item.story,
            theme,
            revision,
            screenWidth,
            storyWidth,
            ...comparison,
            styles: { screen: screenStyles, story: storyStyles },
          },
          null,
          2,
        ),
      )
      await storyPage.close()
      await item.after?.()
    })
  }
}
