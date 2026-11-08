import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { type APIRequestContext, expect, request } from '@playwright/test'
import {
  call,
  chequeMethods,
  type Headers,
  type Json,
  list,
  orderCustomerEmail,
  type SeededOrder,
  skus,
  variantId,
} from './orders'
import { admin } from './staff'

/**
 * The orders part 2 of batch 8's captures need, made through the Admin API
 * only, on Spree's sample catalog and customers: what an order's fulfilments
 * look like before, during and after shipping, and what its returns, exchanges
 * and claims look like at each status.
 *
 * Every placed order is paid by Spree's cheque method, so no provider is
 * called. The label is one bought elsewhere and uploaded, a one-page PDF the
 * script writes; buying one needs a carrier account the server does not load.
 * A carrier's own status updates need that account too, so a consignment here
 * is only ever waiting or delivered.
 *
 * Each order's id is kept in `results/orders-batch-8-part-2.json`, so seeding
 * again reuses the orders it made rather than placing more.
 */

const state = new URL('./results/orders-batch-8-part-2.json', import.meta.url).pathname

export const wholesaleEmail = 'wholesale@example.com'
export const noAddressEmail = 'fidelity-unaddressed-draft@example.com'
export const secondLocation = 'E2E Source Warehouse'
export const replacementSku = '4-SLICE-TOASTER-WHITE'
export const backorderedSku = '2-SLICE-TOASTER-BLACK'

/** Carrier numbers Spree recognises, and one it does not, as a freight forwarder's would be. */
export const tracking = {
  ups: '1Z999AA10123456784',
  usps: '9400111899223197428490',
  freight: 'PRO-558210',
} as const
export const freightCarrier = 'Northline Freight'
export const labelCost = '9.40'
export const settledClaimAmount = '30.00'

/** The wholesale buyer's receiving dock, invented. */
export const wholesaleAddress = {
  first_name: 'Dana',
  last_name: 'Whitfield',
  company: 'Fidelity Trading Co.',
  address1: '88 Foundry Row',
  city: 'Columbus',
  country_code: 'US',
  state_code: 'OH',
  postal_code: '43215',
  phone: '6145550177',
}

export const returnReason = 'Damaged/Defective'
export const exchangeReason = 'Different from what was ordered'
export const claimReason = 'Arrived damaged'
export const claimDeniedReason = 'Never arrived'
export const returnMemo = 'Dented on one side when it arrived.'
export const claimMemo = 'Lid cracked in transit; photos sent by email.'

export const afterSaleKeys = [
  'draft',
  'unaddressedDraft',
  'toShip',
  'awaiting',
  'shipped',
  'tracked',
  'delivered',
  'twoLocations',
  'labelled',
  'backordered',
  'priced',
  'returnable',
  'requested',
  'approved',
  'received',
  'settled',
  'credited',
  'withdrawn',
  'nothingOwed',
] as const

export type AfterSaleKey = (typeof afterSaleKeys)[number]
export type AfterSaleOrders = Record<AfterSaleKey, SeededOrder>

/** A label bought elsewhere: a one-page PDF, uploaded to private storage as the dashboard does. */
async function uploadLabel(api: APIRequestContext, headers: Headers) {
  const res = await api.post('/api/v3/admin/files', {
    headers,
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
  expect(res.ok(), await res.text()).toBeTruthy()
  return ((await res.json()) as { signed_id: string }).signed_id
}

function saved(): Partial<AfterSaleOrders> {
  return existsSync(state) ? JSON.parse(readFileSync(state, 'utf-8')) : {}
}

/** Makes each order once, reusing those an earlier run made while they still exist. */
export async function seedAfterSale(baseURL: string): Promise<AfterSaleOrders> {
  const api = await request.newContext({ baseURL })
  try {
    const { headers } = await admin(api)
    const methods = await chequeMethods(baseURL, api, headers)
    const [customer] = await list(
      api,
      headers,
      `customers?q[email_eq]=${encodeURIComponent(orderCustomerEmail)}`,
    )
    const [wholesaleBuyer] = await list(
      api,
      headers,
      `customers?q[email_eq]=${encodeURIComponent(wholesaleEmail)}`,
    )
    expect(customer, `the sample customer ${orderCustomerEmail}`).toBeTruthy()
    expect(wholesaleBuyer, `the sample wholesale buyer ${wholesaleEmail}`).toBeTruthy()
    const kettle = await variantId(api, headers, skus.kettle)
    const toaster = await variantId(api, headers, skus.toaster)
    const replacement = await variantId(api, headers, replacementSku)
    const backorderable = await variantId(api, headers, backorderedSku)
    const locations = await list(api, headers, 'stock_locations')
    const second = locations.find((location) => location.name === secondLocation)
    expect(second, `the browser tests' "${secondLocation}"`).toBeTruthy()
    const reasonId = async (path: string, name: string) => {
      const reason = (await list(api, headers, path)).find((each) => each.name === name)
      expect(reason, `the reason "${name}"`).toBeTruthy()
      return (reason as Json).id
    }
    const reasons = {
      return: await reasonId('return_reasons', returnReason),
      exchange: await reasonId('return_reasons', exchangeReason),
      claim: await reasonId('claim_reasons', claimReason),
      denied: await reasonId('claim_reasons', claimDeniedReason),
    }

    const expand = 'expand=items,fulfillments,fulfillments.fulfillment_items'
    const reload = (order: Json) => call(api, headers, 'get', `orders/${order.id}?${expand}`)
    const placed = async (items: object[], buyer: Json = customer, address?: object) => {
      const order = await call(api, headers, 'post', 'orders', {
        customer_id: buyer.id,
        ...(address
          ? { shipping_address: address, billing_address: address }
          : { use_customer_default_address: true }),
        items,
      })
      const current = await call(api, headers, 'get', `orders/${order.id}`)
      await call(api, headers, 'post', `orders/${order.id}/payments`, {
        payment_method_id: methods.cheque,
        amount: current.amount_due,
      })
      await call(api, headers, 'patch', `orders/${order.id}/complete`, { notify_customer: false })
      return reload(order)
    }
    const fulfilments = (order: Json) => order.fulfillments as Json[]
    const units = (order: Json) =>
      fulfilments(order).flatMap((fulfilment) => fulfilment.fulfillment_items as Json[])
    const unitOf = (order: Json, variant: string) =>
      units(order).find((unit) => unit.variant_id === variant) as Json
    const lineOf = (order: Json, variant: string) =>
      (order.items as Json[]).find((line) => line.variant_id === variant) as Json
    const fulfil = async (order: Json, data: object = {}) => {
      for (const fulfilment of fulfilments(order)) {
        await call(
          api,
          headers,
          'patch',
          `orders/${order.id}/fulfillments/${fulfilment.id}/fulfill`,
          { notify_customer: false, ...data },
        )
      }
      return reload(order)
    }
    const at = (order: Json, path: string) => `orders/${order.id}/${path}`
    // Three kettles and two toasters, sent, so one order carries a return, an exchange and a claim.
    const shippedForAfterSale = async () =>
      fulfil(await placed([item(kettle, 3), item(toaster, 2)]))
    const item = (variant: string, quantity = 1) => ({ variant_id: variant, quantity })

    const openReturn = (order: Json, quantity = 1) =>
      call(api, headers, 'post', at(order, 'returns'), {
        items: [{ fulfillment_item_id: unitOf(order, kettle).id, quantity }],
        reason_id: reasons.return,
        memo: returnMemo,
      })
    const openExchange = (order: Json) =>
      call(api, headers, 'post', at(order, 'exchanges'), {
        items: [
          {
            fulfillment_item_id: unitOf(order, toaster).id,
            new_variant_id: replacement,
            quantity: 1,
          },
        ],
        reason_id: reasons.exchange,
      })
    // The amount the dashboard's claim dialog fills in for one kettle, unless the claim leaves it out.
    const openClaim = (
      order: Json,
      { reason = reasons.claim, refund = true, sendReplacement = false } = {},
    ) =>
      call(api, headers, 'post', at(order, 'claims'), {
        items: [
          {
            line_item_id: lineOf(order, kettle).id,
            quantity: 1,
            ...(refund ? { refund_amount: lineOf(order, kettle).price } : {}),
            ...(sendReplacement ? { send_replacement: true } : {}),
          },
        ],
        reason_id: reason,
        memo: claimMemo,
      })
    const patch = (order: Json, path: string, data?: object) =>
      call(api, headers, 'patch', at(order, path), data)

    const recipes: Record<AfterSaleKey, () => Promise<Json>> = {
      // A draft is grouped into a fulfilment as soon as it has an address, but cannot ship.
      draft: () =>
        call(api, headers, 'post', 'orders', {
          customer_id: customer.id,
          use_customer_default_address: true,
          items: [item(kettle, 2), item(toaster)],
        }),
      // With no shipping address nothing can be grouped into a fulfilment yet.
      unaddressedDraft: () =>
        call(api, headers, 'post', 'orders', {
          email: noAddressEmail,
          items: [item(kettle), item(toaster)],
        }),
      toShip: () => placed([item(kettle, 2), item(toaster)]),
      // Its only fulfilment canceled, so its units wait for a new one.
      awaiting: async () => {
        const order = await placed([item(kettle, 2)])
        await patch(order, `fulfillments/${fulfilments(order)[0].id}/cancel`)
        return order
      },
      shipped: async () =>
        fulfil(await placed([item(kettle), item(toaster)]), { tracking: tracking.ups }),
      tracked: async () => {
        const order = await fulfil(await placed([item(kettle)]))
        const fulfilment = fulfilments(order)[0]
        const path = `fulfillments/${fulfilment.id}/deliveries`
        await call(api, headers, 'post', at(order, path), { tracking_number: tracking.ups })
        const usps = await call(api, headers, 'post', at(order, path), {
          tracking_number: tracking.usps,
          carrier: 'usps',
        })
        await call(api, headers, 'post', at(order, path), {
          tracking_number: tracking.freight,
          carrier: freightCarrier,
        })
        await patch(order, `${path}/${usps.id}/mark_delivered`)
        return order
      },
      delivered: async () => {
        const order = await fulfil(await placed([item(toaster)]), { tracking: tracking.ups })
        await patch(order, `fulfillments/${fulfilments(order)[0].id}/mark_delivered`)
        return order
      },
      // Toasters stocked at the second location, then split off to ship from there.
      twoLocations: async () => {
        await call(api, headers, 'post', 'stock_levels/bulk_upsert', {
          stock_levels: [
            { variant_id: toaster, stock_location_id: (second as Json).id, count_on_hand: 50 },
          ],
        })
        const order = await placed([item(kettle, 2), item(toaster, 2)])
        await patch(order, `fulfillments/${fulfilments(order)[0].id}/split`, {
          variant_id: toaster,
          quantity: 2,
          stock_location_id: (second as Json).id,
        })
        return order
      },
      labelled: async () => {
        const order = await placed([item(kettle)])
        await call(
          api,
          headers,
          'post',
          at(order, `fulfillments/${fulfilments(order)[0].id}/labels`),
          {
            file_signed_id: await uploadLabel(api, headers),
            tracking_number: tracking.ups,
            carrier: 'ups',
            cost: labelCost,
            currency: 'USD',
          },
        )
        return order
      },
      // None on the shelf, but the shop takes backorders for it.
      backordered: async () => {
        const [shop] = locations.filter((location) => location.default)
        await call(api, headers, 'post', 'stock_levels/bulk_upsert', {
          stock_levels: [
            {
              variant_id: backorderable,
              stock_location_id: (shop as Json).id,
              count_on_hand: 0,
              backorderable: true,
            },
          ],
        })
        return placed([item(backorderable)])
      },
      // Twelve kettles for the wholesale buyer, which the sample "Wholesale" price list prices.
      // The buyer has no address of their own, so the order is given one.
      priced: () => placed([item(kettle, 12)], wholesaleBuyer, wholesaleAddress),
      returnable: shippedForAfterSale,
      requested: async () => {
        const order = await shippedForAfterSale()
        await openReturn(order)
        await openExchange(order)
        await openClaim(order)
        return order
      },
      approved: async () => {
        const order = await shippedForAfterSale()
        await patch(order, `returns/${(await openReturn(order)).id}/approve`)
        await patch(order, `exchanges/${(await openExchange(order)).id}/approve`)
        await patch(order, `claims/${(await openClaim(order)).id}/approve`)
        return order
      },
      // Two kettles sent back, one arrived, and that one cannot be sold again.
      received: async () => {
        const order = await shippedForAfterSale()
        const opened = await openReturn(order, 2)
        await patch(order, `returns/${opened.id}/approve`)
        const lines = (
          (await call(api, headers, 'get', at(order, `returns?expand=return_line_items`)))
            .data as Json[]
        )[0].return_line_items as Json[]
        await patch(order, `returns/${opened.id}/receive`, {
          items: [{ return_line_item_id: lines[0].id, quantity: 1, resellable: false }],
        })
        const exchange = await openExchange(order)
        await patch(order, `exchanges/${exchange.id}/approve`)
        await patch(order, `exchanges/${exchange.id}/receive`)
        return order
      },
      settled: async () => {
        const order = await shippedForAfterSale()
        const opened = await openReturn(order)
        await patch(order, `returns/${opened.id}/approve`)
        const received = await patch(order, `returns/${opened.id}/receive`)
        await patch(order, `returns/${opened.id}/refund`, {
          refund_method: 'original_payment',
          amount: received.refundable_total,
        })
        const exchange = await openExchange(order)
        await patch(order, `exchanges/${exchange.id}/approve`)
        await patch(order, `exchanges/${exchange.id}/receive`)
        await patch(order, `exchanges/${exchange.id}/fulfill`, {})
        // Opened for the kettle's price and settled for less, as the resolve dialog allows.
        const claim = await openClaim(order)
        await patch(order, `claims/${claim.id}/approve`)
        await patch(order, `claims/${claim.id}/resolve`, {
          resolution: 'refund',
          refund_method: 'original_payment',
          amount: settledClaimAmount,
        })
        return order
      },
      credited: async () => {
        const order = await shippedForAfterSale()
        const opened = await openReturn(order)
        await patch(order, `returns/${opened.id}/approve`)
        const received = await patch(order, `returns/${opened.id}/receive`)
        await patch(order, `returns/${opened.id}/refund`, {
          refund_method: 'store_credit',
          amount: received.refundable_total,
        })
        // Opened with no amount, which the resolve dialog then offers as what was paid.
        const credit = await openClaim(order, { refund: false })
        await patch(order, `claims/${credit.id}/approve`)
        await patch(order, `claims/${credit.id}/resolve`, {
          resolution: 'refund',
          refund_method: 'store_credit',
          amount: lineOf(order, kettle).price,
        })
        const replace = await openClaim(order, { sendReplacement: true })
        await patch(order, `claims/${replace.id}/approve`)
        const lines = (
          (await call(api, headers, 'get', at(order, 'claims?expand=claim_line_items')))
            .data as Json[]
        ).find((claim) => claim.id === replace.id)?.claim_line_items as Json[]
        await patch(order, `claims/${replace.id}/resolve`, {
          resolution: 'replacement',
          replacement_line_item_ids: lines.map((line) => line.id),
        })
        return order
      },
      withdrawn: async () => {
        const order = await shippedForAfterSale()
        await patch(order, `returns/${(await openReturn(order)).id}/cancel`, {})
        await patch(order, `exchanges/${(await openExchange(order)).id}/cancel`, {})
        await patch(order, `claims/${(await openClaim(order)).id}/cancel`, {})
        await patch(
          order,
          `claims/${(await openClaim(order, { reason: reasons.denied })).id}/deny`,
          {},
        )
        return order
      },
      // A kettle given free, sent back: the return is owed nothing and can only be completed.
      nothingOwed: async () => {
        const order = await fulfil(await placed([{ ...item(kettle), price: '0.00' }]))
        const opened = await openReturn(order)
        await patch(order, `returns/${opened.id}/approve`)
        await patch(order, `returns/${opened.id}/receive`)
        return order
      },
    }

    const known = saved()
    const orders = {} as AfterSaleOrders
    for (const key of afterSaleKeys) {
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
