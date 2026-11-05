import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { type APIRequestContext, expect, request } from '@playwright/test'
import { ensurePaymentMethods, paymentNames } from './payments-delivery'
import { admin, PASSWORD, teammates } from './staff'

/**
 * The orders batch 8's captures need, made through the Admin API only, on
 * Spree's sample catalog and customers: drafts, placed orders in each payment
 * status, a canceled and an approved order, an order with discounts, a fee, a
 * gift card and store credit, a digital order, freight orders, an annotated
 * order and orders fulfilled in full and in part.
 *
 * Payments use Spree's cheque method only, so no provider is called: one
 * cheque method charges at checkout, the other only when staff capture it.
 * The freight orders ship by a freight method the script adds, and the
 * espresso machine is given a carton, using the browser tests' own "Master
 * carton", so the order's logistics card has figures to show; the other item
 * on the incomplete freight order has none.
 * Each order's id is kept in `results/orders-batch-8.json`, so seeding again
 * reuses the orders it made rather than placing more.
 */

export type Headers = Record<string, string>
export type Json = Record<string, unknown> & { id: string }

const prefix = 'Fidelity'
const state = new URL('./results/orders-batch-8.json', import.meta.url).pathname

export const orderPayments = {
  cheque: paymentNames.cheque,
  later: `${prefix} cheque, collected later`,
} as const

export const orderCustomerEmail = 'sarah.johnson@example.com'
export const guestEmail = 'fidelity-guest-order@example.com'
export const giftCardCode = 'FIDELITY-GIFT-40'
export const cancellationReason = 'Customer changed their mind'
export const cancellationNote = 'Called on Monday and asked us to stop it before it shipped.'
export const poNumber = 'FID-PO-4471'
export const freightMethodName = `${prefix} freight`

export const orderKeys = [
  'draft',
  'guestDraft',
  'unpaid',
  'authorized',
  'paid',
  'partlyRefunded',
  'refunded',
  'canceled',
  'approved',
  'discounted',
  'giftCard',
  'storeCredit',
  'digital',
  'freight',
  'incompleteFreight',
  'annotated',
  'fulfilled',
  'partlyFulfilled',
] as const

export type OrderKey = (typeof orderKeys)[number]

export interface SeededOrder {
  id: string
  number: string
}

export type Orders = Record<OrderKey, SeededOrder>

export const skus = {
  kettle: 'ELECTRIC-KETTLE-1-7L-WHITE',
  toaster: '2-SLICE-TOASTER-WHITE',
  espresso: 'AUTOMATIC-ESPRESSO-MACHINE-MATTE-BLACK',
  handbook: 'SPREE-HANDBOOK',
  unmeasured: 'E2E-PROMO',
} as const

export const guestAddress = {
  first_name: 'River',
  last_name: 'Okafor',
  address1: '214 Larkspur Lane',
  city: 'Portland',
  country_code: 'US',
  state_code: 'OR',
  postal_code: '97205',
  phone: '5035550142',
}

export async function call(
  api: APIRequestContext,
  headers: Headers,
  method: 'get' | 'post' | 'patch' | 'delete',
  path: string,
  data?: object,
) {
  const res = await api[method](`/api/v3/admin/${path}`, { headers, data })
  const text = await res.text()
  expect(res.ok(), `${method.toUpperCase()} ${path}: ${res.status()} ${text}`).toBeTruthy()
  return (text ? JSON.parse(text) : {}) as Json
}

export const list = async (api: APIRequestContext, headers: Headers, path: string) =>
  (await call(api, headers, 'get', `${path}${path.includes('?') ? '&' : '?'}limit=100`))
    .data as Json[]

export async function variantId(api: APIRequestContext, headers: Headers, sku: string) {
  const [variant] = await list(api, headers, `variants?q[sku_eq]=${encodeURIComponent(sku)}`)
  expect(variant, `the sample variant ${sku}`).toBeTruthy()
  return variant.id
}

/** The cheque methods: one charging at checkout, one leaving payments to capture later. */
export async function chequeMethods(baseURL: string, api: APIRequestContext, headers: Headers) {
  await ensurePaymentMethods(baseURL)
  const methods = await list(api, headers, 'payment_methods')
  let later = methods.find((method) => method.name === orderPayments.later)
  if (!later) {
    later = await call(api, headers, 'post', 'payment_methods', {
      name: orderPayments.later,
      type: 'check',
      active: false,
      storefront_visible: false,
      capture_method: 'manual',
    })
  }
  const cheque = methods.find((method) => method.name === orderPayments.cheque)
  expect(cheque, 'the cheque method').toBeTruthy()
  return { cheque: (cheque as Json).id, later: later.id }
}

/** A teammate's own headers, for a step that records who took it. */
export async function teammateHeaders(api: APIRequestContext, email: string, storeId: string) {
  const res = await api.post('/api/v3/admin/auth/login', { data: { email, password: PASSWORD } })
  expect(res.ok(), await res.text()).toBeTruthy()
  const { token } = (await res.json()) as { token: string }
  return { Authorization: `Bearer ${token}`, 'X-Spree-Store-Id': storeId }
}

function saved(): Partial<Orders> {
  return existsSync(state) ? JSON.parse(readFileSync(state, 'utf-8')) : {}
}

/** Makes each order once, reusing those an earlier run made while they still exist. */
export async function seedOrders(baseURL: string): Promise<Orders> {
  const api = await request.newContext({ baseURL })
  try {
    const { creds, headers } = await admin(api)
    const methods = await chequeMethods(baseURL, api, headers)
    const [customer] = await list(
      api,
      headers,
      `customers?q[email_eq]=${encodeURIComponent(orderCustomerEmail)}`,
    )
    expect(customer, `the sample customer ${orderCustomerEmail}`).toBeTruthy()
    const variants = Object.fromEntries(
      await Promise.all(
        Object.entries(skus).map(async ([key, sku]) => [key, await variantId(api, headers, sku)]),
      ),
    ) as Record<keyof typeof skus, string>
    const reasons = await list(api, headers, 'order_cancellation_reasons')
    const reason = reasons.find((each) => each.name === cancellationReason)
    expect(reason, `the cancellation reason "${cancellationReason}"`).toBeTruthy()
    const manager = await teammateHeaders(api, teammates.orderManager.email, creds.store_id)

    const item = (key: keyof typeof skus, quantity = 1) => ({
      variant_id: variants[key],
      quantity,
    })
    const draft = (data: object) =>
      call(api, headers, 'post', 'orders', {
        customer_id: customer.id,
        use_customer_default_address: true,
        ...data,
      })
    // The amount is the order's balance, so credit the customer holds is not taken from it.
    const pay = async (order: Json, method: string) => {
      const current = await call(api, headers, 'get', `orders/${order.id}`)
      return call(api, headers, 'post', `orders/${order.id}/payments`, {
        payment_method_id: method,
        amount: current.amount_due,
      })
    }
    const complete = (order: Json, data: object = {}) =>
      call(api, headers, 'patch', `orders/${order.id}/complete`, {
        notify_customer: false,
        ...data,
      })
    const placed = async (data: object, method = methods.cheque) => {
      const order = await draft(data)
      await pay(order, method)
      return complete(order)
    }
    const payments = async (order: Json) =>
      (await call(api, headers, 'get', `orders/${order.id}/payments`)).data as Json[]
    const fulfillments = async (order: Json) =>
      (await call(api, headers, 'get', `orders/${order.id}/fulfillments`)).data as Json[]

    // A draft is quoted with the methods the storefront offers, so the freight
    // method is shown there only while a freight order is being placed.
    const freighted = async (data: object) => {
      const method = await freightMethod()
      await call(api, headers, 'patch', `delivery_methods/${method}`, { storefront_visible: true })
      try {
        const order = await draft(data)
        const [fulfillment] = (
          await call(api, headers, 'get', `orders/${order.id}/fulfillments?expand=delivery_rates`)
        ).data as Json[]
        const rate = (fulfillment.delivery_rates as Json[]).find(
          (each) => each.delivery_method_id === method,
        )
        expect(rate, 'the freight rate').toBeTruthy()
        await call(api, headers, 'patch', `orders/${order.id}/fulfillments/${fulfillment.id}`, {
          selected_delivery_rate_id: (rate as Json).id,
        })
        await pay(order, methods.cheque)
        return await complete(order)
      } finally {
        await call(api, headers, 'patch', `delivery_methods/${method}`, {
          storefront_visible: false,
        })
      }
    }
    // Packs the espresso machine two to a carton and adds the freight method,
    // beside the store's Standard method, reusing both on later runs.
    const freightMethod = async () => {
      const [espresso] = await list(
        api,
        headers,
        `variants?q[sku_eq]=${encodeURIComponent(skus.espresso)}`,
      )
      const carton = (await list(api, headers, 'package_types')).find(
        (each) => each.kind === 'carton',
      )
      expect(carton, "the browser tests' carton").toBeTruthy()
      await call(api, headers, 'patch', `products/${espresso.product_id}/variants/${espresso.id}`, {
        units_per_carton: 2,
        carton_package_type_id: (carton as Json).id,
        carton_weight: 42,
        cartons_per_pallet: 8,
      })
      const deliveryMethods = await list(api, headers, 'delivery_methods')
      const existing = deliveryMethods.find((each) => each.name === freightMethodName)
      if (existing) return existing.id
      const standard = deliveryMethods.find((each) => each.name === 'Standard')
      expect(standard, 'the Standard delivery method').toBeTruthy()
      const made = await call(api, headers, 'post', 'delivery_methods', {
        name: freightMethodName,
        rate_provider: 'freight',
        storefront_visible: false,
        delivery_profile_id: (standard as Json).delivery_profile_id,
        delivery_zone_id: (standard as Json).delivery_zone_id,
        delivery_origin_group_id: (standard as Json).delivery_origin_group_id,
      })
      return made.id
    }

    const recipes: Record<OrderKey, () => Promise<Json>> = {
      // The toaster's price is negotiated, as staff agree one before the order is placed.
      draft: () => draft({ items: [item('kettle', 2), { ...item('toaster'), price: '35.00' }] }),
      guestDraft: () =>
        call(api, headers, 'post', 'orders', {
          email: guestEmail,
          shipping_address: guestAddress,
          billing_address: guestAddress,
          items: [item('toaster')],
        }),
      unpaid: async () =>
        complete(await draft({ items: [item('kettle')] }), { payment_pending: true }),
      authorized: () => placed({ items: [item('kettle'), item('toaster')] }, methods.later),
      paid: () => placed({ items: [item('kettle'), item('toaster')] }),
      partlyRefunded: async () => {
        const order = await placed({ items: [item('kettle', 2)] })
        const [payment] = await payments(order)
        await call(api, headers, 'post', `orders/${order.id}/refunds`, {
          payment_id: payment.id,
          amount: '20.00',
        })
        return order
      },
      refunded: async () => {
        const order = await placed({ items: [item('toaster')] })
        const [payment] = await payments(order)
        await call(api, headers, 'post', `orders/${order.id}/refunds`, {
          payment_id: payment.id,
          amount: payment.amount,
        })
        return order
      },
      canceled: async () => {
        const order = await placed({ items: [item('kettle')] })
        // Canceled by the order manager, so the order names a teammate.
        await call(api, manager, 'patch', `orders/${order.id}/cancel`, {
          cancel_reason_id: (reason as Json).id,
          cancel_note: cancellationNote,
          refund_payments: true,
          notify_customer: false,
        })
        return order
      },
      approved: async () => {
        const order = await placed({ items: [item('toaster', 2)] })
        await call(api, headers, 'patch', `orders/${order.id}/approve`)
        return order
      },
      discounted: async () => {
        const order = await draft({ items: [item('kettle', 2)] })
        await call(api, headers, 'post', `orders/${order.id}/discounts`, {
          label: 'Goodwill for the late delivery',
          value: '5.00',
        })
        await call(api, headers, 'post', `orders/${order.id}/fees`, {
          label: 'Gift wrap',
          amount: '4.50',
          kind: 'gift_wrap',
        })
        await call(api, headers, 'post', `orders/${order.id}/discount_codes`, { code: 'freeship' })
        await pay(order, methods.cheque)
        return complete(order)
      },
      giftCard: async () => {
        // Spree keeps gift card codes in lower case.
        const cards = await list(api, headers, 'gift_cards')
        if (!cards.some((card) => String(card.code).toLowerCase() === giftCardCode.toLowerCase())) {
          await call(api, headers, 'post', 'gift_cards', {
            code: giftCardCode,
            amount: '40.00',
            currency: 'USD',
          })
        }
        const order = await draft({ items: [item('kettle', 2)] })
        await call(api, headers, 'post', `orders/${order.id}/gift_cards`, { code: giftCardCode })
        await pay(order, methods.cheque)
        return complete(order)
      },
      // Spree takes no store credit on an order that already has a gift card, so it has its own.
      storeCredit: async () => {
        await call(api, headers, 'post', `customers/${customer.id}/store_credits`, {
          amount: '15.00',
          currency: 'USD',
          memo: 'Goodwill for a late parcel',
        })
        const order = await draft({ items: [item('kettle', 2)] })
        await call(api, headers, 'post', `orders/${order.id}/store_credits`, { amount: '15.00' })
        await pay(order, methods.cheque)
        return complete(order)
      },
      digital: () => placed({ items: [item('handbook')] }),
      freight: () => freighted({ items: [item('espresso', 4)], po_number: poNumber }),
      incompleteFreight: () => freighted({ items: [item('espresso', 2), item('unmeasured')] }),
      annotated: () =>
        placed({
          items: [item('toaster')],
          tags: ['VIP', 'Gift'],
          customer_note: 'Please leave it with the neighbour at number 216 if no one is home.',
          internal_note: 'Repeat customer. Offer the loyalty code on the next order.',
          metadata: { source: 'phone', campaign: 'autumn-2026' },
        }),
      fulfilled: async () => {
        const order = await placed({ items: [item('toaster')] })
        for (const fulfillment of await fulfillments(order)) {
          await call(
            api,
            headers,
            'patch',
            `orders/${order.id}/fulfillments/${fulfillment.id}/fulfill`,
            {
              notify_customer: false,
            },
          )
        }
        return order
      },
      partlyFulfilled: async () => {
        const order = await placed({ items: [item('kettle', 2), item('toaster')] })
        const kettle = (
          (await call(api, headers, 'get', `orders/${order.id}/items`)).data as Json[]
        ).find((line) => line.variant_id === variants.kettle) as Json
        const [fulfillment] = await fulfillments(order)
        await call(
          api,
          headers,
          'patch',
          `orders/${order.id}/fulfillments/${fulfillment.id}/fulfill`,
          {
            items: [{ item_id: kettle.id, quantity: 2 }],
            notify_customer: false,
          },
        )
        return order
      },
    }

    const known = saved()
    const orders = {} as Orders
    for (const key of orderKeys) {
      const previous = known[key]
      if (previous) {
        const res = await api.get(`/api/v3/admin/orders/${previous.id}`, { headers })
        if (res.ok()) {
          orders[key] = previous
          continue
        }
      }
      const made = await recipes[key]()
      orders[key] = { id: made.id, number: made.number as string }
      mkdirSync(new URL('./results/', import.meta.url).pathname, { recursive: true })
      writeFileSync(state, JSON.stringify({ ...known, ...orders }, null, 2))
    }
    return orders
  } finally {
    await api.dispose()
  }
}
