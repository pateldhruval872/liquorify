import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, type Locator, type Page, test } from '@playwright/test'
import { login, sellerLogin } from '../../dashboard/e2e/helpers'

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
 * the screens show keys from the test database.
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

async function openStory(page: Page, id: string, theme: 'light' | 'dark') {
  await page.goto(`${STORYBOOK}/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`)
  await page.waitForFunction(() =>
    ['completed', 'finished', 'afterEach'].includes(
      window.__STORYBOOK_PREVIEW__?.currentRender?.phase ?? '',
    ),
  )
  await page.evaluate(() => document.fonts.ready)
  await page.waitForLoadState('networkidle')
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

const cases: Case[] = [
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
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })

      const onScreen = await item.screen(page)
      await expect(onScreen).toBeVisible({ timeout: 20_000 })
      await page.waitForTimeout(500)
      const screenImage = item.viewport
        ? await page.screenshot({ mask: keyValues(page) })
        : await onScreen.screenshot({ mask: keyValues(page) })
      const screenStyles = await collectStyles(onScreen)
      const screenWidth = (await onScreen.boundingBox())?.width

      const storyPage = await browser.newPage({ viewport: { width: 1280, height: 800 } })
      await storyPage.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
      await openStory(storyPage, item.story, theme)
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
