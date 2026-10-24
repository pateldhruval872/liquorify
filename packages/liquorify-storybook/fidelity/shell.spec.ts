import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, type Page, request, test } from '@playwright/test'
import {
  FIXTURE_PROMO_CUSTOMER_EMAIL,
  FIXTURE_PROMO_CUSTOMER_FULL_NAME,
  FIXTURE_PROMO_PRODUCT,
  getCredentials,
  login,
} from '../../dashboard/e2e/helpers'
import { updateAvailable } from '../src/fixtures/admin/shell'
import { animationsFinished } from './animations'
import { admin } from './staff'

/**
 * The platform batch's step P6: browser tests for the five dashboard shell
 * behaviours that part 2 of the staff access batch captured but no browser
 * test drives (G-22). Unlike the captures, each asserts what the screen shows
 * after each step, signed in as the browser tests' admin, whose role shows
 * every control.
 *
 * Start Spree's browser-test server and the built dashboard as
 * `compare.spec.ts` describes; the Storybook and the seller panel are not
 * needed. The switcher's second store is the browser tests' own: their setup
 * adds the store `Winkel` and gives the admin a role on it. Each test blocks
 * every request that would leave the local servers and records it.
 *
 * Results go to `results/shell/`: one JSON file and one screenshot for each
 * test, with what each step showed and the revision from `FIDELITY_REVISION`.
 */

const results = new URL('./results/shell/', import.meta.url).pathname
const revision = process.env.FIDELITY_REVISION ?? null

interface Records {
  storeId: string
  storeName: string
  otherStoreId: string
  product: { id: string; name: string }
  order: { id: string; number: string }
  customer: { id: string; name: string }
}

let records: Records

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

async function save(page: Page, name: string, steps: Record<string, unknown>[], outside: string[]) {
  mkdirSync(results, { recursive: true })
  await animationsFinished(page)
  await page.screenshot({ path: `${results}${name}.png` })
  writeFileSync(
    `${results}${name}.json`,
    `${JSON.stringify({ test: name, revision, steps, outside }, null, 2)}\n`,
  )
}

const openStore = async (page: Page, path = '') => {
  await page.goto(`/${records.storeId}${path}`)
  await page.waitForLoadState('networkidle')
}

/**
 * What the page shows for its theme: the root's class and colour scheme, and
 * the page's background once its colour transition has finished.
 */
async function shownTheme(page: Page) {
  await page.waitForFunction(() =>
    document.body.getAnimations().every((animation) => animation.playState !== 'running'),
  )
  return page.evaluate(() => ({
    dark: document.documentElement.classList.contains('dark'),
    colorScheme: document.documentElement.style.colorScheme,
    background: getComputedStyle(document.body).backgroundColor,
  }))
}

const openUserMenu = async (page: Page) => {
  await page.getByRole('button', { name: 'User menu' }).click()
  await expect(page.getByRole('menuitem', { name: 'Log out' })).toBeVisible()
}

test.beforeAll(async ({ baseURL }) => {
  const creds = getCredentials()
  const api = await request.newContext({ baseURL })
  try {
    const { headers } = await admin(api)
    const get = async (path: string) => {
      const res = await api.get(`/api/v3/admin/${path}`, { headers })
      expect(res.ok(), await res.text()).toBeTruthy()
      return (await res.json()) as { data: Record<string, string>[] }
    }
    const [product] = (await get(`products?search=${encodeURIComponent(FIXTURE_PROMO_PRODUCT)}`))
      .data
    const [order] = (await get('orders?limit=1')).data
    const [customer] = (
      await get(`customers?q[email_eq]=${encodeURIComponent(FIXTURE_PROMO_CUSTOMER_EMAIL)}`)
    ).data
    records = {
      storeId: creds.store_id,
      storeName: creds.store_name,
      otherStoreId: creds.comma_store_id,
      product: { id: product.id, name: product.name },
      order: { id: order.id, number: order.number },
      customer: { id: customer.id, name: FIXTURE_PROMO_CUSTOMER_FULL_NAME },
    }
  } finally {
    await api.dispose()
  }
})

test('theme: light, dark and system from the account menu, kept after a reload', async ({
  page,
}) => {
  // The browser prefers dark at first, so choosing light changes what shows,
  // and switching the preference afterwards shows that "system" follows it.
  await page.emulateMedia({ colorScheme: 'dark' })
  const outside = await blockOutside(page)
  await login(page)
  await openStore(page)
  const steps: Record<string, unknown>[] = [{ step: 'opened', ...(await shownTheme(page)) }]

  await openUserMenu(page)
  const option = (name: string) => page.getByRole('button', { name, exact: true })

  await option('Light').click()
  await expect(option('Light')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('html')).not.toHaveClass(/\bdark\b/)
  const light = await shownTheme(page)
  steps.push({ step: 'chose light', ...light })

  await option('Dark').click()
  await expect(option('Dark')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('html')).toHaveClass(/\bdark\b/)
  const dark = await shownTheme(page)
  steps.push({ step: 'chose dark', ...dark })
  expect(dark.background).not.toBe(light.background)

  await option('System').click()
  await expect(option('System')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('html')).toHaveClass(/\bdark\b/)
  const systemDark = await shownTheme(page)
  steps.push({ step: 'chose system, the browser preferring dark', ...systemDark })
  expect(systemDark.background).toBe(dark.background)

  await page.emulateMedia({ colorScheme: 'light' })
  await expect(page.locator('html')).not.toHaveClass(/\bdark\b/)
  const systemLight = await shownTheme(page)
  steps.push({ step: 'the browser then preferred light', ...systemLight })
  expect(systemLight.background).toBe(light.background)

  await page.reload()
  await page.waitForLoadState('networkidle')
  await expect(page.locator('html')).not.toHaveClass(/\bdark\b/)
  await page.emulateMedia({ colorScheme: 'dark' })
  await expect(page.locator('html')).toHaveClass(/\bdark\b/)
  await openUserMenu(page)
  await expect(option('System')).toHaveAttribute('aria-pressed', 'true')
  const reloaded = await shownTheme(page)
  steps.push({ step: 'reloaded, then the browser preferred dark again', ...reloaded })
  expect(reloaded.background).toBe(dark.background)

  await save(page, 'theme', steps, outside)
})

test('store switcher: choosing the second store opens its dashboard', async ({ page }) => {
  const outside = await blockOutside(page)
  await login(page)
  await openStore(page)
  const switcher = page.getByRole('button', { name: 'Switch store' })
  await expect(switcher).toContainText(records.storeName)
  const steps: Record<string, unknown>[] = [{ step: 'opened', path: new URL(page.url()).pathname }]

  await switcher.click()
  const menu = page.getByRole('menu')
  await expect(menu.getByRole('menuitem', { name: records.storeName })).toBeVisible()
  await expect(menu.getByRole('menuitem', { name: 'Winkel' })).toBeVisible()
  steps.push({
    step: 'opened the switcher',
    stores: await menu.getByRole('menuitem').allInnerTexts(),
  })

  await menu.getByRole('menuitem', { name: 'Winkel' }).click()
  await expect(page).toHaveURL(new RegExp(`/${records.otherStoreId}(/|$)`))
  await expect(switcher).toContainText('Winkel')
  await expect(switcher).not.toContainText(records.storeName)
  await page.waitForLoadState('networkidle')
  steps.push({
    step: 'chose Winkel',
    path: new URL(page.url()).pathname,
    switcher: await switcher.innerText(),
  })

  await save(page, 'store-switcher', steps, outside)
})

test('notifications: a newer release shows as unread, and opening it shows the release', async ({
  page,
}) => {
  const outside = await blockOutside(page)
  await page.route('**/api/v3/admin/updates', (route) => route.fulfill({ json: updateAvailable }))
  await login(page)
  await openStore(page)

  await page.getByRole('button', { name: 'Notifications, 1 unread' }).click()
  const dialog = page.getByRole('dialog')
  await expect(
    dialog.getByRole('heading', { name: `Spree ${updateAvailable.latest_version} is available` }),
  ).toBeVisible()
  await expect(
    dialog.getByText(`You are running Spree ${updateAvailable.current_version}.`),
  ).toBeVisible()
  const steps: Record<string, unknown>[] = [
    {
      step: 'opened the unread notice',
      intercepted: 'The update check is answered with a newer release',
      dialog: await dialog.innerText(),
    },
  ]

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(page.getByRole('button', { name: 'Notifications', exact: true })).toBeVisible()
  steps.push({ step: 'closed it; the bell no longer shows it unread' })

  await save(page, 'notifications-new-release', steps, outside)
})

test("notifications: without a newer release, they read “You're all caught up”", async ({
  page,
}) => {
  const outside = await blockOutside(page)
  const answer = page.waitForResponse('**/api/v3/admin/updates')
  await login(page)
  await openStore(page)
  const server = (await (await answer).json()) as Record<string, unknown>

  await page.getByRole('button', { name: 'Notifications', exact: true }).click()
  await expect(page.getByRole('dialog').getByText("You're all caught up.")).toBeVisible()
  await save(
    page,
    'notifications-nothing-new',
    [{ step: 'opened the notifications', serverAnswer: server }],
    outside,
  )
})

test('command palette: a product, an order and a customer found by name or number open their pages', async ({
  page,
}) => {
  const outside = await blockOutside(page)
  await login(page)
  const steps: Record<string, unknown>[] = []

  const cases = [
    {
      kind: 'product',
      query: records.product.name,
      option: records.product.name,
      path: `/products/${records.product.id}`,
      shows: records.product.name,
    },
    {
      kind: 'order',
      query: records.order.number,
      option: records.order.number,
      path: `/orders/${records.order.id}`,
      shows: records.order.number,
    },
    {
      kind: 'customer',
      query: records.customer.name,
      option: records.customer.name,
      path: `/customers/${records.customer.id}`,
      shows: records.customer.name,
    },
  ]

  for (const item of cases) {
    await openStore(page)
    await page.getByRole('button', { name: /search anything/i }).click()
    const input = page.getByRole('dialog').getByRole('combobox')
    await input.fill(item.query)
    const option = page.getByRole('option').filter({ hasText: item.option })
    await expect(option).toHaveCount(1, { timeout: 15_000 })
    const listed = await page.getByRole('option').allInnerTexts()
    await option.click()
    await expect(page).toHaveURL(new RegExp(`/${records.storeId}${item.path}$`))
    await expect(page.getByRole('heading', { name: item.shows }).first()).toBeVisible({
      timeout: 15_000,
    })
    steps.push({ kind: item.kind, query: item.query, listed, opened: item.path })
  }

  await save(page, 'command-palette-records', steps, outside)
})

test("rail's settings search: a page's name keeps it listed and opens it; no match says so", async ({
  page,
}) => {
  const outside = await blockOutside(page)
  await login(page)
  await openStore(page, '/settings/staff')
  const menu = page.getByRole('complementary', { name: 'Settings navigation' })
  const search = menu.getByRole('searchbox')
  // The menu's header keeps its link back to the dashboard whatever is typed.
  const pages = menu.getByRole('link', { name: /^(?!Back to dashboard$)/ })
  const steps: Record<string, unknown>[] = [
    { step: 'opened Staff', pagesListed: await pages.count() },
  ]

  await search.fill('Taxes')
  await expect(menu.getByRole('link', { name: 'Taxes' })).toBeVisible()
  await expect(menu.getByRole('link', { name: 'Staff' })).toHaveCount(0)
  steps.push({ step: 'typed “Taxes”', pagesListed: await pages.allInnerTexts() })

  await menu.getByRole('link', { name: 'Taxes' }).click()
  await expect(page).toHaveURL(new RegExp(`/${records.storeId}/settings/tax`))
  await expect(page.getByRole('heading', { name: 'Taxes' }).first()).toBeVisible()
  steps.push({ step: 'chose Taxes', path: new URL(page.url()).pathname })

  await search.fill('zzqx')
  await expect(menu.getByText('No settings match “zzqx”.')).toBeVisible()
  await expect(pages).toHaveCount(0)
  steps.push({
    step: 'typed “zzqx”',
    pagesListed: await pages.count(),
    message: await menu.getByText(/No settings match/).innerText(),
  })

  await save(page, 'settings-search', steps, outside)
})
