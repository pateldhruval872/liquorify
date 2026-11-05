import { mkdirSync, writeFileSync } from 'node:fs'
import { type APIRequestContext, expect, type Page, request, test } from '@playwright/test'
import { login } from '../../dashboard/e2e/helpers'
import { orderCustomerEmail } from './orders'
import { admin } from './staff'

/**
 * SD-31's check through the dashboard: a gift card applied to a draft order
 * stays spent after the draft is deleted from its page, so the next order
 * cannot use it. Start the screens as `compare.spec.ts` describes; the sample
 * customer `orders.ts` uses must exist.
 *
 * A fresh 20.00 gift card and two drafts for the sample customer, each with
 * one 2-Slice Toaster, are added through the Admin API. Then, as the admin:
 *   1. the gift card list shows the card unused;
 *   2. the card is applied to the first draft from its Discounts & Credit card;
 *   3. the first draft is deleted from its page's More actions menu;
 *   4. the gift card list shows the card again;
 *   5. the card is applied to the second draft.
 * The second draft is deleted at the end. The card cannot be removed, so each
 * run leaves one behind, named by the time it ran.
 *
 * Each step is saved as `results/sd-31/<step>.png`, with `answers.json`: the
 * card as the Admin API read it after each step, and the server's answer to
 * the last apply, which the dialog does not show.
 */

const results = new URL('./results/sd-31/', import.meta.url).pathname
const revision = process.env.FIDELITY_REVISION ?? null
const code = `FIDELITY-SD31-${Date.now()}`

type Json = Record<string, unknown> & { id: string }
type Headers = Record<string, string>

test.use({ viewport: { width: 1280, height: 960 } })

async function call(
  api: APIRequestContext,
  headers: Headers,
  method: 'get' | 'post' | 'delete',
  path: string,
  data?: object,
) {
  const res = await api[method](`/api/v3/admin/${path}`, { headers, ...(data && { data }) })
  expect(res.ok(), `${method} ${path}: ${await res.text()}`).toBeTruthy()
  return res.status() === 204 ? ({} as Json) : ((await res.json()) as Json)
}

const cardState = (card: Json) => ({
  status: card.status,
  amount: card.amount,
  amount_used: card.amount_used,
  amount_authorized: card.amount_authorized,
  amount_remaining: card.amount_remaining,
})

const discountsCard = (page: Page) =>
  page
    .locator('[data-slot="card"]')
    .filter({ has: page.locator('[data-slot="card-title"]', { hasText: /^discounts & credit$/i }) })
    .first()

async function applyGiftCard(page: Page, storeId: string, order: Json) {
  await page.goto(`/${storeId}/orders/${order.id}`)
  await expect(page.getByRole('heading', { name: order.number as string })).toBeVisible({
    timeout: 15_000,
  })
  const sidebar = discountsCard(page)
  await sidebar.scrollIntoViewIfNeeded()
  await sidebar.getByRole('button', { name: 'Apply' }).last().click()
  const dialog = page.getByRole('dialog')
  await dialog.locator('#gift-card-code').fill(code)
  // The dialog shows nothing when the server refuses the code, so its answer
  // is the only sign of the outcome.
  const [answer] = await Promise.all([
    page.waitForResponse(
      (res) =>
        res.url().endsWith(`/orders/${order.id}/gift_cards`) && res.request().method() === 'POST',
    ),
    dialog.getByRole('button', { name: 'Add' }).click(),
  ])
  return { status: answer.status(), body: await answer.json().catch(() => null) }
}

async function giftCardRow(page: Page, storeId: string) {
  await page.goto(`/${storeId}/loyalty/gift-cards`)
  await page
    .getByPlaceholder(/search/i)
    .first()
    .fill(code)
  const row = page.getByRole('row').filter({ hasText: new RegExp(code, 'i') })
  await expect(row).toBeVisible({ timeout: 15_000 })
  return row
}

test('SD-31 a deleted draft keeps its gift card spent', async ({ page, baseURL }) => {
  mkdirSync(results, { recursive: true })
  const api = await request.newContext({ baseURL })
  const { creds, headers } = await admin(api)
  const answers: Record<string, unknown> = { revision, code, ranAt: new Date().toISOString() }
  const readCard = async () =>
    cardState(
      (
        (await call(api, headers, 'get', `gift_cards?q[code_eq]=${code.toLowerCase()}`))
          .data as Json[]
      )[0],
    )
  const created: string[] = []
  const shot = (step: string) => page.screenshot({ path: `${results}${step}.png` })

  const card = await call(api, headers, 'post', 'gift_cards', {
    code,
    amount: '20.00',
    currency: 'USD',
  })
  const customers = (
    await call(
      api,
      headers,
      'get',
      `customers?q[email_eq]=${encodeURIComponent(orderCustomerEmail)}`,
    )
  ).data as Json[]
  const variants = (await call(api, headers, 'get', 'variants?q[sku_eq]=2-SLICE-TOASTER-WHITE'))
    .data as Json[]
  const draft = () =>
    call(api, headers, 'post', 'orders', {
      customer_id: customers[0].id,
      use_customer_default_address: true,
      items: [{ variant_id: variants[0].id, quantity: 1 }],
    })
  const first = await draft()
  const second = await draft()
  created.push(first.id, second.id)
  answers.drafts = { first: first.number, second: second.number }
  answers.created = cardState(card)

  try {
    await login(page)
    const storeId = creds.store_id

    await giftCardRow(page, storeId)
    await shot('1-card-unused')

    answers.firstApply = await applyGiftCard(page, storeId, first)
    await expect(discountsCard(page).getByText(new RegExp(code, 'i'))).toBeVisible()
    await shot('2-applied-to-first-draft')
    answers.afterFirstApply = await readCard()

    await page.getByRole('button', { name: 'More actions' }).click()
    await page.getByRole('menuitem', { name: 'Delete' }).click()
    const confirm = page.getByRole('dialog').filter({ hasText: /this cannot be undone/i })
    await confirm.getByRole('button', { name: 'Delete' }).click()
    await expect(confirm).toBeHidden()
    await expect(page).not.toHaveURL(new RegExp(first.id))
    await shot('3-first-draft-deleted')
    answers.firstDraftAfterDelete = (
      await api.get(`/api/v3/admin/orders/${first.id}`, { headers })
    ).status()
    answers.afterDelete = await readCard()

    await giftCardRow(page, storeId)
    await shot('4-card-after-delete')

    answers.secondApply = await applyGiftCard(page, storeId, second)
    await page.waitForTimeout(500)
    await shot('5-applied-to-second-draft')
    answers.afterSecondApply = await readCard()
  } finally {
    for (const id of created) await api.delete(`/api/v3/admin/orders/${id}`, { headers })
    writeFileSync(`${results}answers.json`, JSON.stringify(answers, null, 2))
    await api.dispose()
  }
})
