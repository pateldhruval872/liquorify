import { mkdirSync, writeFileSync } from 'node:fs'
import { type APIRequestContext, expect, test } from '@playwright/test'
import { getCredentials } from '../../dashboard/e2e/helpers'
import {
  type Admin,
  adminCall,
  adminCaller,
  type Caller,
  type Case,
  type CaseResult,
  denied,
  fields,
  type Gap,
  gapResult,
  type Json,
  maskIds,
  type Probe,
  rows,
  runCases,
  send,
} from './one-store'
import { guestAddress, orderPayments } from './orders'
import { ensurePaymentMethods, paymentNames } from './payments-delivery'
import { PASSWORD, seed, teammates } from './staff'

/**
 * Step P12's Admin API refusals within one store, the named follow-up to P10:
 * items 1 and 2 of the platform work item's "P12's checks, recorded before
 * implementation". G-91 for batch 8 part 1's orders and their money, and G-95
 * for part 2's fulfilment and what happens after the sale. Each request is
 * sent as the teammates whose roles do not allow it, and as one who may, and
 * is judged by P7's `one-store.ts`.
 *
 * Start Spree's browser-test server first, freshly, as `stack.spec.ts` says.
 * The script adds `staff.ts`'s teammates, then the records this run aims at,
 * marked with the run's stamp. Results go to `results/p12/admin.json`, with no
 * response bodies, tokens or gift card codes.
 *
 * Every expected answer below is the one the work item recorded before this
 * script was written, by P10's rules A1 to A4 and P12's A5 and A6, with the
 * row number at the start of each case's title.
 */

const API = process.env.P12_API_URL ?? 'http://localhost:3010'
const results = new URL('./results/p12/', import.meta.url).pathname
const revision = process.env.FIDELITY_REVISION ?? null
const run = Date.now()

test.use({ baseURL: API })

const ids = (sent: { body: unknown }) => rows(sent.body).map((item) => item.id)
const statuses = (sent: { body: unknown }) => rows(sent.body).map((item) => [item.id, item.status])

/** A read-back through the admin, the teammate who may read everything. */
const reader =
  (admin: Caller) =>
  (path: string, pick?: (sent: { status: number; body: unknown }) => unknown): Case['state'] => ({
    caller: admin,
    request: { method: 'GET', path: `/api/v3/admin/${path}` },
    pick,
  })

/** Requests outside P12's cases, answered and recorded but not judged. */
async function observe(api: APIRequestContext, requests: [string, Caller, Probe][]) {
  const answers = []
  for (const [title, caller, probe] of requests) {
    const sent = await send(api, caller, probe)
    answers.push({
      title,
      caller: caller.name,
      request: `${probe.method} ${maskIds(probe.path)}`,
      status: sent.status,
      code: sent.code,
      requiredPermission: sent.requiredPermission,
    })
  }
  return answers
}

/** A label bought elsewhere: a one-page PDF, uploaded to private storage as the dashboard does. */
async function uploadLabel(api: APIRequestContext, admin: Caller) {
  const res = await api.post('/api/v3/admin/files', {
    headers: admin.headers,
    multipart: {
      file: {
        name: 'label.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n'),
      },
      filename: 'label.pdf',
      content_type: 'application/pdf',
      visibility: 'private',
    },
  })
  expect(res.ok(), `uploading a label: ${res.status()}`).toBeTruthy()
  return ((await res.json()) as { signed_id: string }).signed_id
}

interface Records {
  email: string
  variants: { first: string; second: string }
  methods: { cheque: string; later: string }
  locationId: string
  giftCard: { id: string; code: string }
  code: string
  reason: { id: string; name: string }
  returnReason: string
  claimReason: string
  orders: Record<string, Json>
}

/** The run's records, made by the admin through the Admin API. */
async function seedRecords(call: Admin): Promise<Records> {
  const email = `p12-${run}@example.com`
  const product = async (name: string) => {
    const made = await call('POST', 'products', {
      name,
      status: 'active',
      prices: [{ amount: '20.00', currency: 'USD' }],
    })
    const [variant] = rows(await call('GET', `products/${made.id}/variants?limit=10`))
    return String(variant?.id ?? made.default_variant_id)
  }
  const variants = {
    first: await product(`P12 kettle ${run}`),
    second: await product(`P12 toaster ${run}`),
  }
  const locations = rows(await call('GET', 'stock_locations?limit=100'))
  const location = locations.find((item) => item.default) ?? locations[0]
  expect(location, 'a stock location').toBeTruthy()
  const locationId = String(location.id)
  await call('POST', 'stock_levels/bulk_upsert', {
    stock_levels: Object.values(variants).map((variant) => ({
      variant_id: variant,
      stock_location_id: locationId,
      count_on_hand: 200,
    })),
  })

  await ensurePaymentMethods(API)
  const methodList = rows(await call('GET', 'payment_methods?limit=100'))
  let later = methodList.find((method) => method.name === orderPayments.later)
  if (!later) {
    later = await call('POST', 'payment_methods', {
      name: orderPayments.later,
      type: 'check',
      active: false,
      storefront_visible: false,
      capture_method: 'manual',
    })
  }
  const cheque = methodList.find((method) => method.name === paymentNames.cheque)
  expect(cheque, 'the cheque method').toBeTruthy()
  const methods = { cheque: String(cheque?.id), later: String(later.id) }

  // Spree keeps gift card codes in lower case.
  const cardCode = `p12-card-${run}`
  const card = await call('POST', 'gift_cards', { code: cardCode, amount: '5.00', currency: 'USD' })
  const code = `p12code${run}`
  await call('POST', 'promotions', {
    name: `P12 promotion ${run}`,
    kind: 'coupon_code',
    code,
    match_policy: 'all',
    actions: [{ type: 'free_shipping' }],
  })
  const reasonName = `P12 reason ${run}`
  const reason = await call('POST', 'order_cancellation_reasons', { name: reasonName })
  const returnReason = rows(await call('GET', 'return_reasons?limit=100'))[0]
  const claimReason = rows(await call('GET', 'claim_reasons?limit=100'))[0]
  expect(returnReason, 'a return reason').toBeTruthy()
  expect(claimReason, 'a claim reason').toBeTruthy()

  const item = (variant: string, quantity = 1) => ({ variant_id: variant, quantity })
  const draft = (items: object[]) =>
    call('POST', 'orders', {
      email,
      shipping_address: guestAddress,
      billing_address: guestAddress,
      items,
      internal_note: `P12 run ${run}`,
    })
  const placed = async (items: object[], method = methods.cheque) => {
    const order = await draft(items)
    const current = await call('GET', `orders/${order.id}`)
    await call('POST', `orders/${order.id}/payments`, {
      payment_method_id: method,
      amount: current.amount_due,
    })
    await call('PATCH', `orders/${order.id}/complete`, { notify_customer: false })
    return call(
      'GET',
      `orders/${order.id}?expand=items,fulfillments,fulfillments.fulfillment_items`,
    )
  }
  const fulfilments = (order: Json) => order.fulfillments as Json[]
  const shipped = async (items: object[]) => {
    const order = await placed(items)
    for (const fulfilment of fulfilments(order)) {
      await call('PATCH', `orders/${order.id}/fulfillments/${fulfilment.id}/fulfill`, {
        notify_customer: false,
        tracking: `1Z${run}`,
      })
    }
    return call(
      'GET',
      `orders/${order.id}?expand=items,fulfillments,fulfillments.fulfillment_items`,
    )
  }

  const orders: Record<string, Json> = {}
  orders.A = await placed([item(variants.first)])
  orders.D = await draft([item(variants.first, 2), item(variants.second)])
  await call('POST', `orders/${orders.D.id}/discounts`, {
    label: `P12 discount ${run}`,
    value: '2.00',
  })
  await call('POST', `orders/${orders.D.id}/fees`, {
    label: `P12 fee ${run}`,
    amount: '1.50',
    kind: 'gift_wrap',
  })
  orders.G = await draft([item(variants.first)])
  orders.E1 = await placed([item(variants.first)], methods.later)
  orders.E2 = await placed([item(variants.first)], methods.later)
  orders.B = await placed([item(variants.first)])
  orders.F1 = await placed([item(variants.first, 2)])
  orders.F2 = await placed([item(variants.first)])
  orders.F3 = await placed([item(variants.first)])
  await call('PATCH', `orders/${orders.F3.id}/fulfillments/${fulfilments(orders.F3)[0].id}/cancel`)
  orders.F4 = await shipped([item(variants.first)])
  orders.F5 = await placed([item(variants.first)])
  orders.F6 = await placed([item(variants.first)])
  orders.R = await shipped([item(variants.first, 3), item(variants.second, 2)])
  orders.R2 = await shipped([item(variants.first, 3), item(variants.second)])

  return {
    email,
    variants,
    methods,
    locationId,
    giftCard: { id: String(card.id), code: cardCode },
    code,
    reason: { id: String(reason.id), name: reasonName },
    returnReason: String(returnReason.id),
    claimReason: String(claimReason.id),
    orders,
  }
}

const unitOf = (order: Json, variant: string) =>
  (order.fulfillments as Json[])
    .flatMap((fulfilment) => fulfilment.fulfillment_items as Json[])
    .find((unit) => unit.variant_id === variant) as Json
const lineOf = (order: Json, variant: string) =>
  (order.items as Json[]).find((line) => line.variant_id === variant) as Json

/** Item 1: G-91, batch 8's part 1, orders and their money. */
async function orderCases(people: Record<string, Caller>, call: Admin, records: Records) {
  const { admin, support, packer, orderManager, merchandiser, settingsViewer } = people
  const read = reader(admin)
  const { orders, variants } = records
  const gap: Gap = 'G-91'
  const area = 'orders'
  const both = (key: string): Case['attempts'] => [
    { caller: support, expected: denied(key) },
    { caller: packer, expected: denied(key) },
  ]
  const at = (order: Json, path = '') => `/api/v3/admin/orders/${order.id}${path}`

  const discount = rows(await call('GET', `orders/${orders.D.id}/discounts?limit=100`)).find(
    (item) => String(item.label).startsWith('P12 discount'),
  ) as Json
  const fee = rows(await call('GET', `orders/${orders.D.id}/fees?limit=100`)).find((item) =>
    String(item.label).startsWith('P12 fee'),
  ) as Json
  const items = rows(await call('GET', `orders/${orders.D.id}/items?limit=100`))
  const firstLine = items.find((line) => line.variant_id === variants.first) as Json
  const secondLine = items.find((line) => line.variant_id === variants.second) as Json
  const payments = async (order: Json) =>
    rows(await call('GET', `orders/${order.id}/payments?limit=100`))
  const [paymentA] = await payments(orders.A)
  const [authorized1] = await payments(orders.E1)
  const [authorized2] = await payments(orders.E2)
  const addressPick = (sent: { status: number; body: unknown }) => {
    const body = sent.body as Json
    return [sent.status, body.shipping_address, body.billing_address]
  }
  const newEmail = `p12-changed-${run}@example.com`
  const draftEmail = `p12-new-draft-${run}@example.com`
  const changedAddress = { ...guestAddress, address1: `${run} Cedar Court` }

  const cases: Case[] = [
    {
      gap,
      area,
      title: "1.1 Save an order's contact email",
      request: { method: 'PATCH', path: at(orders.A), data: { email: newEmail } },
      attempts: both('write_orders'),
      control: { caller: orderManager, status: 200 },
      state: read(`orders/${orders.A.id}`, fields('email')),
    },
    {
      gap,
      area,
      title: "1.2 Save an order's notes",
      request: {
        method: 'PATCH',
        path: at(orders.A),
        data: { customer_note: `P12 customer note ${run}`, internal_note: `P12 note ${run}` },
      },
      attempts: both('write_orders'),
      control: { caller: orderManager, status: 200 },
      state: read(`orders/${orders.A.id}`, fields('customer_note', 'internal_note')),
    },
    {
      gap,
      area,
      title: "1.3 Save an order's shipping and billing address",
      request: {
        method: 'PATCH',
        path: at(orders.A),
        data: { shipping_address: changedAddress, billing_address: changedAddress },
      },
      attempts: both('write_orders'),
      control: { caller: orderManager, status: 200 },
      state: read(`orders/${orders.A.id}?expand=shipping_address,billing_address`, addressPick),
    },
    {
      gap,
      area,
      title: '1.4 Add a discount',
      request: {
        method: 'POST',
        path: at(orders.D, '/discounts'),
        data: { label: `P12 added discount ${run}`, value: '1.00' },
      },
      attempts: both('write_orders'),
      control: { caller: orderManager, status: 201 },
      state: read(`orders/${orders.D.id}/discounts?limit=100`, ids),
    },
    {
      gap,
      area,
      title: '1.5 Change a discount',
      request: {
        method: 'PATCH',
        path: at(orders.D, `/discounts/${discount.id}`),
        // The row's amount, which a change takes; the same sign, a different value.
        data: { amount: String(discount.amount).startsWith('-') ? '-1.25' : '1.25' },
      },
      attempts: both('write_orders'),
      control: { caller: orderManager, status: 200 },
      state: read(`orders/${orders.D.id}/discounts/${discount.id}`, fields('amount', 'value')),
    },
    {
      gap,
      area,
      title: '1.6 Remove a discount',
      request: { method: 'DELETE', path: at(orders.D, `/discounts/${discount.id}`) },
      attempts: both('write_orders'),
      control: { caller: orderManager, status: 204 },
      state: read(`orders/${orders.D.id}/discounts?limit=100`, ids),
    },
    {
      gap,
      area,
      title: '1.7 Add a fee',
      request: {
        method: 'POST',
        path: at(orders.D, '/fees'),
        data: { label: `P12 added fee ${run}`, amount: '2.50', kind: 'gift_wrap' },
      },
      attempts: both('write_orders'),
      control: { caller: orderManager, status: 201 },
      state: read(`orders/${orders.D.id}/fees?limit=100`, ids),
    },
    {
      gap,
      area,
      title: '1.8 Change a fee',
      request: { method: 'PATCH', path: at(orders.D, `/fees/${fee.id}`), data: { amount: '3.25' } },
      attempts: both('write_orders'),
      control: { caller: orderManager, status: 200 },
      state: read(`orders/${orders.D.id}/fees/${fee.id}`, fields('amount')),
    },
    {
      gap,
      area,
      title: '1.9 Remove a fee',
      request: { method: 'DELETE', path: at(orders.D, `/fees/${fee.id}`) },
      attempts: both('write_orders'),
      control: { caller: orderManager, status: 204 },
      state: read(`orders/${orders.D.id}/fees?limit=100`, ids),
    },
    {
      gap,
      area,
      title: '1.10 Add a payment from the payments card',
      request: {
        method: 'POST',
        path: at(orders.D, '/payments'),
        data: { payment_method_id: records.methods.cheque, amount: '1.00' },
      },
      attempts: both('write_payments'),
      control: { caller: admin, status: 201 },
      state: read(`orders/${orders.D.id}/payments?limit=100`, ids),
    },
    {
      gap,
      area,
      title: '1.11 Capture an authorized payment',
      request: { method: 'PATCH', path: at(orders.E1, `/payments/${authorized1.id}/capture`) },
      attempts: both('write_payments'),
      control: { caller: orderManager, status: 200 },
      state: read(`orders/${orders.E1.id}/payments/${authorized1.id}`, fields('status')),
    },
    {
      gap,
      area,
      title: '1.12 Void an authorized payment',
      request: { method: 'PATCH', path: at(orders.E2, `/payments/${authorized2.id}/void`) },
      attempts: both('write_payments'),
      control: { caller: orderManager, status: 200 },
      state: read(`orders/${orders.E2.id}/payments/${authorized2.id}`, fields('status')),
    },
    {
      gap,
      area,
      title: '1.13 Apply a discount code',
      request: {
        method: 'POST',
        path: at(orders.D, '/discount_codes'),
        data: { code: records.code },
      },
      attempts: both('write_orders'),
      control: { caller: orderManager, status: 201 },
      state: read(
        `orders/${orders.D.id}`,
        fields('discount_codes', 'promotion_codes', 'coupon_code'),
      ),
    },
    {
      gap,
      area,
      title: '1.14 Remove a discount code',
      request: { method: 'DELETE', path: at(orders.D, `/discount_codes/${records.code}`) },
      attempts: both('write_orders'),
      control: { caller: orderManager, status: 200 },
      state: read(
        `orders/${orders.D.id}`,
        fields('discount_codes', 'promotion_codes', 'coupon_code'),
      ),
    },
    {
      gap,
      area,
      title: '1.15 Apply a gift card',
      request: {
        method: 'POST',
        path: at(orders.G, '/gift_cards'),
        data: { code: records.giftCard.code },
      },
      attempts: both('write_orders'),
      control: { caller: orderManager, status: 201 },
      state: read(`orders/${orders.G.id}`, fields('gift_card_id', 'gift_card_total')),
    },
    {
      gap,
      area,
      title: '1.16 Remove the gift card',
      request: { method: 'DELETE', path: at(orders.G, `/gift_cards/${records.giftCard.id}`) },
      attempts: both('write_orders'),
      control: { caller: orderManager, status: 204 },
      state: read(`orders/${orders.G.id}`, fields('gift_card_id', 'gift_card_total')),
    },
    {
      gap,
      area,
      title: '1.17 Add an item',
      request: {
        method: 'POST',
        path: at(orders.D, '/items'),
        data: { variant_id: variants.second, quantity: 1 },
      },
      attempts: both('write_orders'),
      control: { caller: orderManager, status: 201 },
      state: read(`orders/${orders.D.id}/items?limit=100`, (sent) =>
        rows(sent.body).map((line) => [line.id, line.quantity]),
      ),
    },
    {
      gap,
      area,
      title: "1.18 Change an item's quantity",
      request: {
        method: 'PATCH',
        path: at(orders.D, `/items/${firstLine.id}`),
        data: { quantity: 3 },
      },
      attempts: both('write_orders'),
      control: { caller: orderManager, status: 200 },
      state: read(`orders/${orders.D.id}/items/${firstLine.id}`, fields('quantity')),
    },
    {
      gap,
      area,
      title: '1.19 Remove an item',
      request: { method: 'DELETE', path: at(orders.D, `/items/${secondLine.id}`) },
      attempts: both('write_orders'),
      control: { caller: orderManager, status: 204 },
      state: read(`orders/${orders.D.id}/items?limit=100`, ids),
    },
    {
      gap,
      area,
      title: '1.20 Create a draft from the new order page',
      request: {
        method: 'POST',
        path: '/api/v3/admin/orders',
        data: { email: draftEmail, items: [{ variant_id: variants.first, quantity: 1 }] },
      },
      attempts: both('write_orders'),
      control: { caller: orderManager, status: 201 },
      state: read(`orders?incomplete=1&q[email_eq]=${encodeURIComponent(draftEmail)}`, ids),
    },
    {
      gap,
      area,
      title: '1.21 Cancel a placed order',
      request: {
        method: 'PATCH',
        path: at(orders.B, '/cancel'),
        data: { cancel_reason_id: records.reason.id, notify_customer: false },
      },
      attempts: both('write_orders'),
      control: { caller: orderManager, status: 200 },
      state: read(`orders/${orders.B.id}`, fields('status')),
    },
    {
      gap,
      area,
      title: "1.22 Read an order's payments",
      request: { method: 'GET', path: at(orders.A, '/payments') },
      attempts: both('read_payments'),
      control: { caller: orderManager, status: 200 },
      protectedValues: [String(paymentA.id), String(paymentA.number)],
    },
    {
      gap,
      area,
      title: '1.23 Read one payment',
      request: { method: 'GET', path: at(orders.A, `/payments/${paymentA.id}`) },
      attempts: both('read_payments'),
      control: { caller: orderManager, status: 200 },
      protectedValues: [String(paymentA.id), String(paymentA.number)],
    },
    {
      gap,
      area,
      title: "1.24 Read the store's cancellation reasons",
      request: { method: 'GET', path: '/api/v3/admin/order_cancellation_reasons?limit=100' },
      attempts: [{ caller: orderManager, expected: denied('read_settings') }],
      control: { caller: settingsViewer, status: 200 },
      protectedValues: [records.reason.name],
    },
    {
      gap,
      area,
      title: '1.25 Read the order list',
      request: { method: 'GET', path: '/api/v3/admin/orders?limit=100' },
      attempts: [{ caller: merchandiser, expected: denied('read_orders') }],
      control: { caller: support, status: 200 },
      protectedValues: [String(orders.A.number)],
    },
    {
      gap,
      area,
      title: '1.26 Read the draft list',
      request: { method: 'GET', path: '/api/v3/admin/orders?incomplete=1&limit=100' },
      attempts: [{ caller: merchandiser, expected: denied('read_orders') }],
      control: { caller: support, status: 200 },
      protectedValues: [String(orders.D.number)],
    },
    {
      gap,
      area,
      title: '1.27 Read an order',
      request: { method: 'GET', path: at(orders.A) },
      attempts: [{ caller: merchandiser, expected: denied('read_orders') }],
      control: { caller: support, status: 200 },
      protectedValues: [String(orders.A.number), newEmail],
    },
  ]
  return cases
}

/** Item 2: G-95, batch 8's part 2, fulfilment and what happens after the sale. */
async function afterSaleCases(
  api: APIRequestContext,
  people: Record<string, Caller>,
  call: Admin,
  records: Records,
) {
  const { admin, support, packer, orderManager, merchandiser } = people
  const read = reader(admin)
  const { orders, variants } = records
  const gap: Gap = 'G-95'
  const area = 'after the sale'
  const supportOnly = (key: string): Case['attempts'] => [
    { caller: support, expected: denied(key) },
  ]
  const both = (key: string): Case['attempts'] => [
    { caller: support, expected: denied(key) },
    { caller: packer, expected: denied(key) },
  ]
  const at = (order: Json, path = '') => `/api/v3/admin/orders/${order.id}${path}`
  const fulfilmentOf = (order: Json) => (order.fulfillments as Json[])[0]
  const f1 = fulfilmentOf(orders.F1)
  const f2 = fulfilmentOf(orders.F2)
  const f4 = fulfilmentOf(orders.F4)
  const f5 = fulfilmentOf(orders.F5)
  const f6 = fulfilmentOf(orders.F6)
  const fulfilmentState = (order: Json) =>
    read(`orders/${order.id}/fulfillments?limit=100`, statuses)
  const deliveries = `orders/${orders.F5.id}/fulfillments/${f5.id}/deliveries`
  const consignment = await call('POST', deliveries, { tracking_number: `1Z9${run}A` })
  const spare = await call('POST', deliveries, { tracking_number: `1Z9${run}B` })
  const labels = `orders/${orders.F6.id}/fulfillments/${f6.id}/labels`
  const labelFile = await uploadLabel(api, admin)
  const deliveryState = read(`${deliveries}?limit=100`, (sent) =>
    rows(sent.body).map((item) => [
      item.id,
      item.tracking_number,
      item.carrier,
      item.status,
      item.delivered_at,
    ]),
  )

  // R2's own return, second return, exchange and claim, opened by the admin.
  const r2 = orders.R2
  const openReturn = () =>
    call('POST', `orders/${r2.id}/returns`, {
      items: [{ fulfillment_item_id: unitOf(r2, variants.first).id, quantity: 1 }],
      reason_id: records.returnReason,
    })
  const toApprove = await openReturn()
  const toCancel = await openReturn()
  const exchange = await call('POST', `orders/${r2.id}/exchanges`, {
    items: [
      {
        fulfillment_item_id: unitOf(r2, variants.second).id,
        new_variant_id: variants.first,
        quantity: 1,
      },
    ],
    reason_id: records.returnReason,
  })
  const claim = await call('POST', `orders/${r2.id}/claims`, {
    items: [{ line_item_id: lineOf(r2, variants.first).id, quantity: 1 }],
    reason_id: records.claimReason,
  })
  const r = orders.R

  const cases: Case[] = [
    {
      gap,
      area,
      title: '2.1 Create a fulfilment for waiting units',
      request: {
        method: 'POST',
        path: at(orders.F3, '/fulfillments'),
        data: { stock_location_id: records.locationId },
      },
      attempts: supportOnly('write_fulfillments'),
      control: { caller: admin, status: 201 },
      state: fulfilmentState(orders.F3),
    },
    {
      gap,
      area,
      title: "2.2 Save a fulfilment's tracking",
      request: {
        method: 'PATCH',
        path: at(orders.F1, `/fulfillments/${f1.id}`),
        data: { tracking: `1Z2${run}` },
      },
      attempts: supportOnly('write_fulfillments'),
      control: { caller: orderManager, status: 200 },
      state: read(`orders/${orders.F1.id}/fulfillments/${f1.id}`, fields('tracking')),
    },
    {
      gap,
      area,
      title: '2.3 Split a fulfilment',
      request: {
        method: 'PATCH',
        path: at(orders.F1, `/fulfillments/${f1.id}/split`),
        data: { variant_id: variants.first, quantity: 1 },
      },
      attempts: supportOnly('write_fulfillments'),
      control: { caller: orderManager, status: 200 },
      state: fulfilmentState(orders.F1),
    },
    {
      gap,
      area,
      title: '2.4 Mark a fulfilment as fulfilled',
      request: {
        method: 'PATCH',
        path: at(orders.F1, `/fulfillments/${f1.id}/fulfill`),
        data: { notify_customer: false },
      },
      attempts: supportOnly('write_fulfillments'),
      control: { caller: orderManager, status: 200 },
      state: fulfilmentState(orders.F1),
    },
    {
      gap,
      area,
      title: '2.5 Cancel a fulfilment',
      request: { method: 'PATCH', path: at(orders.F2, `/fulfillments/${f2.id}/cancel`) },
      attempts: supportOnly('write_fulfillments'),
      control: { caller: orderManager, status: 200 },
      state: fulfilmentState(orders.F2),
    },
    {
      gap,
      area,
      title: '2.6 Mark a shipped fulfilment as delivered',
      request: {
        method: 'PATCH',
        path: at(orders.F4, `/fulfillments/${f4.id}/mark_delivered`),
        data: { notify_customer: false },
      },
      attempts: supportOnly('write_fulfillments'),
      control: { caller: orderManager, status: 200 },
      state: fulfilmentState(orders.F4),
    },
    {
      gap,
      area,
      title: '2.7 Add tracking (a consignment)',
      request: {
        method: 'POST',
        path: `/api/v3/admin/${deliveries}`,
        data: { tracking_number: `1Z9${run}C` },
      },
      attempts: supportOnly('write_orders'),
      control: { caller: orderManager, status: 201 },
      state: deliveryState,
    },
    {
      gap,
      area,
      title: '2.8 Edit a consignment',
      request: {
        method: 'PATCH',
        path: `/api/v3/admin/${deliveries}/${consignment.id}`,
        data: { carrier: 'usps', tracking_number: `9400${run}` },
      },
      attempts: supportOnly('write_orders'),
      control: { caller: orderManager, status: 200 },
      state: deliveryState,
    },
    {
      gap,
      area,
      title: '2.9 Mark a consignment arrived',
      request: {
        method: 'PATCH',
        path: `/api/v3/admin/${deliveries}/${consignment.id}/mark_delivered`,
        data: { notify_customer: false },
      },
      attempts: supportOnly('write_orders'),
      control: { caller: orderManager, status: 200 },
      state: deliveryState,
    },
    {
      gap,
      area,
      title: '2.10 Delete a consignment',
      request: { method: 'DELETE', path: `/api/v3/admin/${deliveries}/${spare.id}` },
      attempts: supportOnly('write_orders'),
      control: { caller: orderManager, status: 204 },
      state: deliveryState,
    },
    {
      gap,
      area,
      title: '2.11 Upload a label bought elsewhere',
      request: {
        method: 'POST',
        path: `/api/v3/admin/${labels}`,
        data: {
          file_signed_id: labelFile,
          tracking_number: `1Z7${run}`,
          carrier: 'ups',
          cost: '9.40',
          currency: 'USD',
        },
      },
      attempts: supportOnly('write_orders'),
      control: { caller: orderManager, status: 201 },
      state: read(`${labels}?limit=100`, ids),
    },
    {
      gap,
      area,
      title: '2.12 Delete an uploaded label',
      // The label 2.11's allowed request recorded, found when the case runs.
      request: { method: 'DELETE', path: '' },
      attempts: supportOnly('write_orders'),
      control: { caller: orderManager, status: 204 },
      state: read(`${labels}?limit=100`, ids),
    },
    {
      gap,
      area,
      title: '2.13 Open a return',
      request: {
        method: 'POST',
        path: at(r, '/returns'),
        data: {
          items: [{ fulfillment_item_id: unitOf(r, variants.first).id, quantity: 1 }],
          reason_id: records.returnReason,
        },
      },
      attempts: both('write_orders'),
      control: { caller: orderManager, status: 201 },
      state: read(`orders/${r.id}/returns?limit=100`, ids),
    },
    {
      gap,
      area,
      title: '2.14 Open an exchange',
      request: {
        method: 'POST',
        path: at(r, '/exchanges'),
        data: {
          items: [
            {
              fulfillment_item_id: unitOf(r, variants.second).id,
              new_variant_id: variants.first,
              quantity: 1,
            },
          ],
          reason_id: records.returnReason,
        },
      },
      attempts: both('write_orders'),
      control: { caller: orderManager, status: 201 },
      state: read(`orders/${r.id}/exchanges?limit=100`, ids),
    },
    {
      gap,
      area,
      title: '2.15 Open a claim',
      request: {
        method: 'POST',
        path: at(r, '/claims'),
        data: {
          items: [{ line_item_id: lineOf(r, variants.first).id, quantity: 1 }],
          reason_id: records.claimReason,
        },
      },
      attempts: both('write_orders'),
      control: { caller: orderManager, status: 201 },
      state: read(`orders/${r.id}/claims?limit=100`, ids),
    },
    {
      gap,
      area,
      title: '2.16 Approve a requested return',
      request: { method: 'PATCH', path: at(r2, `/returns/${toApprove.id}/approve`) },
      attempts: [{ caller: packer, expected: denied('write_orders') }],
      control: { caller: orderManager, status: 200 },
      state: read(`orders/${r2.id}/returns/${toApprove.id}`, fields('status')),
    },
    {
      gap,
      area,
      title: '2.17 Cancel a requested return',
      request: { method: 'PATCH', path: at(r2, `/returns/${toCancel.id}/cancel`), data: {} },
      attempts: [{ caller: packer, expected: denied('write_orders') }],
      control: { caller: orderManager, status: 200 },
      state: read(`orders/${r2.id}/returns/${toCancel.id}`, fields('status')),
    },
    {
      gap,
      area,
      title: '2.18 Read an order',
      request: { method: 'GET', path: at(r2) },
      attempts: [{ caller: merchandiser, expected: denied('read_orders') }],
      control: { caller: support, status: 200 },
      protectedValues: [String(r2.number)],
    },
    {
      gap,
      area,
      title: '2.19 Read the returns list',
      request: { method: 'GET', path: '/api/v3/admin/returns?limit=100' },
      attempts: [{ caller: merchandiser, expected: denied('read_orders') }],
      control: { caller: support, status: 200 },
      protectedValues: [String(toApprove.number)],
    },
    {
      gap,
      area,
      title: '2.20 Read the exchanges list',
      request: { method: 'GET', path: '/api/v3/admin/exchanges?limit=100' },
      attempts: [{ caller: merchandiser, expected: denied('read_orders') }],
      control: { caller: support, status: 200 },
      protectedValues: [String(exchange.number)],
    },
    {
      gap,
      area,
      title: '2.21 Read the claims list',
      request: { method: 'GET', path: '/api/v3/admin/claims?limit=100' },
      attempts: [{ caller: merchandiser, expected: denied('read_orders') }],
      control: { caller: support, status: 200 },
      protectedValues: [String(claim.number)],
    },
  ]

  // Not P12's cases: requests a role the screens map as allowed may be refused.
  const observations = () =>
    observe(api, [
      [
        'The order manager adds a payment (row 1.10)',
        orderManager,
        {
          method: 'POST',
          path: at(orders.D, '/payments'),
          data: { payment_method_id: records.methods.cheque, amount: '1.00' },
        },
      ],
      [
        'The order manager creates a fulfilment (row 2.1)',
        orderManager,
        {
          method: 'POST',
          path: at(orders.F3, '/fulfillments'),
          data: { stock_location_id: records.locationId },
        },
      ],
      [
        'The packer marks a fulfilment as fulfilled',
        packer,
        {
          method: 'PATCH',
          path: at(orders.F6, `/fulfillments/${f6.id}/fulfill`),
          data: { notify_customer: false },
        },
      ],
      [
        'The packer adds tracking',
        packer,
        {
          method: 'POST',
          path: `/api/v3/admin/${deliveries}`,
          data: { tracking_number: `1Z9${run}D` },
        },
      ],
    ])
  return { cases, labels, observations }
}

test('the Admin API refuses the order and after-sale requests a role does not allow, within one store', async ({
  request,
  baseURL,
}) => {
  test.setTimeout(10 * 60_000)
  const base = baseURL ?? API
  const creds = getCredentials()
  await seed(base)

  const people: Record<string, Caller> = {
    admin: await adminCaller(
      request,
      'admin',
      creds.admin_email,
      creds.admin_password,
      creds.store_id,
    ),
  }
  for (const key of ['support', 'packer', 'orderManager', 'merchandiser', 'settingsViewer']) {
    people[key] = await adminCaller(request, key, teammates[key].email, PASSWORD, creds.store_id)
  }
  const call = adminCall(request, people.admin)

  const records = await seedRecords(call)
  const all: CaseResult[] = []
  all.push(...(await runCases(request, await orderCases(people, call, records))))
  const afterSale = await afterSaleCases(request, people, call, records)
  for (const item of afterSale.cases) {
    if (item.title.startsWith('2.12')) {
      const [label] = rows(await call('GET', `${afterSale.labels}?limit=100`))
      item.request.path = `/api/v3/admin/${afterSale.labels}/${label?.id}`
    }
    all.push(...(await runCases(request, [item])))
  }
  const observations = await afterSale.observations()

  const gaps = Object.fromEntries(
    (['G-91', 'G-95'] as const).map((gap) => [
      gap,
      gapResult(all.filter((item) => item.gap === gap)),
    ]),
  )
  mkdirSync(results, { recursive: true })
  writeFileSync(
    `${results}admin.json`,
    JSON.stringify({ revision, run, store: 'default', gaps, cases: all, observations }, null, 2),
  )
  const failed = all.filter((item) => item.result === 'FAIL')
  expect(
    failed.map((item) => ({ title: item.title, failures: item.failures })),
    'every case passed',
  ).toEqual([])
})
