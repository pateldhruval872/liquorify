import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, request, test } from '@playwright/test'
import { login } from '../../dashboard/e2e/helpers'
import { call, chequeMethods, type Json, list, orderCustomerEmail, skus, variantId } from './orders'
import { admin } from './staff'

/**
 * SD-36's check: once an order's only fulfillment is canceled, the order page
 * never offers Add fulfillment again, though the server still ships those
 * units in a new one. Start the screens as `compare.spec.ts` describes; the
 * sample customer `orders.ts` uses must exist.
 *
 * A fresh order of two Electric Kettles is placed and paid by cheque through
 * the Admin API, and its fulfillment canceled. Then:
 *   1. the order page's Fulfillments card is captured, as the admin;
 *   2. the server is asked to return one of the canceled units, and its
 *      answer kept;
 *   3. the server is asked for a new fulfillment of both units from the same
 *      location, and its answer kept;
 *   4. the card is captured again.
 * Each run leaves its order behind, canceled at the end so nothing is owed.
 *
 * The captures are `results/sd-36/<step>.png`, with `answers.json`.
 */

const results = new URL('./results/sd-36/', import.meta.url).pathname
const revision = process.env.FIDELITY_REVISION ?? null
const expand = 'expand=items,fulfillments,fulfillments.fulfillment_items'

test.use({ viewport: { width: 1280, height: 1100 } })

test('SD-36: a canceled fulfillment keeps its units claimed on the order page', async ({
  page,
  baseURL,
}) => {
  mkdirSync(results, { recursive: true })
  const api = await request.newContext({ baseURL })
  const { creds, headers } = await admin(api)
  const methods = await chequeMethods(baseURL as string, api, headers)
  const [customer] = await list(
    api,
    headers,
    `customers?q[email_eq]=${encodeURIComponent(orderCustomerEmail)}`,
  )
  expect(customer, `the sample customer ${orderCustomerEmail}`).toBeTruthy()
  const kettle = await variantId(api, headers, skus.kettle)
  const [reason] = await list(api, headers, 'return_reasons')

  const draft = await call(api, headers, 'post', 'orders', {
    customer_id: customer.id,
    use_customer_default_address: true,
    items: [{ variant_id: kettle, quantity: 2 }],
  })
  const unpaid = await call(api, headers, 'get', `orders/${draft.id}`)
  await call(api, headers, 'post', `orders/${draft.id}/payments`, {
    payment_method_id: methods.cheque,
    amount: unpaid.amount_due,
  })
  await call(api, headers, 'patch', `orders/${draft.id}/complete`, { notify_customer: false })
  const placed = await call(api, headers, 'get', `orders/${draft.id}?${expand}`)
  const [fulfilment] = placed.fulfillments as Json[]
  await call(
    api,
    headers,
    'patch',
    `orders/${draft.id}/fulfillments/${fulfilment.id}/cancel`,
    undefined,
  )
  const canceled = await call(api, headers, 'get', `orders/${draft.id}?${expand}`)
  const [line] = canceled.items as Json[]
  const [unit] = (canceled.fulfillments as Json[])[0].fulfillment_items as Json[]

  await login(page)
  const storeId = creds.store_id
  const card = page
    .locator('[data-slot="card"]')
    .filter({ has: page.locator('[data-slot="card-title"]', { hasText: /^Fulfillments/ }) })
    .first()
  const capture = async (name: string) => {
    await page.goto(`/${storeId}/orders/${draft.id}`)
    await expect(page.getByRole('heading', { name: canceled.number as string })).toBeVisible({
      timeout: 15_000,
    })
    await card.scrollIntoViewIfNeeded()
    await page.evaluate(() => document.fonts.ready)
    await card.screenshot({ path: `${results}${name}.png`, animations: 'disabled' })
    return {
      add_fulfillment_shown: await card
        .getByRole('button', { name: 'Add fulfillment' })
        .isVisible(),
      card_text: (await card.innerText()).replace(/\s+/g, ' ').trim(),
    }
  }

  const before = await capture('1-canceled')

  const returnAnswer = await api.post(`/api/v3/admin/orders/${draft.id}/returns`, {
    headers,
    data: {
      items: [{ fulfillment_item_id: unit.id, quantity: 1 }],
      ...(reason && { reason_id: reason.id }),
    },
  })
  const returnBody = await returnAnswer.json().catch(() => null)
  if (returnAnswer.ok() && returnBody?.id) {
    await call(api, headers, 'patch', `orders/${draft.id}/returns/${returnBody.id}/cancel`, {})
  }

  const createAnswer = await api.post(`/api/v3/admin/orders/${draft.id}/fulfillments`, {
    headers,
    data: {
      stock_location_id: fulfilment.stock_location_id,
      items: [{ item_id: line.id, quantity: 2 }],
    },
  })
  const createBody = await createAnswer.json().catch(() => null)
  const after = await capture('2-new-fulfilment')
  const reread = await call(api, headers, 'get', `orders/${draft.id}?${expand}`)

  await call(api, headers, 'patch', `orders/${draft.id}/cancel`, {}).catch(() => null)

  writeFileSync(
    `${results}answers.json`,
    `${JSON.stringify(
      {
        revision,
        order: canceled.number,
        before,
        return_of_a_canceled_unit: { status: returnAnswer.status(), body: returnBody },
        new_fulfilment: {
          status: createAnswer.status(),
          fulfilment_status: createBody?.status ?? null,
          errors: createAnswer.ok() ? null : createBody,
        },
        fulfilments_after: (reread.fulfillments as Json[]).map((each) => ({
          status: each.status,
          units: (each.fulfillment_items as Json[]).reduce(
            (sum, item) => sum + Number(item.quantity),
            0,
          ),
        })),
        after,
      },
      null,
      2,
    )}\n`,
  )

  expect(before.add_fulfillment_shown, 'Add fulfillment after the cancel').toBe(false)
  expect(createAnswer.status(), 'the server ships the canceled units again').toBe(201)
  await api.dispose()
})
