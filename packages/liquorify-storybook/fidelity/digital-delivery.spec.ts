import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, type Page, request, test } from '@playwright/test'
import { login } from '../../dashboard/e2e/helpers'
import { call, chequeMethods, list, orderCustomerEmail, skus } from './orders'
import { admin } from './staff'

/**
 * Batch 8's digital delivery check, in two runs. The first adds a file to the
 * browser tests' digital product on its page, places an order for the product
 * through the Admin API, as staff complete a draft on DA-ORD-04, and captures
 * both sides. Start the screens as `compare.spec.ts` describes, after
 * `screens-batch-8.spec.ts` has seeded its orders. Then read the new order's
 * download token for the added file in Spree's browser-test app:
 *
 *   bin/rails runner 'puts Spree::Order.find_by!(number: "<order>").digital_links
 *     .find { |link| link.filename.to_s == "fidelity-care-guide.pdf" }.token'
 *
 * The second run, given the order number in `DIGITAL_ORDER` and the token in
 * `DIGITAL_LINK_TOKEN`, opens the link once, which spends one of its
 * downloads, and then once with a made-up token. The token is a secret for
 * that order, so it is never written out: each answer is saved with
 * `<token>` in its place in `results/digital-delivery/answers.json`, beside a
 * screenshot of the order's Downloads card before and after the download.
 */

const results = new URL('./results/digital-delivery/', import.meta.url).pathname
const revision = process.env.FIDELITY_REVISION ?? null
const number = process.env.DIGITAL_ORDER ?? ''
const token = process.env.DIGITAL_LINK_TOKEN ?? ''
const hide = (text: string) => (token ? text.replaceAll(token, '<token>') : text)
const fileName = 'fidelity-care-guide.pdf'
const pdf = '%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n'

test.use({ viewport: { width: 1280, height: 960 } })

const cardTitled = (page: Page, title: RegExp) =>
  page
    .locator('[data-slot="card"]')
    .filter({ has: page.locator('[data-slot="card-title"]', { hasText: title }) })
    .first()

test('a file added on its product page reaches the next order', async ({ page, baseURL }) => {
  test.skip(Boolean(number), 'Runs before the order is known')
  mkdirSync(results, { recursive: true })
  const api = await request.newContext({ baseURL })
  const { creds, headers } = await admin(api)
  const answers: Record<string, unknown> = { revision, file: fileName }
  try {
    const [variant] = await list(api, headers, `variants?q[sku_eq]=${skus.handbook}`)
    await login(page)
    await page.goto(`/${creds.store_id}/products/${variant.product_id}`)
    const files = cardTitled(page, /^digital files$/i)
    await files.scrollIntoViewIfNeeded()
    await expect(files).toBeVisible({ timeout: 15_000 })
    await files.locator('input[type="file"]').setInputFiles({
      name: fileName,
      mimeType: 'application/pdf',
      buffer: Buffer.from(pdf),
    })
    await expect(files.getByText(fileName)).toBeVisible({ timeout: 30_000 })
    answers.productFiles = (await files.innerText()).replace(/\s+/g, ' ').trim()
    await files.screenshot({ path: `${results}1-file-saved.png` })

    const [customer] = await list(
      api,
      headers,
      `customers?q[email_eq]=${encodeURIComponent(orderCustomerEmail)}`,
    )
    const { cheque } = await chequeMethods(baseURL ?? '', api, headers)
    const draft = await call(api, headers, 'post', 'orders', {
      customer_id: customer.id,
      use_customer_default_address: true,
      items: [{ variant_id: variant.id, quantity: 1 }],
    })
    const due = await call(api, headers, 'get', `orders/${draft.id}`)
    await call(api, headers, 'post', `orders/${draft.id}/payments`, {
      payment_method_id: cheque,
      amount: due.amount_due,
    })
    const placed = await call(api, headers, 'patch', `orders/${draft.id}/complete`, {})
    answers.order = placed.number
    await page.goto(`/${creds.store_id}/orders/${placed.id}`)
    await expect(page.getByRole('heading', { name: placed.number as string })).toBeVisible({
      timeout: 15_000,
    })
    const downloads = cardTitled(page, /^downloads$/i)
    await downloads.scrollIntoViewIfNeeded()
    await expect(downloads.getByText(fileName)).toBeVisible({ timeout: 15_000 })
    answers.orderDownloads = (await downloads.innerText()).replace(/\s+/g, ' ').trim()
    await downloads.screenshot({ path: `${results}2-order-downloads.png` })
  } finally {
    writeFileSync(`${results}saved.json`, JSON.stringify(answers, null, 2))
    await api.dispose()
  }
})

test('the digital order delivers its file', async ({ page, baseURL }) => {
  test.skip(!number || !token, 'Pass DIGITAL_ORDER and DIGITAL_LINK_TOKEN')
  mkdirSync(results, { recursive: true })
  const api = await request.newContext({ baseURL })
  const { creds, headers } = await admin(api)
  const answers: Record<string, unknown> = { revision, order: number }
  const found = await api.get(`/api/v3/admin/orders?q[number_eq]=${number}`, { headers })
  const order = ((await found.json()).data as { id: string }[])[0]

  const downloads = cardTitled(page, /^downloads$/i)
  const showCard = async (step: string) => {
    await page.goto(`/${creds.store_id}/orders/${order.id}`)
    await expect(page.getByRole('heading', { name: number })).toBeVisible({ timeout: 15_000 })
    await downloads.scrollIntoViewIfNeeded()
    await expect(downloads).toBeVisible()
    answers[step] = (await downloads.innerText()).replace(/\s+/g, ' ').trim()
    await downloads.screenshot({ path: `${results}${step}.png` })
  }

  const open = async (linkToken: string) => {
    const res = await api.get(`/api/v3/store/digital_links/${linkToken}`, { maxRedirects: 0 })
    const location = res.headers().location
    return {
      status: res.status(),
      contentType: res.headers()['content-type'] ?? null,
      // A signed file address is short-lived; only where it points is kept.
      redirectsTo: location
        ? hide(new URL(location).pathname.split('/').slice(0, 4).join('/'))
        : null,
      body: res.status() === 302 ? null : hide((await res.text()).slice(0, 300)),
    }
  }

  try {
    await login(page)
    await showCard('3-downloads-before')
    answers.download = await open(token)
    answers.madeUpToken = await open('not-a-real-download-token')
    await showCard('4-downloads-after')
  } finally {
    writeFileSync(`${results}answers.json`, JSON.stringify(answers, null, 2))
    await api.dispose()
  }
  expect((answers.download as { status: number }).status).toBeLessThan(400)
})
