import { mkdirSync, writeFileSync } from 'node:fs'
import { type APIRequestContext, expect, type Page, test } from '@playwright/test'

/**
 * The hosted dashboards, for the platform batch's step P1: the built dashboard
 * and seller panel served by Spree's own server at `/dashboard` and `/sellers`,
 * each signed in to through that same origin. Spree's browser-test server does
 * not load the gem that hosts them, so this runs against the gem's own test app
 * (`spree/dashboard`, `rake test_app`), given Spree's seeds, a first admin
 * through Spree's own seed settings, `ADMIN_EMAIL` and `ADMIN_PASSWORD`, and a
 * seller through `spree:sellers:sample_data` with `SELLER_EMAIL` and
 * `SELLER_PASSWORD`.
 *
 * Build the dashboard with `VITE_BASE_PATH=/dashboard/ pnpm --dir
 * packages/dashboard-starter build` and the seller panel with
 * `VITE_BASE_PATH=/sellers/ pnpm --dir packages/seller-dashboard-starter
 * build`, start that app on port 3020 with `SPREE_DASHBOARD_DIST_PATH` and
 * `SPREE_SELLER_PANEL_DIST_PATH` naming the builds, and pass the accounts as
 * `HOSTED_ADMIN_EMAIL`, `HOSTED_ADMIN_PASSWORD`, `HOSTED_SELLER_EMAIL` and
 * `HOSTED_SELLER_PASSWORD`. Results go to `results/hosted/`, with no password.
 */

const HOSTED = process.env.HOSTED_URL ?? 'http://localhost:3020'
const EMAIL = process.env.HOSTED_ADMIN_EMAIL ?? ''
const PASSWORD = process.env.HOSTED_ADMIN_PASSWORD ?? ''
const SELLER_EMAIL = process.env.HOSTED_SELLER_EMAIL ?? ''
const SELLER_PASSWORD = process.env.HOSTED_SELLER_PASSWORD ?? ''
const RESULTS = new URL('./results/hosted/', import.meta.url)

/** Records the origin of every request the page sends. */
function originsOf(page: Page) {
  const origins = new Set<string>()
  page.on('request', (sent) => {
    const url = new URL(sent.url())
    if (url.protocol.startsWith('http')) origins.add(url.origin)
  })
  return origins
}

/**
 * The app's page and script under `mount`: the page uncached, the script cached
 * for good, and the page again for a deep link and for a path that tries to
 * climb out of the build folder.
 */
async function servedAt(request: APIRequestContext, mount: string) {
  const index = await request.get(`${HOSTED}${mount}`)
  const html = await index.text()
  const script = html.match(new RegExp(`src="(${mount}/assets/[^"]+\\.js)"`))?.[1]
  expect(index.status()).toBe(200)
  expect(script).toBeTruthy()
  const asset = await request.get(`${HOSTED}${script}`)
  const deepLink = await request.get(`${HOSTED}${mount}/record_unknown/products`)
  const traversal = await request.get(`${HOSTED}${mount}/..%2f..%2fconfig%2fdatabase.yml`)
  expect(asset.headers()['cache-control']).toContain('immutable')
  expect(index.headers()['cache-control']).toBe('no-cache')
  expect(await deepLink.text()).toBe(html)
  expect(await traversal.text()).toBe(html)
  return {
    script: script as string,
    index: { status: index.status(), cacheControl: index.headers()['cache-control'] },
    asset: { status: asset.status(), cacheControl: asset.headers()['cache-control'] },
    deepLinkServesIndex: true,
    traversalServesIndex: true,
  }
}

test('The dashboard served by Spree at /dashboard', async ({ page, request }) => {
  test.skip(!EMAIL || !PASSWORD, 'needs HOSTED_ADMIN_EMAIL and HOSTED_ADMIN_PASSWORD')
  mkdirSync(RESULTS, { recursive: true })
  const origins = originsOf(page)
  const { script: _script, ...served } = await servedAt(request, '/dashboard')

  await page.goto(`${HOSTED}/dashboard`)
  await expect(page.getByText(/welcome back/i)).toBeVisible({ timeout: 20_000 })
  await page.screenshot({ path: new URL('sign-in.png', RESULTS).pathname })
  await page.getByLabel(/email/i).fill(EMAIL)
  await page.getByLabel(/password/i).fill(PASSWORD)
  await page.getByRole('button', { name: /^sign in$/i }).click()
  await expect(page).toHaveURL(/\/dashboard\/store_[^/]+/, { timeout: 20_000 })
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: new URL('home.png', RESULTS).pathname })

  const store = new URL(page.url()).pathname.split('/').slice(0, 3).join('/')
  await page.goto(`${HOSTED}${store}/products`)
  await expect(page.getByRole('heading', { name: /^products$/i })).toBeVisible({ timeout: 20_000 })
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: new URL('products-reloaded.png', RESULTS).pathname })

  expect([...origins]).toEqual([HOSTED])
  writeFileSync(
    new URL('hosted.json', RESULTS),
    `${JSON.stringify(
      { ...served, signedIn: true, productsAfterReload: true, oneOrigin: true },
      null,
      2,
    )}\n`,
  )
})

test('The seller panel served by Spree at /sellers', async ({ page, request }) => {
  test.skip(
    !SELLER_EMAIL || !SELLER_PASSWORD,
    'needs HOSTED_SELLER_EMAIL and HOSTED_SELLER_PASSWORD',
  )
  mkdirSync(RESULTS, { recursive: true })
  const origins = originsOf(page)
  const { script, ...served } = await servedAt(request, '/sellers')
  const dashboard = await (await request.get(`${HOSTED}/dashboard`)).text()
  // Its own build: serving the operator's dashboard here would hand sellers the back office.
  expect(dashboard).not.toContain(script)

  await page.goto(`${HOSTED}/sellers/login`)
  await page.getByLabel(/^email$/i).fill(SELLER_EMAIL)
  await page.getByLabel(/^password$/i).fill(SELLER_PASSWORD)
  await page.getByRole('button', { name: /^sign in$/i }).click()
  await expect(page).toHaveURL(/\/sellers\/sel_[^/]+$/, { timeout: 20_000 })
  await expect(page.getByRole('heading', { name: /^hello,/i })).toBeVisible({ timeout: 20_000 })
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: new URL('seller-home.png', RESULTS).pathname })

  await page.goto(`${page.url()}/products`)
  await expect(page.getByRole('heading', { name: /^products$/i })).toBeVisible({ timeout: 20_000 })
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: new URL('seller-products-reloaded.png', RESULTS).pathname })

  expect([...origins]).toEqual([HOSTED])
  writeFileSync(
    new URL('sellers.json', RESULTS),
    `${JSON.stringify(
      {
        ...served,
        ownBuild: true,
        signedIn: true,
        productsAfterReload: true,
        oneOrigin: true,
      },
      null,
      2,
    )}\n`,
  )
})
