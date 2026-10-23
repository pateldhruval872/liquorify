import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, type Page, request, test } from '@playwright/test'
import { FIXTURE_PROMO_PRODUCT, getCredentials, login } from '../../dashboard/e2e/helpers'
import { admin } from './staff'

/**
 * The platform batch's step P3: Spree's plugin example,
 * `@spree/dashboard-plugin-example`, loaded into a running dashboard, with
 * each entry it adds captured on the screen it lands on.
 *
 * Build the dashboard with the example switched on, into a folder of its own so
 * the stock build is untouched, and serve it on port 5176 beside the stock one
 * on 5174, both against Spree's browser-test server:
 *
 *   cd packages/dashboard
 *   VITE_EXAMPLE_PLUGIN=true npx vite build --outDir <folder> --emptyOutDir
 *   VITE_API_PROXY_TARGET=http://localhost:3010 npx vite preview --outDir <folder> --port 5176
 *
 * The build regenerates `src/routeTree.gen.ts` with the example's routes; put
 * Spree's file back afterwards with `git checkout`, so nothing in Spree changes.
 *
 * The example ships no backend: its README says a real plugin would ship a
 * Rails engine for `/api/v3/admin/brands`. So the brand pages are opened twice,
 * once as they are, where the server answers that path with "not found", and
 * once with the browser answering it with invented brands. Results go to
 * `results/plugin/`: a screenshot and a JSON file for each entry, with the
 * revision from `FIDELITY_REVISION`.
 */

const PLUGIN = process.env.PLUGIN_URL ?? 'http://localhost:5176'
const STOCK = process.env.STOCK_URL ?? 'http://localhost:5174'
const results = new URL('./results/plugin/', import.meta.url).pathname
const revision = process.env.FIDELITY_REVISION ?? null

const brands = [
  {
    id: 'brand_fidelity1',
    name: 'Fidelity Brand One',
    slug: 'fidelity-brand-one',
    description: 'An invented brand, answered by the browser.',
    logo_url: null,
    products_count: 3,
    created_at: '2026-10-01T09:00:00.000Z',
    updated_at: '2026-10-01T09:00:00.000Z',
  },
  {
    id: 'brand_fidelity2',
    name: 'Fidelity Brand Two',
    slug: 'fidelity-brand-two',
    description: null,
    logo_url: null,
    products_count: 0,
    created_at: '2026-10-02T09:00:00.000Z',
    updated_at: '2026-10-02T09:00:00.000Z',
  },
]

let storeId: string
let productId: string

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

/** Records how the server answered each request for the example's brand endpoints. */
function brandAnswers(page: Page) {
  const answers: { path: string; status: number }[] = []
  page.on('response', (response) => {
    const url = new URL(response.url())
    if (url.pathname.startsWith('/api/v3/admin/brands')) {
      answers.push({ path: url.pathname, status: response.status() })
    }
  })
  return answers
}

/** Answers the example's brand endpoints in the browser, since nothing on the server serves them. */
const answerBrands = (page: Page) =>
  page.route('**/api/v3/admin/brands**', (route) => {
    const { pathname } = new URL(route.request().url())
    const id = pathname.split('/').pop()
    const brand = brands.find((candidate) => candidate.id === id)
    if (brand) return route.fulfill({ json: brand })
    return route.fulfill({
      json: {
        data: brands,
        meta: { page: 1, limit: 25, count: brands.length, pages: 1, from: 1, to: brands.length },
      },
    })
  })

async function save(page: Page, name: string, facts: Record<string, unknown>) {
  mkdirSync(results, { recursive: true })
  await page.screenshot({ path: `${results}${name}.png` })
  writeFileSync(
    `${results}${name}.json`,
    `${JSON.stringify({ capture: name, revision, ...facts }, null, 2)}\n`,
  )
}

const productsSection = (page: Page) =>
  page.getByRole('link', { name: /^Products/ }).locator('xpath=ancestor::li[1]')

test.use({ baseURL: PLUGIN, viewport: { width: 1280, height: 960 } })

test.beforeAll(async () => {
  storeId = getCredentials().store_id
  const api = await request.newContext({ baseURL: PLUGIN })
  try {
    const { headers } = await admin(api)
    const res = await api.get(
      `/api/v3/admin/products?search=${encodeURIComponent(FIXTURE_PROMO_PRODUCT)}`,
      { headers },
    )
    expect(res.ok(), await res.text()).toBeTruthy()
    productId = ((await res.json()) as { data: { id: string }[] }).data[0].id
  } finally {
    await api.dispose()
  }
})

test('navigation: Brands is listed under Products', async ({ page }) => {
  const outside = await blockOutside(page)
  await login(page)
  await page.goto(`/${storeId}/products`)
  await page.waitForLoadState('networkidle')
  const brandsLink = page.getByRole('link', { name: 'Brands', exact: true })
  await expect(brandsLink).toBeVisible()
  const children = await productsSection(page).getByRole('link').allInnerTexts()
  await save(page, 'navigation', {
    path: `/${storeId}/products`,
    productsSection: children,
    outside,
  })
})

test('route: the Brands page, as the server answers it', async ({ page }) => {
  const outside = await blockOutside(page)
  const answers = brandAnswers(page)
  await login(page)
  await page.goto(`/${storeId}/products`)
  await page.getByRole('link', { name: 'Brands', exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`/${storeId}/brands/?(\\?|$)`))
  await expect(page.getByText('Brands').first()).toBeVisible()
  await expect.poll(() => answers.length, { timeout: 15_000 }).toBeGreaterThan(0)
  // The table retries a failed request before it gives up, so wait for its
  // loading rows to clear, and record whether they did.
  let settled = true
  try {
    await expect(page.locator('[data-slot="skeleton"]:visible')).toHaveCount(0, { timeout: 30_000 })
  } catch {
    settled = false
  }
  await save(page, 'brands-page-server', {
    path: new URL(page.url()).pathname,
    serverAnswers: answers,
    settled,
    table: await page.getByRole('table').innerText(),
    outside,
  })
})

test('route: the Brands page and a brand, with the browser answering for the missing backend', async ({
  page,
}) => {
  const outside = await blockOutside(page)
  await answerBrands(page)
  await login(page)
  await page.goto(`/${storeId}/brands`)
  for (const brand of brands) {
    await expect(page.getByRole('link', { name: brand.name })).toBeVisible({ timeout: 15_000 })
  }
  for (const header of ['Name', 'Slug', 'Products']) {
    await expect(page.getByRole('columnheader', { name: header })).toBeVisible()
  }
  await save(page, 'brands-page-answered', {
    path: new URL(page.url()).pathname,
    intercepted: 'The browser answers /api/v3/admin/brands with two invented brands',
    outside,
  })

  await page.getByRole('link', { name: brands[0].name }).click()
  await expect(page).toHaveURL(new RegExp(`/${storeId}/brands/${brands[0].id}$`))
  await expect(page.getByRole('heading', { name: brands[0].name })).toBeVisible()
  await expect(page.getByText('About this brand')).toBeVisible()
  await save(page, 'brand-page-answered', {
    path: new URL(page.url()).pathname,
    intercepted: 'The browser answers /api/v3/admin/brands/<id> with an invented brand',
    outside,
  })
})

test('slot: the Brand card in the product page sidebar', async ({ page }) => {
  const outside = await blockOutside(page)
  await login(page)
  await page.goto(`/${storeId}/products/${productId}`)
  await page.waitForLoadState('networkidle')
  const card = page.locator('[data-slot="card"]').filter({ hasText: 'No brand assigned.' })
  await expect(card).toBeVisible({ timeout: 15_000 })
  await card.scrollIntoViewIfNeeded()
  await save(page, 'product-brand-card', {
    path: new URL(page.url()).pathname,
    slot: 'product.form_sidebar',
    card: await card.innerText(),
    outside,
  })
})

test('table: the Brand column offered on the products table', async ({ page }) => {
  const outside = await blockOutside(page)
  await login(page)
  await page.goto(`/${storeId}/products`)
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('columnheader', { name: 'Brand', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Columns' }).click()
  const option = page.getByRole('menuitemcheckbox', { name: 'Brand', exact: true })
  await expect(option).toBeVisible()
  await option.click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('columnheader', { name: 'Brand', exact: true })).toBeVisible()
  await save(page, 'products-brand-column', {
    path: new URL(page.url()).pathname,
    columns: await page.getByRole('columnheader').allInnerTexts(),
    outside,
  })
})

test('control: the stock dashboard, built without the example, shows none of its entries', async ({
  page,
}) => {
  const outside = await blockOutside(page)
  const creds = getCredentials()
  const res = await page.request.post(`${STOCK}/api/v3/admin/auth/login`, {
    data: { email: creds.admin_email, password: creds.admin_password },
  })
  expect(res.ok(), await res.text()).toBeTruthy()
  await page.goto(`${STOCK}/${storeId}/products/${productId}`)
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('link', { name: /^Products/ })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('link', { name: 'Brands', exact: true })).toHaveCount(0)
  await expect(page.getByText('No brand assigned.')).toHaveCount(0)
  await save(page, 'stock-product-page', {
    path: new URL(page.url()).pathname,
    productsSection: await productsSection(page).getByRole('link').allInnerTexts(),
    outside,
  })
})
