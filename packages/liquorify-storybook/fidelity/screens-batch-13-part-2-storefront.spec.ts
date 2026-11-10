import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, type Locator, type Page, request, test } from '@playwright/test'
import { type SellerPanel, seedSellerPanel } from './seller-panel'
import { admin } from './staff'

/**
 * Batch 13 part 2's storefront screens (work item §10.2): a guest's cart
 * holding two sellers' products, checkout's delivery step with each seller's
 * rates, and the order placed page for the order group, at 390 and 1280
 * pixels. This is FL-13's purchase (§10.4), placed with Check, so each width
 * places one real order that the seller panel then lists.
 *
 * Captured on the storefront at its `main`, built for production against the
 * browser-test server on port 3001 (`STOREFRONT_URL`), as batch 9 ran it, with
 * the server's default publishable key. Each capture is saved as
 * `results/screens/<screen ID>/<state>/guest-<width>.png` with a `.json`.
 */

const storefront = process.env.STOREFRONT_URL ?? 'http://localhost:3001'
const shopPath = '/us/en'
const results = new URL('./results/screens/', import.meta.url).pathname
const revision = process.env.FIDELITY_REVISION ?? null
const widths = { 390: { width: 390, height: 844 }, 1280: { width: 1280, height: 960 } } as const

let panel: SellerPanel
const slugs: string[] = []
const names: string[] = []

test.describe.configure({ mode: 'serial' })
test.setTimeout(5 * 60_000)

test.beforeAll(async () => {
  test.setTimeout(600_000)
  panel = await seedSellerPanel('http://localhost:3010')
  const api = await request.newContext({ baseURL: 'http://localhost:3010' })
  try {
    const { headers } = await admin(api)
    for (const id of [panel.market.products.active, panel.market.products.second]) {
      const product = await (await api.get(`/api/v3/admin/products/${id}`, { headers })).json()
      slugs.push(product.slug as string)
      names.push(product.name as string)
    }
  } finally {
    await api.dispose()
  }
})

async function hydrated(locator: Locator) {
  await expect
    .poll(
      () =>
        locator.evaluate((element) =>
          Object.keys(element).some((key) => key.startsWith('__reactFiber')),
        ),
      { timeout: 30_000 },
    )
    .toBe(true)
}

async function save(page: Page, screen: string, state: string, width: number, fullPage = true) {
  const folder = `${results}${screen}/${state}/`
  mkdirSync(folder, { recursive: true })
  await page.screenshot({ path: `${folder}guest-${width}.png`, fullPage })
  const path = new URL(page.url())
  writeFileSync(
    `${folder}guest-${width}.json`,
    JSON.stringify(
      {
        screen,
        state,
        variant: 'guest',
        server: 'browser-test server',
        app: 'storefront',
        revision,
        path: path.pathname.replace(/\/(checkout|order-placed)\/[^/]+/, '/$1/<order>'),
        viewport: page.viewportSize(),
        fullPage,
        intercepted: null,
      },
      null,
      2,
    ),
  )
}

for (const width of [1280, 390] as const) {
  test(`FL-13 two sellers' products bought by a guest at ${width}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: widths[width],
      locale: 'en-US',
      timezoneId: 'UTC',
      reducedMotion: 'reduce',
    })
    const page = await context.newPage()
    try {
      for (const [index, slug] of slugs.entries()) {
        await page.goto(`${storefront}${shopPath}/products/${slug}`)
        const add = page.getByRole('button', { name: /add to cart/i })
        await hydrated(add)
        await expect(add).toBeEnabled({ timeout: 10_000 })
        await add.click()
        await expect(
          page
            .getByRole('dialog', { name: /^cart/i })
            .getByRole('link', { name: names[index] })
            .first(),
        ).toBeVisible({ timeout: 30_000 })
      }

      await page.goto(`${storefront}${shopPath}/cart`)
      for (const name of names) {
        await expect(page.getByRole('main').getByText(name).first()).toBeVisible({
          timeout: 30_000,
        })
      }
      await page.waitForLoadState('networkidle')
      await save(page, 'SF-SHOP-05', 'two-sellers', width)

      await page.getByRole('main').getByRole('link', { name: 'Proceed to Checkout' }).click()
      const email = page.getByPlaceholder('Email address')
      await hydrated(email)
      await email.fill(`fl13.guest.${width}@example.com`)
      await page.getByLabel(/country/i).selectOption({ label: 'United States' })
      await page
        .getByLabel(/first name/i)
        .first()
        .fill('Jun')
      await page
        .getByLabel(/last name/i)
        .first()
        .fill('Park')
      await page
        .getByLabel(/^address$/i)
        .first()
        .fill('22 Wharf Street')
      await page.getByLabel(/city/i).first().fill('Portland')
      await page
        .getByLabel(/zip|postal code/i)
        .first()
        .fill('97205')
      await page.getByLabel(/phone/i).first().fill('5035550142')
      await page
        .getByLabel(/state|province/i)
        .first()
        .selectOption({ label: 'Oregon' })
      await page.getByRole('heading', { name: 'Shipping Method' }).click()
      const chosen = page
        .locator('#checkout-section-shipping')
        .getByRole('radio', { checked: true })
      await expect(chosen.first()).toBeVisible({ timeout: 30_000 })
      await page.waitForLoadState('networkidle')
      await save(page, 'SF-CHK-01', 'two-sellers-delivery', width)

      // The store's only payment method, Check, is chosen already; its radio
      // carries no name, so it is found by the instruction beside it.
      await expect(page.getByText(/receive payment instructions after placing/i)).toBeVisible({
        timeout: 30_000,
      })
      await page.getByRole('checkbox', { name: /i agree/i }).check()
      await page.getByRole('button', { name: 'Place Order' }).click()
      await page.waitForURL(/\/order-placed\//, { timeout: 60_000 })
      await expect(page.getByText(/^Order #\S+$/).first()).toBeVisible({ timeout: 30_000 })
      await page.waitForLoadState('networkidle')
      await save(page, 'SF-CHK-03', 'order-group-placed', width)
    } finally {
      await context.close()
    }
  })
}
