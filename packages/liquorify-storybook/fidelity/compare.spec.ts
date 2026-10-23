import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, type Locator, type Page, test } from '@playwright/test'
import { getCredentials, login, sellerLogin } from '../../dashboard/e2e/helpers'
import { dashboardCounters, releaseNotes, updateAvailable } from '../src/fixtures/admin/shell'
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
 * teammates, roles and invitations they open first (`staff.ts`).
 */

const STORYBOOK = 'http://localhost:6007'
const results = new URL('./results/', import.meta.url).pathname
const revision = process.env.FIDELITY_REVISION ?? null

/** Hides API key values in screenshots. */
const keyValues = (page: Page) => [page.locator('[data-slot="card"] code')]

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
  /** The story holds a request open, to show what loads. */
  held?: boolean
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

const cases: Case[] = [
  ...pilotCases,
  ...primitivesBatchOne,
  ...staffAccessPartOne,
  ...staffAccessPartTwo,
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

// The staff cases need the teammates, roles and invitations `staff.ts` adds;
// adding them again reuses them.
test.beforeAll(async ({ baseURL }) => {
  await seed(baseURL ?? 'http://localhost:5174')
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
      if (item.phone) await page.setViewportSize(phone)
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })

      const onScreen = await item.screen(page)
      await expect(onScreen).toBeVisible({ timeout: 20_000 })
      await page.waitForTimeout(500)
      const screenImage = item.viewport
        ? await page.screenshot({ mask: keyValues(page) })
        : await onScreen.screenshot({ mask: keyValues(page) })
      const screenStyles = await collectStyles(onScreen)
      const screenWidth = (await onScreen.boundingBox())?.width

      const storyPage = await browser.newPage({
        viewport: item.phone ? phone : { width: 1280, height: 800 },
      })
      await storyPage.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
      await openStory(storyPage, item.story, theme, item.held)
      const inStory = await item.inStory(storyPage)
      await expect(inStory).toBeVisible()
      const storyImage = item.viewport
        ? await storyPage.screenshot({ mask: keyValues(storyPage) })
        : await inStory.screenshot({ mask: keyValues(storyPage) })
      const storyStyles = await collectStyles(inStory)
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
    })
  }
}
