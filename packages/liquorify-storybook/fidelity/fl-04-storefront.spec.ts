import { mkdirSync, writeFileSync } from 'node:fs'
import { type APIRequestContext, expect, type Page, test } from '@playwright/test'
import { login } from '../../dashboard/e2e/helpers'
import { deleteProductsNamed } from './catalog'
import { admin } from './staff'

/**
 * FL-04's last step on the running storefront (batch 5 part 1, criterion 15).
 * A product created and published through the admin dashboard opens on the
 * storefront for its channel; once it is unlisted from that channel, the
 * storefront gives its unavailable response.
 *
 * Before running, start Spree's browser-test server and the built dashboard
 * on port 5174, as `compare.spec.ts` describes, and the storefront, built for
 * production at the revision under test against the same server, on port 3001
 * (`STOREFRONT_URL`), with that server's default publishable key.
 *
 * The storefront shows any failure to load a product as its not-found page,
 * answered with status 200 (batch 4's B1), so each request is also put to the
 * Store API with the storefront's key, which reads the store's default channel,
 * the only one the product is listed on: a server error there, or on the
 * storefront, fails the check. The storefront keeps a product it has shown for up to ten minutes
 * (its product requests are cached with a ten-minute life and nothing clears
 * them when a product changes), so after the product is unlisted the check asks
 * every 15 seconds for up to 13 minutes and records each answer. The product
 * is deleted at the end.
 */

const storefront = process.env.STOREFRONT_URL ?? 'http://localhost:3001'
const results = new URL('./results/fl-04/', import.meta.url).pathname
const revision = process.env.FIDELITY_REVISION ?? null
const name = 'Fidelity FL-04 teapot'
const storefrontPath = (slug: string) => `/us/en/products/${slug}`

interface Answer {
  /** Seconds since the product was unlisted, or null before. */
  afterUnlisting: number | null
  storefront: { status: number; showsProduct: boolean; showsNotFound: boolean }
  /** The Store API's answer to the storefront's key, which reads the default channel. */
  storeApi: number
}

test.setTimeout(20 * 60_000)

test.afterAll(async ({ baseURL }) => {
  await deleteProductsNamed(baseURL ?? 'http://localhost:5174', name)
})

/** The storefront's publishable key, read through the Admin API and never written out. */
async function storefrontKey(api: APIRequestContext) {
  const { headers } = await admin(api)
  const list = (await (await api.get('/api/v3/admin/api_keys?limit=50', { headers })).json()) as {
    data: { id: string; key_type: string; channel_id: string | null; revoked_at: string | null }[]
  }
  const id = list.data.find(
    (key) => key.key_type === 'publishable' && !key.channel_id && !key.revoked_at,
  )?.id
  expect(id, "the storefront's publishable key").toBeTruthy()
  const key = (await (await api.get(`/api/v3/admin/api_keys/${id}`, { headers })).json()) as {
    plaintext_token: string
  }
  return key.plaintext_token
}

async function ask(
  page: Page,
  api: APIRequestContext,
  key: string,
  slug: string,
  afterUnlisting: number | null,
): Promise<Answer> {
  const response = await page.request.get(`${storefront}${storefrontPath(slug)}`, {
    maxRedirects: 0,
  })
  const html = await response.text()
  const answer: Answer = {
    afterUnlisting,
    storefront: {
      status: response.status(),
      showsProduct: html.includes(`>${name}</h1>`),
      showsNotFound: html.includes('<title>Product Not Found'),
    },
    storeApi: (
      await api.get(`/api/v3/store/products/${slug}`, { headers: { 'X-Spree-API-Key': key } })
    ).status(),
  }
  expect(answer.storefront.status, 'the storefront answered with a server error').toBeLessThan(500)
  expect(answer.storeApi, 'the Store API answered with a server error').toBeLessThan(500)
  return answer
}

const publishingCard = (page: Page) =>
  page
    .locator('[data-slot="card"]')
    .filter({ has: page.locator('[data-slot="card-title"]', { hasText: /^Publishing$/ }) })

const fillCell = async (page: Page, cellName: RegExp, value: string) => {
  const cell = page.getByRole('textbox', { name: cellName })
  await cell.dblclick()
  await cell.fill(value)
  await cell.blur()
}

test('FL-04 on the running storefront', async ({ page, browser, baseURL }) => {
  mkdirSync(results, { recursive: true })
  const shot = (file: string, target: Page = page) =>
    target.screenshot({ path: `${results}${file}.png` })
  const api = page.request
  const key = await storefrontKey(api)
  await deleteProductsNamed(baseURL ?? 'http://localhost:5174', name)

  // DA-PRD-02: create the product with one price and stock, active, on the default channel.
  const session = await login(page)
  await page.goto(`/${session.store_id}/products/new`)
  await expect(page.getByRole('heading', { name: 'New product' })).toBeVisible()
  await page.getByRole('textbox', { name: 'Name' }).fill(name)
  await fillCell(page, /^price for default$/i, '28.00')
  await fillCell(page, /^on hand at shop location$/i, '5')
  await expect(publishingCard(page).getByText(/online store/i)).toBeVisible({ timeout: 15_000 })
  await page.getByRole('button', { name: /^create product$/i }).click()
  await expect(page).toHaveURL(new RegExp(`/${session.store_id}/products/prod_[^/]+$`), {
    timeout: 30_000,
  })
  const productId = page.url().split('/').pop() as string

  // DA-PRD-03: activate it; with no date, its default channel row reads "Live".
  await page
    .locator('[data-slot="card"]')
    .filter({ has: page.locator('[data-slot="card-title"]', { hasText: /^Status$/ }) })
    .getByRole('combobox')
    .click()
  await page.getByRole('option', { name: /^active$/i }).click()
  await page.getByRole('button', { name: /save product/i }).click()
  await expect(page.getByRole('button', { name: /save product/i })).toBeDisabled({
    timeout: 15_000,
  })
  await expect(publishingCard(page).getByText(/^live$/i)).toBeVisible({ timeout: 15_000 })
  const slug = await page.getByRole('textbox', { name: 'Slug' }).inputValue()
  await page.mouse.move(700, 95)
  await shot('1-dashboard-published')

  // SF-SHOP-04: the product on the storefront, for the channel its key reads.
  const shopper = await browser.newPage({ viewport: { width: 1280, height: 960 } })
  const opened = await shopper.goto(`${storefront}${storefrontPath(slug)}`)
  await expect(shopper.getByRole('heading', { name, level: 1 })).toBeVisible({ timeout: 30_000 })
  await shot('2-storefront-listed', shopper)
  const listed = await ask(page, api, key, slug, null)
  expect(opened?.status()).toBe(200)
  expect(listed.storeApi).toBe(200)

  // DA-PRD-03: unlist it from the default channel and save.
  const card = publishingCard(page)
  await card.getByRole('button', { name: /^manage$/i }).click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /online store/i })
    .click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /^done$/i })
    .click()
  await page.getByRole('button', { name: /save product/i }).click()
  await expect(page.getByRole('button', { name: /save product/i })).toBeDisabled({
    timeout: 15_000,
  })
  const unlistedAt = Date.now()
  await expect(card.getByText(/online store/i)).toBeHidden()
  await page.mouse.move(700, 95)
  await shot('3-dashboard-unlisted')

  // The storefront and the Store API asked again until the storefront stops showing it.
  const answers: Answer[] = [listed]
  for (;;) {
    const seconds = Math.round((Date.now() - unlistedAt) / 1000)
    const answer = await ask(page, api, key, slug, seconds)
    answers.push(answer)
    if (!answer.storefront.showsProduct || seconds > 13 * 60) break
    await page.waitForTimeout(15_000)
  }
  const last = answers[answers.length - 1]
  await shopper.goto(`${storefront}${storefrontPath(slug)}`)
  await shopper.waitForLoadState('networkidle')
  await shot('4-storefront-unlisted', shopper)

  writeFileSync(
    `${results}answers.json`,
    JSON.stringify(
      {
        revision,
        storefront,
        product: { id: productId, name, slug },
        firstOpened: opened?.status() ?? null,
        answers,
      },
      null,
      2,
    ),
  )
  expect(answers[1].storeApi, 'the Store API still serves it once unlisted').toBe(404)
  expect(last.storefront.showsProduct, 'the storefront still shows it after 13 minutes').toBe(false)
  expect(last.storefront.showsNotFound, "the storefront's not-found page").toBe(true)
  await shopper.close()
})
